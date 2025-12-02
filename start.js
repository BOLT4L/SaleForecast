// Start script for Render deployment
// This script starts the backend server which also serves the frontend in production

console.log('🚀 Starting Sales Forecast Application...\n');
console.log('📦 Starting backend server (frontend will be served automatically)...\n');

// Start the backend server
// The backend/server.js will handle serving both API and frontend static files
require('./backend/server.js');

