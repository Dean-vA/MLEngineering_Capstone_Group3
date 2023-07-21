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
