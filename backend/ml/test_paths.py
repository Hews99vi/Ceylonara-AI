#!/usr/bin/env python3
import os
import sys
import json
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def check_paths():
    """
    Check existence of model and other paths
    """
    # Get current directory
    current_dir = os.path.dirname(os.path.abspath(__file__))
    logger.info(f"Current directory: {current_dir}")
    
    # Path to the model - try several variations
    model_paths = [
        os.path.join(current_dir, 'models', 'tea_disease_model.keras'),
        os.path.join(current_dir, 'models', 'tea_disease_model.h5'),
        os.path.join(current_dir, '..', '..', 'Teasikcnesmodel', 'trained_model.keras'),
        os.path.join(current_dir, '..', '..', 'Teasikcnesmodel', 'trained_model.h5')
    ]
    
    # Check model paths
    logger.info("Checking model paths:")
    for model_path in model_paths:
        exists = os.path.exists(model_path)
        file_size = os.path.getsize(model_path) if exists else 0
        logger.info(f"Model path: {model_path} - Exists: {exists} - Size: {file_size/1024/1024:.2f} MB" if exists else f"Model path: {model_path} - Exists: {exists}")
    
    # Check for image path
    image_path = ""
    if len(sys.argv) > 1:
        image_path = sys.argv[1]
        exists = os.path.exists(image_path)
        file_size = os.path.getsize(image_path) if exists else 0
        logger.info(f"Image path: {image_path} - Exists: {exists} - Size: {file_size/1024:.2f} KB" if exists else f"Image path: {image_path} - Exists: {exists}")
    
    # List contents of uploads directory
    uploads_dir = os.path.join(current_dir, '..', 'uploads')
    if os.path.exists(uploads_dir):
        logger.info(f"Contents of uploads directory {uploads_dir}:")
        for file in os.listdir(uploads_dir):
            file_path = os.path.join(uploads_dir, file)
            file_size = os.path.getsize(file_path)
            logger.info(f"  {file} - Size: {file_size/1024:.2f} KB")
    else:
        logger.warning(f"Uploads directory not found: {uploads_dir}")
    
    # List contents of client/public directory for sample images
    public_dir = os.path.join(current_dir, '..', '..', 'client', 'public')
    if os.path.exists(public_dir):
        logger.info(f"Contents of public directory {public_dir}:")
        # Only list image files
        for file in os.listdir(public_dir):
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.gif')):
                file_path = os.path.join(public_dir, file)
                file_size = os.path.getsize(file_path)
                logger.info(f"  {file} - Size: {file_size/1024:.2f} KB")
    else:
        logger.warning(f"Public directory not found: {public_dir}")
    
    return 0

if __name__ == "__main__":
    sys.exit(check_paths()) 