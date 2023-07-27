from typing import Dict, List
import torch
import torch.nn as nn
from PIL import Image
from torch.nn import functional as F
from torchvision import models, transforms
import numpy as np

from google.cloud.aiplatform.prediction.predictor import Predictor
from google.cloud.aiplatform.utils import prediction_utils
import os
import base64
import io

class CustomPredictor(Predictor):
    """Interface of the Predictor class for Custom Prediction Routines.
    The Predictor is responsible for the ML logic for processing a prediction request.
    Specifically, the Predictor must define:
    (1) How to load all model artifacts used during prediction into memory.
    (2) The logic that should be executed at predict time.
    When using the default PredictionHandler, the Predictor will be invoked as follows:
      predictor.postprocess(predictor.predict(predictor.preprocess(prediction_input)))
    """

    def load(self, artifacts_uri: str) -> None:
        """Loads the model artifact.
        Args:
            artifacts_uri (str):
                Required. The value of the environment variable AIP_STORAGE_URI.
        """
        prediction_utils.download_model_artifacts(artifacts_uri)
        print(os.listdir('./'))
        print(os.listdir('../../'))
        self._model = models.resnet50()
        self._model.fc = nn.Sequential(nn.Linear(2048, 128), nn.ReLU(inplace=True), nn.Linear(128, 2))
        self._model.load_state_dict(torch.load('./weights.pt'))

    def preprocess(self, prediction_input: List[Dict]) -> Dict[str, torch.Tensor]:
        """Preprocesses the prediction input before doing the prediction.
        Args:
            prediction_input (Any):
                Required. The prediction input that needs to be preprocessed.
        Returns:
            The preprocessed prediction input.
        """
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
        base64image = prediction_input[0]['image']
        # convert base64 string to bytes
        image_bytes = base64.b64decode(base64image)
        # create a bytes buffer for the decoded data
        image_buf = io.BytesIO(image_bytes)
        # create a PIL Image object
        image = Image.open(image_buf).convert("RGB")
        transformed_image = data_transforms["api"](image)
        return transformed_image

    def predict(self, inputs: torch.Tensor) -> np.ndarray:
        """Performs prediction.
        Args:
            instances (Any):
                Required. The instance(s) used for performing prediction.
        Returns:
            Prediction results.
        """
        prediction = self._model(inputs.unsqueeze(0))
        prediction_probs = F.softmax(prediction, dim=1)
        return prediction_probs.detach().numpy()[0]

    def postprocess(self, prediction_results: np.ndarray) -> Dict[str, str]:
        """Postprocesses the prediction results.
        Args:
            prediction_results (Any):
                Required. The prediction results.
        Returns:
            The postprocessed prediction results.
        """
        prob_negative, prob_positive = prediction_results
        prediction_results = {"prediction": 1} if prob_positive > prob_negative else {"prediction": 0}
        return prediction_results