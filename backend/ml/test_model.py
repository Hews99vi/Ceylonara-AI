#!/usr/bin/env python3
import os
import sys
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import logging
from PIL import Image

# Configure logging with more detail
logging.basicConfig(
    level=logging.DEBUG,  # Changed to DEBUG for more detail
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stderr),  # Log to stderr for Node.js to capture
        logging.FileHandler(os.path.join(os.path.dirname(__file__), 'disease_detection.log'))
    ]
)
logger = logging.getLogger(__name__)

# Log startup information
logger.info("Script started")
logger.info(f"Python version: {sys.version}")
logger.info(f"TensorFlow version: {tf.__version__}")
logger.info(f"NumPy version: {np.__version__}")
logger.info(f"Working directory: {os.getcwd()}")

# Define class labels - MUST match the ones in Teasikcnesmodel/predict.py
CLASS_LABELS = [
    'Anthracnose',
    'algal leaf',
    'bird eye spot', 
    'brown blight',
    'gray light',
    'healthy',
    'red leaf spot',
    'white spot'
]

# Treatment recommendations
TREATMENTS = {
    "Anthracnose": "Prune affected branches and apply fungicides containing copper or mancozeb. Ensure proper spacing between plants for good air circulation.",
    "algal leaf": "Remove affected leaves and apply copper oxychloride. Improve drainage and reduce humidity around plants.",
    "bird eye spot": "Apply fungicides containing carbendazim or copper. Enhance soil nutrition with balanced fertilizers.",
    "brown blight": "Prune affected areas and apply triazole fungicides. Avoid overhead irrigation.",
    "gray light": "Apply sulfur-based fungicides and ensure good air circulation by proper spacing and pruning.",
    "healthy": "Continue with regular maintenance and preventive practices to keep plants healthy.",
    "red leaf spot": "Remove infected leaves and apply fungicides containing chlorothalonil. Improve soil drainage.",
    "white spot": "Use copper-based fungicides and maintain proper spacing. Avoid excessive nitrogen fertilization."
}

def load_and_preprocess_image(image_path, target_size=(128, 128)):
    """
    Load and preprocess an image for model inference
    """
    try:
        # Open and validate the image
        try:
            with Image.open(image_path) as img:
                # Convert to RGB if needed
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Resize image using BILINEAR interpolation (same as training)
                img = img.resize(target_size, Image.BILINEAR)
                
                # Convert to numpy array WITHOUT normalization (same as training)
                img_array = np.array(img)
                
                # Add batch dimension
                img_array = np.expand_dims(img_array, axis=0)
                
                # Convert to float32 but keep 0-255 range (same as training)
                img_array = img_array.astype('float32')
                
                logger.info(f"Image preprocessed - Shape: {img_array.shape}, Range: [{img_array.min()}, {img_array.max()}]")
                return img_array
                
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {str(e)}")
            raise ValueError(f"Invalid image file: {str(e)}")
    
    except Exception as e:
        logger.error(f"Error in load_and_preprocess_image: {str(e)}")
        raise

def predict_disease(image_path):
    """
    Run inference on a tea leaf image and return the prediction results
    """
    try:
        logger.info(f"Starting prediction for image: {image_path}")
        
        # Path to the model - try several variations
        model_paths = [
            # Try models in Teasikcnesmodel first (they might be more reliable)
            os.path.join(os.path.dirname(__file__), '..', '..', 'Teasikcnesmodel', 'trained_model.keras'),
            os.path.join(os.path.dirname(__file__), '..', '..', 'Teasikcnesmodel', 'trained_model_v20250412_035536.keras'),
            os.path.join(os.path.dirname(__file__), '..', '..', 'Teasikcnesmodel', 'trained_model_v20250327_044552.keras'),
            os.path.join(os.path.dirname(__file__), '..', '..', 'Teasikcnesmodel', 'trained_model.h5'),
            # Then try models in backend/ml/models
            os.path.join(os.path.dirname(__file__), 'models', 'tea_disease_model.keras'),
            os.path.join(os.path.dirname(__file__), 'models', 'tea_disease_model.h5')
        ]
        
        # Log all potential model paths
        for path in model_paths:
            logger.debug(f"Checking model path: {path} (exists: {os.path.exists(path)})")
        
        # Try each model path until one works
        model = None
        load_error = None
        
        for path in model_paths:
            if os.path.exists(path):
                try:
                    logger.info(f"Attempting to load model from {path}")
                    model = load_model(path)
                    logger.info(f"Successfully loaded model from {path}")
                    break
                except Exception as e:
                    logger.warning(f"Failed to load model from {path}: {str(e)}")
                    load_error = e
                    continue
        
        if model is None:
            raise ValueError(f"Failed to load model from any available path. Last error: {str(load_error)}")
        
        # Validate image path
        if not os.path.exists(image_path):
            logger.error(f"Image not found: {image_path}")
            raise FileNotFoundError(f"Image file not found: {image_path}")
        
        # Log image details
        try:
            with Image.open(image_path) as img:
                logger.info(f"Image details - Format: {img.format}, Size: {img.size}, Mode: {img.mode}")
        except Exception as e:
            logger.error(f"Error reading image metadata: {str(e)}")
        
        # Load and preprocess the image
        logger.info(f"Processing image from {image_path}")
        try:
            img_array = load_and_preprocess_image(image_path)
            logger.info(f"Image preprocessed successfully - Shape: {img_array.shape}, Range: [{img_array.min()}, {img_array.max()}]")
        except Exception as e:
            logger.error(f"Image preprocessing failed: {str(e)}")
            raise ValueError(f"Failed to process image: {str(e)}")
        
        # Make prediction with error handling
        try:
            logger.info("Running inference")
            predictions = model.predict(img_array, verbose=0)
            logger.info(f"Prediction completed successfully - Shape: {predictions.shape}")
        except Exception as e:
            logger.error(f"Prediction failed: {str(e)}")
            raise ValueError(f"Failed to run prediction: {str(e)}")
        
        # Get the predicted class index
        result_index = np.argmax(predictions[0])
        
        # Format results
        all_predictions = []
        for i, confidence in enumerate(predictions[0]):
            all_predictions.append({
                "disease": CLASS_LABELS[i],
                "confidence": float(confidence)
            })
            logger.debug(f"Class {CLASS_LABELS[i]}: {confidence:.4f}")
        
        # Sort by confidence
        all_predictions.sort(key=lambda x: x["confidence"], reverse=True)
        
        # Get top prediction
        top_disease = CLASS_LABELS[result_index]
        top_confidence = float(predictions[0][result_index])
        
        logger.info(f"Top prediction: {top_disease} ({top_confidence*100:.1f}%)")
        
        # Get treatment recommendation
        treatment = TREATMENTS.get(top_disease, "No specific treatment recommendation available.")
        
        # Determine if healthy
        is_healthy = top_disease.lower() == "healthy"
        
        # Prepare response
        response = {
            "success": True,
            "prediction": top_disease,
            "disease": top_disease,
            "confidence": top_confidence,
            "treatment": treatment,
            "all_predictions": all_predictions,
            "healthy": is_healthy,
            "is_healthy": is_healthy,
            "message": f"The analysis detected {top_disease} with {top_confidence*100:.1f}% confidence."
        }
        
        if is_healthy:
            response["message"] = "Good news! The tea leaves appear to be healthy."
        
        logger.info("Prediction completed successfully")
        return response
    
    except Exception as e:
        logger.error(f"Prediction failed with error: {str(e)}", exc_info=True)
        return {
            "success": False,
            "error": str(e)
        }

def main():
    """
    Main function to process command line arguments and run prediction
    """
    # Check if image path is provided
    if len(sys.argv) != 2:
        result = {"success": False, "error": "Usage: python test_model.py <image_path>"}
        print(json.dumps(result))
        return 1
    
    image_path = sys.argv[1]
    
    try:
        # Run prediction
        result = predict_disease(image_path)
        
        # Print result as JSON
        print(json.dumps(result))
        return 0 if result.get("success", False) else 1
        
    except Exception as e:
        result = {"success": False, "error": f"Prediction failed: {str(e)}"}
        print(json.dumps(result))
        return 1

if __name__ == "__main__":
    sys.exit(main()) 