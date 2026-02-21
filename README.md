# Hospital Management System - Backend API

A robust RESTful API for hospital management, built with Node.js and Express.

## 🏥 Features

- **User Management**: Patient, Doctor, and Admin roles
- **Appointment System**: Book, manage, and track appointments
- **Doctor Availability**: Manage doctor schedules
- **Notifications**: Real-time notification system
- **Reports**: Generate various reports
- **Authentication**: JWT-based secure authentication with OAuth support
- **Audit Logging**: Track all system activities

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MySQL
- **Authentication**: JWT, Passport.js
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js 18 or higher
- MySQL 8.0 or higher
- npm or yarn

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd hms_backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory. See `.env.example` for required variables.

**⚠️ Security Note**: Never commit `.env` files or expose credentials in version control.

### 4. Database Setup

Ensure MySQL is running and create the required database. Database schema will be initialized on first run.

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will start on the configured port (default: 5000).

## 🐳 Docker

### Build and Run Locally

```bash
# Build the image
docker build -t hms-backend .

# Run the container
docker run -p 5000:5000 --env-file .env hms-backend
```

### Using Docker Compose

```bash
docker-compose up
```

## 📁 Project Structure

```
hms_backend/
├── config/          # Database and passport configuration
├── controllers/     # Route controllers
├── middleware/      # Authentication and validation middleware
├── models/          # Database models
├── routes/          # API route definitions
├── utils/           # Utility functions
├── server.js        # Application entry point
└── package.json
```

## 🔒 Security Features

- **Helmet**: HTTP security headers
- **Rate Limiting**: Prevents brute force attacks
- **CORS**: Configured cross-origin resource sharing
- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt encryption
- **Input Validation**: Request validation middleware
- **Audit Logging**: Activity tracking

## 🧪 API Health Check

```bash
curl http://localhost:5000/api/health
```

## 📝 API Documentation

API documentation is available for authenticated users. Contact the system administrator for access.

## 🔄 CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment:

- Automated testing on pull requests
- Docker image builds on merge to main
- Deployment to AWS ECR

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is proprietary software. Unauthorized copying, modification, or distribution is prohibited.

## ⚠️ Security Policy

If you discover a security vulnerability, please report it responsibly by contacting the development team directly. Do not open public issues for security vulnerabilities.

---

**Note**: This README provides general information. For detailed API documentation, deployment guides, and internal configurations, please refer to the internal documentation.
