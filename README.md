# Ceylonara AI

Tea farm management system with AI-powered features for Ceylon Tea.

## Features

- Factory and Farmer user roles with specialized dashboards
- Tea leaf collection management
- Price updates and announcements
- Harvest data tracking and visualization
- AI-powered tea disease detection - Upload leaf images to detect diseases and get treatment recommendations
- Chat functionality between farmers and factories

## Setup

### Prerequisites

- Node.js 16+
- MongoDB
- Python 3.8+ (for AI features)

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd Ceylonara-AI/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up Python environment for AI features:
   ```
   cd ml
   pip install -r requirements.txt
   ```

4. Start the server:
   ```
   npm start
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```
   cd Ceylonara-AI/client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Disease Detection API

The system includes an AI-powered disease detection feature for tea leaves. Farmers can upload images of tea leaves to check for diseases and get treatment recommendations.

### API Endpoints

- `POST /api/tea-disease/detect` - Upload an image for disease detection
- `GET /api/tea-disease/diseases` - Get information about all tea diseases
- `GET /api/tea-disease/info/:disease` - Get information about a specific disease
- `GET /api/tea-disease/history` - Get the user's disease detection history