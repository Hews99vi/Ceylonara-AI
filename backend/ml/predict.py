#!/usr/bin/env python
import sys
import os
import json
import numpy as np
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

# Exit if no input image is provided
if len(sys.argv) != 2:
    print(json.dumps({"error": "No input image provided"}))
    sys.exit(1)

# Get image path from command line argument
img_path = sys.argv[1]

# Check if the file exists
if not os.path.exists(img_path):
    print(json.dumps({"error": f"File not found: {img_path}"}))
    sys.exit(1)

try:
    # Define the class labels
    class_labels = [
        'algal_leaf',
        'anthracnose',
        'bird_eye_spot',
        'brown_blight',
        'gray_blight',
        'healthy',
        'red_leaf_spot',
        'white_spot'
    ]
    
    # Load the model
    model_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tea_disease_model.h5')
    model = load_model(model_path)
    
    # Preprocess the image
    img = image.load_img(img_path, target_size=(224, 224))
    img_array = image.img_to_array(img)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)
    
    # Make prediction
    predictions = model.predict(img_array)
    
    # Format the results
    results = []
    for i, pred in enumerate(predictions[0]):
        results.append({
            "disease": class_labels[i],
            "confidence": float(pred) * 100  # Convert to percentage
        })
    
    # Sort by confidence (highest first)
    results.sort(key=lambda x: x["confidence"], reverse=True)
    
    # Get the top prediction
    top_prediction = results[0]["disease"]
    confidence = results[0]["confidence"]
    
    # Create response
    response = {
        "prediction": top_prediction,
        "confidence": confidence,
        "all_predictions": results
    }
    
    # Return the response as JSON
    print(json.dumps(response))
    
except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1) 