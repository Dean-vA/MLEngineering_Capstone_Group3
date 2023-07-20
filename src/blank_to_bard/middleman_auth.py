from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from google.auth import default
from google.auth.transport import requests as grequests
import requests
import json
from pydantic import BaseModel

app = FastAPI()

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
    return {"message": "Welcome to the auth middleman!"}

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
