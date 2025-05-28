import os
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import logging
from typing import Dict, List, Union, Optional
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('model_prediction')

# Update these according to your model's requirements
MODEL_CONFIG = {
    'input_size': (224, 224),  # Model's expected input size
    'input_channels': 3,       # RGB=3, Grayscale=1
    'normalize_input': True,   # Whether to divide pixel values by 255
    'model_filename': 'model.keras',  # Your model filename
}

# Update these with your model's classes
CLASS_LABELS = [
    'class_1',
    'class_2',
    # Add your classes here
]

class ModelPredictor:
    def __init__(self):
        self.model = None
        
    def load_model(self) -> None:
        """Load the pre-trained model"""
        try:
            if self.model is None:
                model_path = os.path.join(
                    os.path.dirname(__file__), 
                    'models', 
                    MODEL_CONFIG['model_filename']
                )
                logger.info(f"Loading model from {model_path}")
                self.model = tf.keras.models.load_model(model_path)
                logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            raise Exception(f"Failed to load model: {str(e)}")

    def preprocess_image(self, image_data: bytes) -> np.ndarray:
        """
        Preprocess the image for prediction
        
        Args:
            image_data: Raw image bytes
            
        Returns:
            Preprocessed image array ready for prediction
        """
        try:
            # Open image from binary data
            img = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if needed
            if img.mode != 'RGB' and MODEL_CONFIG['input_channels'] == 3:
                img = img.convert('RGB')
            
            # Resize to expected input size
            img = img.resize(MODEL_CONFIG['input_size'])
            
            # Convert to numpy array
            img_array = np.array(img)
            
            # Normalize if required
            if MODEL_CONFIG['normalize_input']:
                img_array = img_array / 255.0
            
            # Add batch dimension
            img_array = np.expand_dims(img_array, axis=0)
            
            return img_array
            
        except Exception as e:
            logger.error(f"Image preprocessing failed: {str(e)}")
            raise Exception(f"Failed to process image: {str(e)}")

    def predict(self, image_data: bytes) -> Dict:
        """
        Process an image and return predictions
        
        Args:
            image_data: Raw image bytes
            
        Returns:
            Dictionary containing prediction results
        """
        try:
            # Ensure model is loaded
            self.load_model()
            
            # Preprocess the image
            logger.info("Preprocessing image")
            processed_image = self.preprocess_image(image_data)
            
            # Make prediction
            logger.info("Running prediction")
            predictions = self.model.predict(processed_image)
            
            # Format results
            results = []
            for i, confidence in enumerate(predictions[0]):
                results.append({
                    "class": CLASS_LABELS[i],
                    "confidence": float(confidence)
                })
            
            # Sort by confidence (descending)
            results.sort(key=lambda x: x["confidence"], reverse=True)
            
            response = {
                "success": True,
                "prediction": results[0]["class"],
                "confidence": float(results[0]["confidence"]),
                "all_predictions": results
            }
            
            return response
            
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }

# Create a global predictor instance
predictor = ModelPredictor()

def predict_from_file(image_path: str) -> Dict:
    """
    Utility function to predict from a file path
    
    Args:
        image_path: Path to the image file
        
    Returns:
        Prediction results dictionary
    """
    try:
        with open(image_path, 'rb') as f:
            image_data = f.read()
        return predictor.predict(image_data)
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to process file: {str(e)}"
        }

if __name__ == "__main__":
    # Example usage
    import sys
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        result = predict_from_file(image_path)
        print(json.dumps(result, indent=2)) 