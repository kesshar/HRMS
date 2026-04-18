# 🚀 ZENITH HR – Mini AI HRMS

An AI-powered and Blockchain-integrated Human Resource Management System (HRMS) built for modern organizations.

ZENITH HR helps companies manage employees, tasks, analytics, and payroll with intelligent automation and secure wallet integration.

---

## 🌟 Features

### 🔐 Authentication & Authorization
- Organization Registration
- Admin Login
- Employee Login
- JWT-based Authentication
- Role-Based Access Control (Admin / Employee)

### 👥 Employee Management
- Add Employee
- Update Employee
- Delete Employee
- Department Management
- Skills Management
- Employee Activation / Deactivation

### 📋 Task Management
- Assign Tasks to Employees
- Track Task Completion
- Dashboard Task Analytics
- Weekly Performance Overview

### 📊 Dashboard Analytics
- Total Employees
- Total Tasks
- Completed Tasks
- Department Distribution
- Real-time Updates

### 🤖 AI Features (Planned / Integrated)
- AI-based Workforce Insights
- Employee Performance Scoring
- Predictive Task Completion
- HR Recommendation Engine

### 🔗 Blockchain Integration
- Wallet Connect Functionality
- Secure Wallet Address Storage
- Token-based Reward System
- Smart Payroll (Planned)

### 💳 Pricing Plans
- Starter (Free)
- Professional ($29/month)
- Enterprise (Custom)

---

## 🛠 Tech Stack

### Frontend
- React.js
- React Router
- Axios
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt.js

### Blockchain
- Wallet Integration
- Secure Address Storage
- Smart Contract Ready Architecture

---

## 📁 Project Structure
frontend/
├── src/
│ ├── pages/
│ ├── components/
│ ├── services/
│ └── App.jsx

backend/
├── controllers/
├── models/
├── routes/
├── middleware/
└── server.js


---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/zenith-hr.git
cd zenith-hr
2️⃣ Backend Setup
cd backend
npm install

Create a .env file inside backend/:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

Run backend:

npm run dev
3️⃣ Frontend Setup
cd frontend
npm install
npm run dev

Frontend runs on:

http://localhost:5173

Backend runs on:

http://localhost:5000
🔑 API Endpoints (Major)
Auth

POST /api/auth/register

POST /api/auth/login

GET /api/auth/profile

Employees

POST /api/employees

GET /api/employees

PUT /api/employees/:id

DELETE /api/employees/:id

🔐 Security Features

Password Hashing using bcrypt

JWT Token Authentication

Protected Routes

Role-Based Middleware (Admin Only / Employee Only)

Organization-level Data Isolation

📈 12-Month Product Roadmap

MVP HRMS Core

Payroll Automation

AI Analytics Engine

Blockchain Payroll Integration

Enterprise Scaling

Predictive HR Intelligence

🎯 Target Users

Startups

Mid-size companies

Enterprises

HR teams

Web3-enabled organizations

🚀 Future Improvements

Mobile Application

Smart Contract Payroll Automation

AI-based Hiring Engine

Real-time Performance Insights

Global Payroll Compliance

👨‍💻 Author

Prashant Singh
Full Stack Developer | AI & Web3 Enthusiast

📄 License

This project is for educational and demonstration purposes.
