#!/usr/bin/env python3
import os
import sys
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

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

def load_and_preprocess_image(image_path):
    """
    Load and preprocess an image for model inference
    """
    try:
        # Load the image
        img = tf.keras.preprocessing.image.load_img(image_path, target_size=(128, 128))
        
        # Convert to array
        img_array = tf.keras.preprocessing.image.img_to_array(img)
        
        # Add batch dimension
        img_array = np.array([img_array])
        
        return img_array
    
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        raise

def predict_disease(image_path):
    """
    Run inference on a tea leaf image and return the prediction results
    """
    try:
        # Path to the model - try several variations
        model_paths = [
            os.path.join(os.path.dirname(__file__), 'models', 'tea_disease_model.keras'),
            os.path.join(os.path.dirname(__file__), 'models', 'tea_disease_model.h5'),
            os.path.join(os.path.dirname(__file__), '..', '..', 'Teasikcnesmodel', 'trained_model.keras'),
            os.path.join(os.path.dirname(__file__), '..', '..', 'Teasikcnesmodel', 'trained_model.h5')
        ]
        
        # Try to find a valid model path
        for model_path in model_paths:
            if os.path.exists(model_path):
                logger.info(f"Found model at: {model_path}")
                break
        else:
            # No model file found
            raise FileNotFoundError(f"No model file found in any of the expected locations: {model_paths}")
        
        # Load the model
        logger.info(f"Loading model from {model_path}")
        model = load_model(model_path)
        
        # Load and preprocess the image
        logger.info(f"Processing image from {image_path}")
        img_array = load_and_preprocess_image(image_path)
        
        # Make prediction
        logger.info("Running inference")
        predictions = model.predict(img_array)
        
        # Get the predicted class index
        result_index = np.argmax(predictions[0])
        
        # Format results for all classes
        all_predictions = []
        for i, confidence in enumerate(predictions[0]):
            all_predictions.append({
                "disease": CLASS_LABELS[i],
                "confidence": float(confidence)
            })
        
        # Sort by confidence (descending)
        all_predictions.sort(key=lambda x: x["confidence"], reverse=True)
        
        # Get top prediction
        top_disease = CLASS_LABELS[result_index]
        top_confidence = float(predictions[0][result_index])
        
        # Get treatment recommendation
        treatment = TREATMENTS.get(top_disease, "No specific treatment recommendation available.")
        
        # Determine if healthy
        is_healthy = top_disease.lower() == "healthy"
        
        # Prepare response
        response = {
            "success": True,
            "prediction": top_disease,
            "disease": top_disease,  # Include both formats for compatibility
            "confidence": top_confidence,
            "treatment": treatment,
            "all_predictions": all_predictions,
            "healthy": is_healthy,
            "is_healthy": is_healthy,  # Include both formats for compatibility
            "message": f"The analysis detected {top_disease} with {top_confidence*100:.1f}% confidence."
        }
        
        if is_healthy:
            response["message"] = "Good news! The tea leaves appear to be healthy."
        
        return response
    
    except Exception as e:
        logger.error(f"Prediction failed: {str(e)}")
        return {"error": str(e), "success": False}

def main():
    """
    Main function to process command line arguments and run prediction
    """
    # Check if image path is provided
    if len(sys.argv) != 2:
        result = {"error": "Usage: python test_model.py <image_path>", "success": False}
        print(json.dumps(result))
        return 1
    
    image_path = sys.argv[1]
    
    # Check if file exists
    if not os.path.exists(image_path):
        result = {"error": f"Image file not found: {image_path}", "success": False}
        print(json.dumps(result))
        return 1
    
    try:
        # Run prediction
        result = predict_disease(image_path)
        
        # Print result as JSON
        print(json.dumps(result))
        return 0
        
    except Exception as e:
        result = {"error": f"Prediction failed: {str(e)}", "success": False}
        print(json.dumps(result))
        return 1

if __name__ == "__main__":
    sys.exit(main()) 