# Project Analysis: Sales Forecast Application

## Overview
This is a full-stack sales forecasting application with the following components:
- **Backend**: Node.js/Express REST API
- **Frontend**: React/TypeScript with Vite
- **Database**: MongoDB
- **Cache**: Redis (optional)
- **ML/AI**: Python scripts for forecasting (Prophet, XGBoost, TensorFlow)

## Project Structure

### Backend (`/backend`)
- **Framework**: Express.js
- **Port**: 5000 (default)
- **Key Features**:
  - JWT authentication
  - Role-based access control (Admin/User)
  - Sales data management
  - Product inventory management
  - Forecasting using Python scripts
  - Market basket analysis
  - Report generation (CSV/PDF)
  - Email notifications
  - Swagger API documentation

**Main Components**:
- `server.js` - Entry point
- `config/` - Database, Redis, Swagger configuration
- `controllers/` - Business logic handlers
- `models/` - Mongoose schemas (User, Product, Sale, Forecast, MarketBasket, Report)
- `routes/` - API route definitions
- `middleware/` - Auth, error handling, sanitization
- `utils/` - Logger, email, validation
- `scripts/` - Python forecasting scripts

### Frontend (`/frontend`)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Port**: 3000
- **UI Library**: Radix UI components
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Charts**: Chart.js, Recharts
- **Routing**: React Router v6

**Main Components**:
- `src/pages/` - Page components (Dashboard, Sales, Products, Forecasts, Reports, Users, Settings)
- `src/components/` - Reusable UI components
- `src/services/` - API service layer
- `src/context/` - Auth and Theme contexts
- `src/hooks/` - Custom React hooks

## Required Environment Variables

### Backend (`.env` in `/backend`)
```env
# Server
PORT=5000
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000

# Database
MONGO_URI=mongodb://localhost:27017/sales-forecast
# OR MongoDB Atlas connection string

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Email (Optional - for notifications)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Admin
ADMIN_EMAIL=admin@example.com
LOW_STOCK_THRESHOLD=10
```

### Frontend (`.env` in `/frontend`)
```env
VITE_API_URL=http://localhost:5000/api
```

## Dependencies

### Backend
- Express.js - Web framework
- Mongoose - MongoDB ODM
- JWT - Authentication
- Redis - Caching
- Python-shell - Execute Python scripts
- Multer - File uploads
- Winston - Logging
- Swagger - API documentation

### Frontend
- React 18 - UI library
- TypeScript - Type safety
- Vite - Build tool
- React Router - Routing
- TanStack Query - Data fetching
- Radix UI - Component library
- Tailwind CSS - Styling
- Chart.js/Recharts - Data visualization

### Python (for forecasting)
- Prophet - Time series forecasting
- XGBoost - Machine learning
- TensorFlow - Deep learning
- Pandas - Data manipulation
- Scikit-learn - ML utilities

## API Endpoints

Based on routes structure:
- `/api/auth` - Authentication (login, register)
- `/api/sales` - Sales data management
- `/api/products` - Product management
- `/api/forecasts` - Forecasting operations
- `/api/reports` - Report generation
- `/api/marketbasket` - Market basket analysis
- `/api/users` - User management
- `/api-docs` - Swagger documentation

## Setup Steps

1. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd frontend
   npm install
   ```

3. **Install Python Dependencies** (for forecasting)
   ```bash
   cd backend/scripts
   pip install -r requirements.txt
   ```

4. **Set up Environment Variables**
   - Create `.env` files in both backend and frontend directories
   - Configure MongoDB connection
   - Set JWT secret

5. **Start MongoDB** (if running locally)
   - Ensure MongoDB is running on port 27017
   - Or use MongoDB Atlas connection string

6. **Start Redis** (optional, for caching)

7. **Run Backend**
   ```bash
   cd backend
   npm run dev  # Development mode with nodemon
   # OR
   npm start    # Production mode
   ```

8. **Run Frontend**
   ```bash
   cd frontend
   npm run dev
   ```

## Features

1. **Authentication & Authorization**
   - User registration and login
   - JWT-based authentication
   - Role-based access (Admin/User)

2. **Sales Management**
   - Upload sales data (CSV)
   - View and manage sales records
   - Sales analytics and charts

3. **Product Management**
   - CRUD operations for products
   - Inventory tracking
   - Low stock alerts

4. **Forecasting**
   - Generate sales forecasts using ML models
   - Prophet, XGBoost, and TensorFlow integration
   - Forecast visualization

5. **Market Basket Analysis**
   - Association rule mining
   - Product recommendations

6. **Reports**
   - Generate sales reports (CSV/PDF)
   - Generate inventory reports
   - Download reports

7. **User Management** (Admin only)
   - View all users
   - Manage user roles

## Technology Stack Summary

**Backend**: Node.js, Express, MongoDB, Redis, Python
**Frontend**: React, TypeScript, Vite, Tailwind CSS, Radix UI
**ML/AI**: Prophet, XGBoost, TensorFlow, Scikit-learn
**Tools**: Swagger, Winston, Nodemailer

