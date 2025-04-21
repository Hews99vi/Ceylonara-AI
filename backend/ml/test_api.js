import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to test image - replace with a path to a tea leaf image
const testImagePath = path.join(__dirname, 'test_image.jpg');

// Mock test image if it doesn't exist
if (!fs.existsSync(testImagePath)) {
  console.log('Test image not found. This is just a test of script execution.');
  console.log('In a real scenario, you would need an actual tea leaf image.');
  // Create a dummy test file for the demo
  fs.writeFileSync(testImagePath, 'This is a dummy file for testing.');
}

console.log('Starting disease detection test...');
console.log(`Using test image: ${testImagePath}`);

// Run the Python script as a separate process
const pythonProcess = spawn('python', [
  path.join(__dirname, 'test_model.py'),
  testImagePath
]);

let dataString = '';
let errorString = '';

pythonProcess.stdout.on('data', (data) => {
  dataString += data.toString();
  console.log('Received data from Python script');
});

pythonProcess.stderr.on('data', (data) => {
  errorString += data.toString();
  console.error(`Python Error: ${data.toString()}`);
});

pythonProcess.on('close', (code) => {
  console.log(`Python process exited with code ${code}`);
  
  if (code !== 0) {
    console.error('Error processing image:');
    console.error(errorString);
    return;
  }

  try {
    // Parse the JSON output from the Python script
    const result = JSON.parse(dataString);
    console.log('Result from Python script:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.error) {
      console.error('Error from Python script:', result.error);
    } else {
      console.log('Disease detection test completed successfully');
    }
  } catch (parseError) {
    console.error('Error parsing Python output:', parseError);
    console.error('Raw output:', dataString);
  }
  
  // Clean up the test image if it was created for testing
  if (fs.readFileSync(testImagePath, 'utf8') === 'This is a dummy file for testing.') {
    fs.unlinkSync(testImagePath);
    console.log('Removed dummy test file');
  }
}); 