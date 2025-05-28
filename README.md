# Ceylonara AI

An AI-powered Tea Farm Management System for revolutionizing Ceylon Tea industry through intelligent disease detection and stakeholder collaboration.

## 🎯 Project Overview

Ceylonara AI is a comprehensive solution designed to address critical challenges in Sri Lanka's tea industry. This final year university project combines artificial intelligence, computer vision, and modern web technologies to streamline tea cultivation processes and enhance communication between stakeholders.

The system specifically targets:
- Early detection and management of tea leaf diseases
- Streamlined communication between farmers and factories
- Efficient tea leaf collection and quality management
- Data-driven decision making in tea cultivation

## 🌟 Key Features

### For Farmers
- **AI-Powered Disease Detection**: Upload leaf images to instantly identify diseases
- **Treatment Recommendations**: Get expert advice on disease management
- **Real-time Communication**: Direct chat with factories for better coordination
- **Harvest Data Management**: Track and manage harvest records digitally
- **Collection Updates**: Receive real-time updates on leaf collection schedules

### For Factories
- **Centralized Dashboard**: Manage farmer relationships and leaf collections
- **Quality Monitoring**: Track leaf quality metrics and history
- **Price Management**: Update and announce tea leaf prices
- **Collection Planning**: Optimize leaf collection routes and schedules
- **Communication Hub**: Direct messaging with farmers for better coordination

### AI Features
- Advanced CNN-based disease detection model
- Real-time image processing and analysis
- Comprehensive disease information database
- Historical data tracking and analysis

## 🛠️ Technical Architecture

### Backend Stack
- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB
- **AI Processing**: Python 3.8+ with TensorFlow/Keras
- **File Storage**: Local storage with proper directory management
- **Authentication**: JWT-based auth system

### Frontend Stack
- **Framework**: React with Vite
- **State Management**: Redux
- **UI Components**: Material-UI
- **Real-time Updates**: Socket.IO
- **Data Visualization**: Chart.js

## 🚀 Getting Started

### Prerequisites
- Node.js 16+
- MongoDB
- Python 3.8+
- Git

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/Ceylonara-AI.git
   cd Ceylonara-AI
   ```

2. Set up the backend:
   ```bash
   cd backend
   npm install
   ```

3. Configure Python environment for AI features:
   ```bash
   cd ml
   pip install -r requirements.txt
   ```

4. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd ../client
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## 📚 Documentation

### API Endpoints

#### Disease Detection
- `POST /api/tea-disease/detect` - Upload images for disease detection
- `GET /api/tea-disease/diseases` - List all tea diseases
- `GET /api/tea-disease/info/:disease` - Get specific disease information
- `GET /api/tea-disease/history` - View detection history

#### User Management
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - User authentication
- `GET /api/users/profile` - Get user profile

#### Collection Management
- `POST /api/collections/request` - Submit collection request
- `GET /api/collections/schedule` - View collection schedule
- `PUT /api/collections/update` - Update collection status

## 🔬 Research Context

This project is built upon academic research in:
- Computer Vision for Plant Disease Detection
- Machine Learning in Agriculture
- Digital Transformation in Traditional Industries
- Supply Chain Optimization

Key research influences include:
- Pandian et al. (2023) on Grey Blight Disease Detection
- Park et al. (2020) on CNN-based plant disease recognition
- Zhang et al. (2019) on machine vision for tea quality monitoring

## 👥 Team

This final year project was developed by Nimantha Hewawasam under the supervision of Dulanjali Wijesekara at NSBM partnership with Plymouth University.

## 📄 License

This project is part of an academic submission and is protected under academic guidelines. All rights reserved.

## 🙏 Acknowledgments

Special thanks to:
- Project supervisors and advisors
- Tea Research Institute of Sri Lanka
- Local tea factories and farmers who participated in testing
- Open source community for various tools and libraries used

## 🔑 Test Account Credentials

### Farmer Account
- Email: `nimantha2002hewawasam@gmail.com`
- Password: `Nima@19809`

### Factory Account
- Email: `nimanthavi@gmail.com`
- Password: `Nima@2025`

### Tea Board Admin Account
- Sign up with any email address
- Use Admin Passcode: `TEA_BOARD_SL_2024`

> Note: These are test credentials provided for demonstration purposes.

---

*This project is a final year submission for Plymouth University, Plymouth batch 11*