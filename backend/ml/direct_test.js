import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get directory name in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const logFile = path.join(__dirname, 'test_output.log');
fs.writeFileSync(logFile, `Test started at ${new Date().toISOString()}\n\n`, 'utf8');

function log(message) {
  console.log(message);
  fs.appendFileSync(logFile, message + '\n', 'utf8');
}

// Find an image file in the uploads folder
const uploadsDir = path.join(__dirname, '../uploads');
let testImage = null;

if (fs.existsSync(uploadsDir)) {
  const files = fs.readdirSync(uploadsDir);
  for (const file of files) {
    if (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png')) {
      testImage = path.join(uploadsDir, file);
      break;
    }
  }
}

if (!testImage) {
  log('No test images found in uploads directory');
  process.exit(1);
}

log(`Using test image: ${testImage}`);

// Test direct Python execution first
log('\nTESTING DIRECT PYTHON EXECUTION:');
const pythonPath = 'C:\\Users\\user\\anaconda3\\envs\\tf_env\\python.exe';
const scriptPath = path.join(__dirname, 'test_model.py');

if (!fs.existsSync(pythonPath)) {
  log(`ERROR: Python executable not found at ${pythonPath}`);
} else {
  log(`Python executable found at ${pythonPath}`);
}

if (!fs.existsSync(scriptPath)) {
  log(`ERROR: Script not found at ${scriptPath}`);
} else {
  log(`Script found at ${scriptPath}`);
}

// Run the batch script
log('\nRunning batch script...');
const pythonProcess = spawn('cmd.exe', [
  '/c',
  path.join(__dirname, 'run_model.bat'),
  testImage
], { 
  env: process.env,
  // Set a timeout to prevent hanging
  timeout: 60000
});

let result = '';
let error = '';

pythonProcess.stdout.on('data', (data) => {
  const output = data.toString();
  log(`STDOUT: ${output}`);
  result += output;
});

pythonProcess.stderr.on('data', (data) => {
  const errorOutput = data.toString();
  log(`STDERR: ${errorOutput}`);
  error += errorOutput;
});

pythonProcess.on('error', (err) => {
  log(`PROCESS ERROR: ${err.message}`);
});

pythonProcess.on('close', (code) => {
  log(`Process exited with code ${code}`);
  
  if (code !== 0) {
    log('Error running model');
    log(`Error output: ${error}`);
    process.exit(1);
  }
  
  try {
    // Try to extract JSON
    let jsonStart = result.indexOf('{');
    let jsonEnd = result.lastIndexOf('}') + 1;
    
    if (jsonStart === -1 || jsonEnd === 0) {
      log('No JSON found in output');
      log(`Raw output: ${result}`);
      process.exit(1);
    }
    
    let jsonStr = result.substring(jsonStart, jsonEnd);
    const prediction = JSON.parse(jsonStr);
    
    log('\nPrediction Results:');
    log('-------------------');
    log(`Disease: ${prediction.disease}`);
    log(`Confidence: ${(prediction.confidence * 100).toFixed(2)}%`);
    log(`Is Healthy: ${prediction.is_healthy ? 'Yes' : 'No'}`);
    log('\nTreatment:');
    log(prediction.treatment);
    
    process.exit(0);
  } catch (error) {
    log(`Error parsing result: ${error}`);
    process.exit(1);
  }
}); 