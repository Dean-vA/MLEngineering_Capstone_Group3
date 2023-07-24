from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, UploadFile, File
from google.auth import default
from google.auth.transport import requests as grequests
import requests
import json
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import openai

import torch
import torch.nn as nn
from PIL import Image
from torch.nn import functional as F
from torchvision import models, transforms

app = FastAPI()
load_dotenv()  # take environment variables from .env.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
openai.api_key = OPENAI_API_KEY

class Text(BaseModel):
    text: str

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://blank-to-bard-frontend-bi2gia7neq-ez.a.run.app"],  # Change this to the actual URL of your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to the auth middleman blank-to-bard API!"}

@app.post("/transcribe/{language}")
async def transcribe_audio(audio: UploadFile = File(...), language: str = "en"):
    # Save temporary audio file
    with open("temp_audio.mp3", "wb") as buffer:
        buffer.write(await audio.read())

     # Transcribe the audio
    with open("temp_audio.mp3", "rb") as audio_file:
        result = openai.Audio.transcribe("whisper-1", audio_file, language=language)

    return {"transcription": result["text"]}

@app.post("/classifier/predict")
async def predict(text: Text):
    print('incoming request: ', text)
    # Generate access token
    credentials, project = default()
    auth_request = grequests.Request()
    credentials.refresh(auth_request)
    access_token = credentials.token
    # Prepare the data in the required format
    data = {
        'instances': [{'text': str(text.text)}],
    }
    print('data: ', data)
    # Send request to Vertex AI
    project_id = '260219834114'
    endpoint_id = '5000042321450893312'
    response = requests.post(
        f'https://europe-west4-aiplatform.googleapis.com/v1/projects/{project_id}/locations/europe-west4/endpoints/{endpoint_id}:predict',
        headers={
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json',
        },
        data=json.dumps(data),
    )

    return response.json()


@app.post("/face_classifier/predict")
async def face_predict(file: UploadFile = File(...)):

    data_transforms = {
        "api": transforms.Compose(
            [
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]
                ),
            ]
        ),
    }
    model = models.resnet50()
    model.fc = nn.Sequential(
        nn.Linear(2048, 128), nn.ReLU(inplace=True), nn.Linear(128, 2)
    )
    model.load_state_dict(torch.load("models/weights.pt"))
    request = Image.open(file.file).convert("RGB")
    request_transformed = data_transforms["api"](request)
    pred = model(request_transformed.unsqueeze(0))
    pred_probs = F.softmax(pred, dim=1)
    prob_negative, prob_positive = pred_probs.detach().numpy()[0]
    return {"prediction": 1} if prob_positive > prob_negative else {"prediction": 0}
