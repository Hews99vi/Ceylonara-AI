#!/usr/bin/env python3
import os
import sys
import json

def simple_test():
    """Very simple test that doesn't require TensorFlow"""
    
    # Basic information
    print("Running simple test without TensorFlow")
    print(f"Python version: {sys.version}")
    print(f"Current directory: {os.getcwd()}")
    
    # Check if image path provided
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        if os.path.exists(image_path):
            print(f"Image file exists: {image_path}")
            print(f"Size: {os.path.getsize(image_path)/1024:.2f} KB")
        else:
            print(f"Image file does not exist: {image_path}")
    
    # Return test results as JSON
    result = {
        "success": True,
        "message": "Simple test completed successfully",
        "prediction": "Test Disease",  # Dummy prediction
        "confidence": 0.85,
        "disease": "Test Disease",
        "treatment": "This is a test treatment recommendation.",
        "is_healthy": False
    }
    
    # Print JSON result (this is what the Node.js backend will parse)
    print(json.dumps(result))
    return 0

if __name__ == "__main__":
    sys.exit(simple_test()) 