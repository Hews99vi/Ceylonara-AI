#!/usr/bin/env python3
import sys
import os
import json

print("Python Verification Tool")
print("-----------------------")
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print(f"Current directory: {os.getcwd()}")

# Try to import required packages
dependencies = ["numpy", "tensorflow"]
status = {"python_version": sys.version, "executable": sys.executable}

for package in dependencies:
    try:
        module = __import__(package)
        version = getattr(module, "__version__", "unknown")
        print(f"{package} version: {version} - OK")
        status[package] = {"installed": True, "version": version}
    except ImportError:
        print(f"{package} - NOT FOUND")
        status[package] = {"installed": False}

# Output as JSON
print("\nJSON Results:")
print(json.dumps(status, indent=2))

# Try to check for model file
model_paths = [
    os.path.join(os.path.dirname(__file__), 'models', 'tea_disease_model.keras'),
    os.path.join(os.path.dirname(__file__), '..', '..', 'Teasikcnesmodel', 'trained_model.keras'),
    os.path.join(os.path.dirname(__file__), '..', '..', 'Teasikcnesmodel', 'trained_model.h5')
]

print("\nChecking model files:")
for path in model_paths:
    if os.path.exists(path):
        size_mb = os.path.getsize(path) / (1024 * 1024)
        print(f"{path} - Found ({size_mb:.2f} MB)")
    else:
        print(f"{path} - Not found")

if len(sys.argv) > 1:
    image_path = sys.argv[1]
    if os.path.exists(image_path):
        print(f"\nImage file: {image_path} - Found")
    else:
        print(f"\nImage file: {image_path} - Not found")

# This script should run without errors if all is well
print("\nVerification complete - Script ran successfully") 