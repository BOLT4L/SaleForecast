# Setup Complete - Local Development Guide

## ✅ Completed Steps

1. **Dependencies Installed**
   - ✅ Backend dependencies installed (`backend/node_modules`)
   - ✅ Frontend dependencies installed (`frontend/node_modules`)

2. **Environment Files Created**
   - ✅ `backend/.env` - Backend environment variables
   - ✅ `frontend/.env` - Frontend environment variables

3. **Servers Started**
   - ✅ Backend server started in background (port 5000)
   - ✅ Frontend server started in background (port 3000)

## 🌐 Access URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation (Swagger)**: http://localhost:5000/api-docs

## ⚠️ Important: Database Setup Required

The backend requires MongoDB to be running. You have two options:

### Option 1: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service
3. Update `backend/.env`:
   ```
   MONGO_URI=mongodb://localhost:27017/sales-forecast
   ```

### Option 2: MongoDB Atlas (Cloud)
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster and get connection string
3. Update `backend/.env`:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/sales-forecast
   ```

## 🔧 Manual Server Commands

If you need to restart the servers manually:

### Backend
```bash
cd backend
npm run dev    # Development mode with auto-reload
# OR
npm start      # Production mode
```

### Frontend
```bash
cd frontend
npm run dev    # Development server
```

## 📋 Environment Variables

### Backend (.env)
- `PORT` - Backend server port (default: 5000)
- `MONGO_URI` - MongoDB connection string (REQUIRED)
- `JWT_SECRET` - Secret key for JWT tokens
- `FRONTEND_URL` - Frontend URL for CORS
- `REDIS_URL` - Redis connection (optional)
- `EMAIL_USER` - Email for notifications (optional)
- `EMAIL_PASS` - Email password (optional)

### Frontend (.env)
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)

## 🐍 Python Dependencies (Optional)

For forecasting features, install Python dependencies:
```bash
cd backend/scripts
pip install -r requirements.txt
```

Note: This requires Python 3.8+ and may take several minutes to install.

## 🔍 Troubleshooting

### Backend won't start
1. Check if MongoDB is running and accessible
2. Verify `MONGO_URI` in `backend/.env` is correct
3. Check if port 5000 is already in use
4. Look at backend logs for error messages

### Frontend won't start
1. Check if port 3000 is already in use
2. Verify `VITE_API_URL` in `frontend/.env` is correct
3. Check browser console for errors

### Connection Issues
1. Ensure backend is running before frontend
2. Check CORS settings in `backend/server.js`
3. Verify `FRONTEND_URL` matches your frontend URL

## 📊 Project Features

- **Authentication**: JWT-based user authentication
- **Sales Management**: Upload, view, and manage sales data
- **Product Management**: CRUD operations for products
- **Forecasting**: ML-powered sales forecasting (Prophet, XGBoost)
- **Market Basket Analysis**: Product association rules
- **Reports**: Generate CSV/PDF reports
- **User Management**: Admin panel for user management

## 🚀 Next Steps

1. **Set up MongoDB** (if not already done)
2. **Access the application** at http://localhost:3000
3. **Create an account** or login
4. **Upload sales data** to start using forecasting features

## 📝 Notes

- The servers are running in the background
- Backend uses nodemon for auto-reload in dev mode
- Frontend uses Vite HMR (Hot Module Replacement)
- Redis is optional but recommended for production
- Email notifications require SMTP configuration






