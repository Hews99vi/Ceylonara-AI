import os
import tensorflow as tf
import numpy as np
from PIL import Image
import io
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('tea_disease_detection')

# Class labels for tea diseases
CLASS_LABELS = {
    0: "Anthracnose",
    1: "Algal Leaf", 
    2: "Bird Eye Spot",
    3: "Brown Blight",
    4: "Gray Blight",
    5: "Healthy",
    6: "Red Leaf Spot",
    7: "White Spot"
}

# Path to the model file - adjust as needed
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models/tea_disease_model.keras')

# Global model instance
model = None

def load_model():
    """Load the pre-trained model"""
    global model
    try:
        if model is None:
            logger.info(f"Loading model from {MODEL_PATH}")
            model = tf.keras.models.load_model(MODEL_PATH)
            logger.info("Model loaded successfully")
        return model
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise Exception(f"Failed to load model: {str(e)}")

def preprocess_image(image_data):
    """Preprocess the image for prediction"""
    try:
        # Open image from binary data
        img = Image.open(io.BytesIO(image_data))
        
        # Resize to expected input size (224x224)
        img = img.resize((224, 224))
        
        # Convert to numpy array and normalize
        img_array = np.array(img) / 255.0
        
        # Add batch dimension
        img_array = np.expand_dims(img_array, axis=0)
        
        return img_array
    except Exception as e:
        logger.error(f"Image preprocessing failed: {str(e)}")
        raise Exception(f"Failed to process image: {str(e)}")

def predict_disease(image_data):
    """
    Process an image and return disease predictions
    
    Args:
        image_data (bytes): Binary image data
        
    Returns:
        dict: Prediction results with disease classification and confidences
    """
    try:
        # Ensure model is loaded
        model = load_model()
        
        # Preprocess the image
        logger.info("Preprocessing image")
        processed_image = preprocess_image(image_data)
        
        # Make prediction
        logger.info("Running prediction")
        start_time = datetime.now()
        predictions = model.predict(processed_image)
        elapsed = (datetime.now() - start_time).total_seconds()
        logger.info(f"Prediction completed in {elapsed:.2f} seconds")
        
        # Format results
        results = []
        for i, confidence in enumerate(predictions[0]):
            results.append({
                "disease": CLASS_LABELS[i],
                "confidence": float(confidence)
            })
        
        # Sort by confidence (descending)
        results.sort(key=lambda x: x["confidence"], reverse=True)
        
        # Determine if the plant is diseased
        is_healthy = results[0]["disease"] == "Healthy" and results[0]["confidence"] > 0.5
        
        response = {
            "healthy": is_healthy,
            "predictions": results,
            "top_prediction": results[0]["disease"],
            "confidence": float(results[0]["confidence"]),
            "processing_time": elapsed
        }
        
        return response
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        raise Exception(f"Disease detection failed: {str(e)}")

# Initialize model on module import
try:
    load_model()
except Exception as e:
    logger.warning(f"Model loading deferred: {str(e)}") 