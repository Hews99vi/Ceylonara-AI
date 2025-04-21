import tensorflow as tf
import numpy as np
import os
import sys
import json

# Define class names from the model
class_names = [
    'Anthracnose',
    'algal leaf',
    'bird eye spot',
    'brown blight',
    'gray light',
    'healthy',
    'red leaf spot',
    'white spot'
]

def load_model():
    """Load the trained Keras model"""
    try:
        model_path = os.path.join(os.path.dirname(__file__), 'trained_model.keras')
        model = tf.keras.models.load_model(model_path)
        return model
    except Exception as e:
        print(json.dumps({
            "success": False,
            "error": f"Error loading model: {str(e)}"
        }))
        sys.exit(1)

def predict_disease(image_path):
    """Make a prediction on the given image"""
    try:
        model = load_model()
        
        # Preprocess the image
        image = tf.keras.preprocessing.image.load_img(image_path, target_size=(128, 128))
        input_arr = tf.keras.preprocessing.image.img_to_array(image)
        input_arr = np.array([input_arr])  # Convert single image to a batch
        
        # Make prediction
        prediction = model.predict(input_arr)
        result_index = np.argmax(prediction)  # Get the index of the highest probability
        
        # Get confidence levels for all classes
        confidence_levels = prediction[0].tolist()
        
        # Create result object
        result = {
            "success": True,
            "disease": class_names[result_index],
            "confidence": float(prediction[0][result_index]),
            "all_predictions": [
                {"disease": class_name, "confidence": float(confidence)}
                for class_name, confidence in zip(class_names, confidence_levels)
            ],
            "is_healthy": class_names[result_index].lower() == "healthy"
        }
        
        if result["is_healthy"]:
            result["message"] = "Good news! The tea leaves appear to be healthy."
        else:
            result["message"] = f"The analysis detected {class_names[result_index]} disease with {result['confidence']*100:.1f}% confidence."
            
            # Add treatment recommendations
            treatments = {
                "Anthracnose": "Prune affected branches and apply fungicides containing copper or mancozeb. Ensure proper spacing between plants for good air circulation.",
                "algal leaf": "Remove affected leaves and apply copper oxychloride. Improve drainage and reduce humidity around plants.",
                "bird eye spot": "Apply fungicides containing carbendazim or copper. Enhance soil nutrition with balanced fertilizers.",
                "brown blight": "Prune affected areas and apply triazole fungicides. Avoid overhead irrigation.",
                "gray light": "Apply sulfur-based fungicides and ensure good air circulation by proper spacing and pruning.",
                "red leaf spot": "Remove infected leaves and apply fungicides containing chlorothalonil. Improve soil drainage.",
                "white spot": "Use copper-based fungicides and maintain proper spacing. Avoid excessive nitrogen fertilization."
            }
            
            result["treatment"] = treatments.get(result["disease"], "Consult with a tea cultivation expert for specific treatment recommendations.")
        
        return result
        
    except Exception as e:
        return {
            "success": False,
            "error": f"Error processing image: {str(e)}"
        }

if __name__ == "__main__":
    # Check if an image path was provided
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "No image path provided"
        }))
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    # Check if the image file exists
    if not os.path.exists(image_path):
        print(json.dumps({
            "success": False,
            "error": f"Image file not found: {image_path}"
        }))
        sys.exit(1)
    
    # Process the image and get the prediction result
    result = predict_disease(image_path)
    
    # Return the result as JSON
    print(json.dumps(result)) 