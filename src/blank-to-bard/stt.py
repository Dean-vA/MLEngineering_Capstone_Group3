from fastapi import FastAPI, UploadFile, File
import whisper

app = FastAPI()

# Load the model when the application starts
model = whisper.load_model("base")

@app.get("/")
# Define a root `/` endpoint that shows all the available endpoints
async def root():
    return {"message": "Welcome to Whisper STT API!"}

@app.post("/transcribe")
async def transcribe_audio(audio: UploadFile = File(...)):
    # Save temporary audio file
    with open("temp_audio.mp3", "wb") as buffer:
        buffer.write(await audio.read())

    # Transcribe the audio
    result = model.transcribe("temp_audio.mp3")

    return {"transcription": result["text"]}

# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8000)




