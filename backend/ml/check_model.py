#!/usr/bin/env python3
import os
import sys
import json
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_model_structure():
    """
    Check the structure of the model file
    """
    # Get current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    logger.info(f"Current directory: {current_dir}")
    
    # Path to the model - try several variations
    model_paths = [
        os.path.join(current_dir, 'models', 'tea_disease_model.keras'),
        os.path.join(current_dir, '..', '..', 'Teasikcnesmodel', 'trained_model.keras'),
        os.path.join(current_dir, '..', '..', 'Teasikcnesmodel', 'trained_model.h5')
    ]
    
    # Find the model file
    model_file = None
    for path in model_paths:
        if os.path.exists(path):
            model_file = path
            logger.info(f"Found model at: {model_file}")
            break
    
    if not model_file:
        logger.error("No model file found")
        return 1
    
    # Check the model file
    try:
        with open(model_file, 'rb') as f:
            # Read first 100 bytes to identify file type
            header = f.read(100)
            
            # Check if it's a Keras file (HDF5 format)
            if header.startswith(b'\x89HDF'):
                logger.info("File appears to be in HDF5 format (used by Keras)")
            else:
                logger.info("File does not appear to be in HDF5 format")
            
            # Go to end of file to get size
            f.seek(0, os.SEEK_END)
            file_size = f.tell()
            
            logger.info(f"Model file size: {file_size/1024/1024:.2f} MB")
    except Exception as e:
        logger.error(f"Error reading model file: {e}")
        return 1
    
    # Check image paths
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        if os.path.exists(image_path):
            logger.info(f"Image exists: {image_path}")
            
            # Check image size
            file_size = os.path.getsize(image_path)
            logger.info(f"Image file size: {file_size/1024:.2f} KB")
            
            # Check image format
            with open(image_path, 'rb') as f:
                header = f.read(10)
                
                if header.startswith(b'\xff\xd8\xff'):
                    logger.info("Image appears to be in JPEG format")
                elif header.startswith(b'\x89PNG\r\n\x1a\n'):
                    logger.info("Image appears to be in PNG format")
                else:
                    logger.warning("Image format not recognized")
        else:
            logger.error(f"Image file does not exist: {image_path}")
    
    # Create summary of findings
    summary = {
        "model_file": model_file,
        "model_exists": os.path.exists(model_file),
        "model_size_mb": os.path.getsize(model_file) / 1024 / 1024,
        "python_version": sys.version,
        "class_labels": [
            "Anthracnose", "algal leaf", "bird eye spot", "brown blight",
            "gray light", "healthy", "red leaf spot", "white spot"
        ]
    }
    
    # Print summary as JSON
    print("\nSummary:")
    print(json.dumps(summary, indent=2))
    
    logger.info("Model structure check completed")
    return 0

if __name__ == "__main__":
    sys.exit(check_model_structure()) 