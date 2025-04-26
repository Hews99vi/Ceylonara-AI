// Fix-chats.js - Run this script to update existing chats with proper names
console.log('Running chat fix script...');

// First, request your own auth token from the app by checking localStorage
// You'll need to run this in your browser console while logged in
console.log('Please paste your auth token here to fix chats:');
console.log('You can get this by running this in the browser console:');
console.log('localStorage.getItem("clerk-auth-token") OR document.cookie to find the token');

// Replace this with your actual auth token from browser localStorage or cookie
const AUTH_TOKEN = "YOUR_AUTH_TOKEN_HERE"; 

// Update this to your actual API URL
const API_URL = 'http://localhost:5000';

console.log('Sending request to fix direct chats...');
fetch(`${API_URL}/api/fix-direct-chats`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${AUTH_TOKEN}`
  }
})
.then(response => {
  console.log('Response status:', response.status);
  return response.json();
})
.then(data => {
  console.log('Success:', data);
  console.log(`Updated ${data.message || 'all'} chats with proper names`);
  console.log('Please refresh your browser to see the updated names');
})
.catch(error => {
  console.error('Error:', error);
  console.log('Make sure your backend server is running and accessible');
}); 