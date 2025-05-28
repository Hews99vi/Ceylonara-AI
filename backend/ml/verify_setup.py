#!/usr/bin/env python3
import sys
import os
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def verify_setup():
    """Verify the ML environment setup"""
    status = {
        "python_version": sys.version,
        "executable": sys.executable,
        "dependencies": {},
        "model_file": None,
        "success": True
    }

    # Check required packages
    required_packages = ["tensorflow", "numpy", "PIL", "sklearn"]
    for package in required_packages:
        try:
            if package == "PIL":
                import PIL
                version = PIL.__version__
            else:
                module = __import__(package)
                version = getattr(module, "__version__", "unknown")
            
            logger.info(f"{package} version: {version} - OK")
            status["dependencies"][package] = {
                "installed": True,
                "version": version
            }
        except ImportError as e:
            logger.error(f"{package} - NOT FOUND: {str(e)}")
            status["dependencies"][package] = {
                "installed": False,
                "error": str(e)
            }
            status["success"] = False

    # Check model file
    model_dir = os.path.join(os.path.dirname(__file__), 'models')
    if not os.path.exists(model_dir):
        os.makedirs(model_dir)
        logger.info(f"Created models directory: {model_dir}")
    
    # Look for model files with common extensions
    model_files = [f for f in os.listdir(model_dir) 
                  if f.endswith(('.keras', '.h5', '.pb', '.tflite'))]
    
    if model_files:
        model_path = os.path.join(model_dir, model_files[0])
        file_size = os.path.getsize(model_path) / (1024 * 1024)  # Size in MB
        status["model_file"] = {
            "path": model_path,
            "size_mb": round(file_size, 2)
        }
        logger.info(f"Found model file: {model_path} ({file_size:.2f} MB)")
    else:
        logger.warning("No model file found in models directory")
        status["model_file"] = None

    # Print summary
    print("\nSetup Verification Summary:")
    print(json.dumps(status, indent=2))
    
    return status["success"]

if __name__ == "__main__":
    success = verify_setup()
    sys.exit(0 if success else 1) 