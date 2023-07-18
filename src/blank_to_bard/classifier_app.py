from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

from blank_to_bard.binary_classifier_predictor import CustomPredictor

app = FastAPI()

predictor = CustomPredictor()
predictor.load('gs://blank-to-bard/model/saved_model/1/')
#predictor.load(r'C:\Users\aswegen.d\Dropbox\0_Buas\Courses\ML Engineering Masterclass\Capstone\MLEngineering_Capstone_Group3\models\binary_classifier')

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://blank-to-bard-frontend-bi2gia7neq-ez.a.run.app"],  # Change this to the actual URL of your frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
# Define a root `/` endpoint that shows all the available endpoints
async def root():
    return {"message": "Welcome to the blank-to-bard classifier API!"}

@app.get("/health")
def health_check():
    return {"status": "Healthy"}


@app.post("/predict")
async def predict(text: str):
    string_input = {"instances": [text]}
    prediction = predictor.postprocess(predictor.predict(predictor.preprocess(string_input)))
    return {"predictions": [prediction]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)

