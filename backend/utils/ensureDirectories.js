import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name properly in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ensures that all required directories exist
 */
const ensureDirectories = () => {
  const directories = [
    path.join(__dirname, '../uploads'),
    path.join(__dirname, '../uploads/chat-files'),
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  console.log('All required directories have been verified.');
};

export default ensureDirectories;
