import sys

import torch
import torch.nn as nn
from fastapi import FastAPI, File, UploadFile
from loguru import logger
from PIL import Image
from torch.nn import functional as F
from torchvision import models, transforms

app = FastAPI()
logger.remove()
logger.add(
    sys.stdout,
    colorize=True,
    format="<green>{time:HH:mm:ss}</green> | {level} | <level>{message}</level>",
)


@app.post("/predict")
async def predict(file: UploadFile = File(...)):

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
    logger.info(f"Prob negative: {prob_negative}")
    logger.info(f"Prob positive: {prob_positive}")
    return {"prediction": 1} if prob_positive > prob_negative else {"prediction": 0}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("face_reco_service:app", host="localhost", port=8080, reload=True)
