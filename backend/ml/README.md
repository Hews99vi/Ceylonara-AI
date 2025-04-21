# Tea Disease Detection ML Module

This module contains the Python scripts for tea disease detection using a machine learning model.

## Setup

1. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Place the model file in the `models` directory with one of these names:
   - `tea_disease_model.keras`
   - `tea_disease_model.h5`
   - `tea_disease_model.tf`

## Usage

### From Node.js

The model is integrated with the Express backend. The API endpoint `/api/detect-disease` accepts image uploads and processes them using the Python script.

### Testing

You can test the script directly:

```
python test_model.py /path/to/image.jpg
```

Or test the Node.js integration:

```
node test_api.js
```

## API Response Format

The disease detection API returns a JSON response with the following structure:

```json
{
  "success": true,
  "result": {
    "prediction": "Healthy",
    "confidence": 0.92,
    "treatment": "Continue with regular maintenance and preventive practices to keep plants healthy.",
    "all_predictions": [
      {"disease": "Healthy", "confidence": 0.92},
      {"disease": "Anthracnose", "confidence": 0.05},
      ...
    ],
    "healthy": true
  }
}
```

## Supported Diseases

The model can detect the following tea leaf conditions:

1. Healthy
2. Anthracnose
3. Algal Leaf
4. Bird Eye Spot
5. Brown Blight
6. Gray Blight
7. Red Leaf Spot
8. White Spot

Each disease includes a treatment recommendation when detected. 