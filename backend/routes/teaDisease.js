import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

// Get the directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    console.log(`Storing file in: ${uploadDir}`);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const fileName = uniqueSuffix + path.extname(file.originalname);
    console.log(`Generated filename: ${fileName} from original: ${file.originalname}`);
    cb(null, fileName);
  }
});

// File filter function to accept only image files
const fileFilter = (req, file, cb) => {
  console.log(`Received file: ${file.originalname}, mimetype: ${file.mimetype}`);
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Error handler for multer
const uploadErrorHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error(`Multer error: ${err.message}`);
    return res.status(400).json({ 
      success: false, 
      error: `File upload error: ${err.message}`
    });
  } else if (err) {
    console.error(`Upload error: ${err.message}`);
    return res.status(500).json({ 
      success: false, 
      error: `Upload failed: ${err.message}`
    });
  }
  next();
};

// POST - Process image for tea disease detection
router.post('/detect', upload.single('image'), uploadErrorHandler, async (req, res) => {
  const startTime = Date.now();
  console.log('=== Starting new disease detection request ===');
  console.log('Request received at:', new Date().toISOString());
  
  try {
    // Debug log for uploaded file
    console.log('File upload request received');
    console.log('Request headers:', req.headers);
    console.log('Request body fields:', req.body);
    console.log('File details:', req.file);
    
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ 
        success: false,
        error: 'No image uploaded' 
      });
    }

    const imagePath = req.file.path;
    console.log(`Processing tea disease detection for image: ${imagePath}`);
    console.log('Image file exists:', fs.existsSync(imagePath));
    console.log('Image file size:', fs.statSync(imagePath).size);
    
    // Run Python script with proper error handling
    const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
    const scriptPath = path.join(__dirname, '../ml/test_model.py');
    
    console.log('Python command:', pythonPath);
    console.log('Script path:', scriptPath);
    console.log('Script exists:', fs.existsSync(scriptPath));
    
    const pythonProcess = spawn(pythonPath, [scriptPath, imagePath]);

    let result = '';
    let error = '';

    // Collect data from script
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Python stdout:', output);
      result += output;
    });

    pythonProcess.stderr.on('data', (data) => {
      const errorOutput = data.toString();
      console.error('Python Error:', errorOutput);
      error += errorOutput;
    });

    // Handle process completion
    pythonProcess.on('close', async (code) => {
      const duration = Date.now() - startTime;
      console.log(`Python process exited with code ${code} after ${duration}ms`);
      
      // Clean up the uploaded file
      try {
        fs.unlinkSync(imagePath);
        console.log('Temporary file deleted successfully');
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }

      if (code !== 0) {
        console.error('Python process failed:', error);
        return res.status(500).json({
          success: false,
          error: 'Disease detection failed',
          details: error || 'Unknown error occurred',
          code: code
        });
      }

      try {
        // Parse the JSON result
        const jsonStr = result.trim();
        console.log('Raw Python output:', jsonStr);
        
        const prediction = JSON.parse(jsonStr);
        console.log('Parsed prediction:', prediction);

        // Check if there was an error
        if (!prediction.success) {
          console.error('Prediction failed:', prediction.error);
          return res.status(500).json({ 
            success: false, 
            error: 'Disease detection failed',
            details: prediction.error || 'Unknown error occurred'
          });
        }

        // Save detection to database if implemented
        try {
          if (req.auth && req.auth.userId) {
            const DiseaseDetection = req.app.get('DiseaseDetection');
            
            if (DiseaseDetection) {
              const detection = new DiseaseDetection({
                userId: req.auth.userId,
                userType: req.auth.userType || 'Unknown',
                imagePath: req.file.filename,
                result: prediction
              });
              
              await detection.save();
              console.log(`Detection saved to database for user ${req.auth.userId}`);
            }
          }
        } catch (dbError) {
          console.error('Error saving detection to database:', dbError);
          // Continue even if DB save fails
        }

        console.log('Sending successful response');
        return res.status(200).json({
          success: true,
          result: prediction
        });

      } catch (parseError) {
        console.error('Error parsing Python output:', parseError);
        return res.status(500).json({
          success: false,
          error: 'Failed to parse detection results',
          details: parseError.message,
          rawOutput: result
        });
      }
    });

    // Handle process error
    pythonProcess.on('error', (err) => {
      console.error('Failed to start Python process:', err);
      
      // Clean up the uploaded file
      try {
        fs.unlinkSync(imagePath);
        console.log('Temporary file deleted after process error');
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }

      return res.status(500).json({
        success: false,
        error: 'Failed to start disease detection process',
        details: err.message
      });
    });

  } catch (err) {
    console.error('Route handler error:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// GET - Get disease information
router.get('/info/:disease', async (req, res) => {
  const diseases = {
    'healthy': {
      name: 'Healthy Tea Leaf',
      description: 'The leaf appears healthy with no signs of disease.',
      treatment: null,
      prevention: 'Maintain good agricultural practices, including proper irrigation, fertilization, and pest management to keep plants healthy.'
    },
    'algal_leaf': {
      name: 'Algal Leaf Spot',
      description: 'Caused by parasitic green algae (Cephaleuros virescens). Appears as circular, raised, rusty-red to orange spots on leaves.',
      treatment: 'Remove and destroy affected leaves. Apply copper-based fungicides as recommended by agricultural experts.',
      prevention: 'Improve air circulation by proper pruning. Avoid excessive irrigation and maintain proper drainage.'
    },
    'anthracnose': {
      name: 'Anthracnose',
      description: 'Fungal disease that causes dark, sunken lesions on leaves, stems, and fruits. Leaves may show brown spots with yellow halos.',
      treatment: 'Apply fungicides recommended for tea plants. Remove and destroy infected plant parts.',
      prevention: 'Maintain proper spacing between plants for good air circulation. Avoid overhead irrigation.'
    },
    'bird_eye_spot': {
      name: 'Bird\'s Eye Spot',
      description: 'Caused by the fungus Cercospora theae. Characterized by small, round spots with a gray center surrounded by a brown or purple ring.',
      treatment: 'Apply appropriate fungicides. Remove and destroy severely infected leaves.',
      prevention: 'Ensure good air circulation. Avoid excessive nitrogen fertilization.'
    },
    'brown_blight': {
      name: 'Brown Blight',
      description: 'Fungal disease caused by Colletotrichum camelliae. Leaves develop brown, irregular spots with yellow margins.',
      treatment: 'Apply recommended fungicides. Prune and destroy infected branches.',
      prevention: 'Maintain proper spacing for air circulation. Avoid excessive moisture on leaves.'
    },
    'gray_blight': {
      name: 'Gray Blight',
      description: 'Caused by the fungus Pestalotiopsis theae. Leaves show gray to brown lesions, often with a dark border.',
      treatment: 'Apply appropriate fungicides. Remove infected leaves and properly dispose of them.',
      prevention: 'Promote good air circulation. Avoid plant stress through proper irrigation and fertilization.'
    },
    'red_leaf_spot': {
      name: 'Red Leaf Spot',
      description: 'Caused by the fungus Cercospora theae. Appears as reddish-brown, circular spots on leaves.',
      treatment: 'Apply recommended fungicides. Remove severely infected leaves.',
      prevention: 'Maintain proper plant spacing. Avoid excessive moisture on foliage.'
    },
    'white_spot': {
      name: 'White Spot',
      description: 'Fungal disease that appears as white or grayish spots on leaves, sometimes with a brown border.',
      treatment: 'Apply fungicides as recommended. Remove and destroy infected plant parts.',
      prevention: 'Ensure proper drainage. Avoid overhead irrigation.'
    }
  };

  const disease = req.params.disease.toLowerCase();
  
  if (diseases[disease]) {
    return res.status(200).json({
      success: true,
      disease: diseases[disease]
    });
  } else {
    return res.status(404).json({ 
      success: false, 
      error: 'Disease information not found' 
    });
  }
});

// GET - Get all disease information
router.get('/diseases', async (req, res) => {
  const diseases = {
    'healthy': {
      name: 'Healthy Tea Leaf',
      description: 'The leaf appears healthy with no signs of disease.',
      treatment: null,
      prevention: 'Maintain good agricultural practices, including proper irrigation, fertilization, and pest management to keep plants healthy.'
    },
    'algal_leaf': {
      name: 'Algal Leaf Spot',
      description: 'Caused by parasitic green algae (Cephaleuros virescens). Appears as circular, raised, rusty-red to orange spots on leaves.',
      treatment: 'Remove and destroy affected leaves. Apply copper-based fungicides as recommended by agricultural experts.',
      prevention: 'Improve air circulation by proper pruning. Avoid excessive irrigation and maintain proper drainage.'
    },
    'anthracnose': {
      name: 'Anthracnose',
      description: 'Fungal disease that causes dark, sunken lesions on leaves, stems, and fruits. Leaves may show brown spots with yellow halos.',
      treatment: 'Apply fungicides recommended for tea plants. Remove and destroy infected plant parts.',
      prevention: 'Maintain proper spacing between plants for good air circulation. Avoid overhead irrigation.'
    },
    'bird_eye_spot': {
      name: 'Bird\'s Eye Spot',
      description: 'Caused by the fungus Cercospora theae. Characterized by small, round spots with a gray center surrounded by a brown or purple ring.',
      treatment: 'Apply appropriate fungicides. Remove and destroy severely infected leaves.',
      prevention: 'Ensure good air circulation. Avoid excessive nitrogen fertilization.'
    },
    'brown_blight': {
      name: 'Brown Blight',
      description: 'Fungal disease caused by Colletotrichum camelliae. Leaves develop brown, irregular spots with yellow margins.',
      treatment: 'Apply recommended fungicides. Prune and destroy infected branches.',
      prevention: 'Maintain proper spacing for air circulation. Avoid excessive moisture on leaves.'
    },
    'gray_blight': {
      name: 'Gray Blight',
      description: 'Caused by the fungus Pestalotiopsis theae. Leaves show gray to brown lesions, often with a dark border.',
      treatment: 'Apply appropriate fungicides. Remove infected leaves and properly dispose of them.',
      prevention: 'Promote good air circulation. Avoid plant stress through proper irrigation and fertilization.'
    },
    'red_leaf_spot': {
      name: 'Red Leaf Spot',
      description: 'Caused by the fungus Cercospora theae. Appears as reddish-brown, circular spots on leaves.',
      treatment: 'Apply recommended fungicides. Remove severely infected leaves.',
      prevention: 'Maintain proper plant spacing. Avoid excessive moisture on foliage.'
    },
    'white_spot': {
      name: 'White Spot',
      description: 'Fungal disease that appears as white or grayish spots on leaves, sometimes with a brown border.',
      treatment: 'Apply fungicides as recommended. Remove and destroy infected plant parts.',
      prevention: 'Ensure proper drainage. Avoid overhead irrigation.'
    }
  };
  
  return res.status(200).json({
    success: true,
    diseases: diseases
  });
});

// GET - Get user's detection history
router.get('/history', async (req, res) => {
  try {
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    // Get the disease detection model from the app
    const DiseaseDetection = req.app.get('DiseaseDetection');
    
    if (!DiseaseDetection) {
      return res.status(200).json({
        success: true,
        message: 'No detection history available',
        detections: []
      });
    }
    
    const detections = await DiseaseDetection.find({ 
      userId: req.auth.userId 
    }).sort({ createdAt: -1 }).limit(20);
    
    return res.status(200).json({
      success: true,
      detections: detections
    });
  } catch (error) {
    console.error('Error fetching detection history:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch detection history',
      details: error.message
    });
  }
});

export default router; 