from transformers import DistilBertTokenizer, TFDistilBertForSequenceClassification
from typing import Dict, List
import tensorflow as tf
import keras
import numpy as np

from google.cloud.aiplatform.prediction.predictor import Predictor
from google.cloud.aiplatform.utils import prediction_utils
import os

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
        self._model = keras.models.load_model('./')  
        self._tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')

    def preprocess(self, prediction_input: List[Dict]) -> Dict[str, tf.Tensor]:
        """Preprocesses the prediction input before doing the prediction.
        Args:
            prediction_input (Any):
                Required. The prediction input that needs to be preprocessed.
        Returns:
            The preprocessed prediction input.
        """
        instances = prediction_input[0]['text']#[instance['text'] for instance in prediction_input]
        # Tokenize the text
        inputs = self._tokenizer(instances, truncation=True, padding=True, return_tensors="tf")
        return inputs

    def predict(self, inputs: Dict[str, tf.Tensor]) -> np.ndarray:
        """Performs prediction.
        Args:
            instances (Any):
                Required. The instance(s) used for performing prediction.
        Returns:
            Prediction results.
        """
        inputs = {'input_ids': inputs['input_ids'], 'attention_mask': inputs['attention_mask']}
        prediction = self._model.predict(inputs)
        return prediction

    def postprocess(self, prediction_results: np.ndarray) -> Dict[str, str]:
        """Postprocesses the prediction results.
        Args:
            prediction_results (Any):
                Required. The prediction results.
        Returns:
            The postprocessed prediction results.
        """
        # Apply softmax to the array
        print(prediction_results)
        output_softmax = tf.nn.softmax(prediction_results['logits'][0]).numpy()
        output_softmax_list = output_softmax.tolist()
        print(output_softmax)
        # Take the class with the highest score
        prediction = np.argmax(output_softmax)
        confidence = output_softmax[prediction]
        # assign label names to the predicted classes
        if prediction == 0:
            prediction = "Blank"
        else:
            prediction = "Bard"
        print(prediction)
        # Return the label (0: Blank or 1: Bard) and the score (between 0 and 1)
        prediction_results = {"label": prediction, "score": str(confidence), "softmax": output_softmax_list}

        return prediction_results