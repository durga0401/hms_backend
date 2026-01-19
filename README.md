# Hospital Management System - Backend API

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment

Edit the `.env` file with your MySQL credentials:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=hospital_management
JWT_SECRET=your_secret_key
```

### 3. Create Database

Run these SQL commands in MySQL:

```sql
CREATE DATABASE hospital_management;
USE hospital_management;

-- Then run your schema SQL
```

### 4. Start Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

---

## API Endpoints

### Base URL: `http://localhost:5000/api`

---

## 🔐 Authentication Endpoints

### Register User

- **POST** `/api/auth/register`
- **Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "PATIENT",
  "phone": "1234567890"
}
```

### Register Doctor

- **POST** `/api/auth/register`
- **Body:**

```json
{
  "name": "Dr. Smith",
  "email": "drsmith@example.com",
  "password": "password123",
  "role": "DOCTOR",
  "phone": "1234567890",
  "specialization": "Cardiology",
  "experience": 10,
  "qualification": "MD, MBBS",
  "consultation_fee": 500
}
```

### Login

- **POST** `/api/auth/login`
- **Body:**

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### Get Profile

- **GET** `/api/auth/profile`
- **Headers:** `Authorization: Bearer <token>`

### Update Profile

- **PUT** `/api/auth/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**

```json
{
  "name": "John Updated",
  "phone": "9876543210"
}
```

### Change Password

- **PUT** `/api/auth/change-password`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**

```json
{
  "currentPassword": "password123",
  "newPassword": "newpassword123"
}
```

---

## 👨‍⚕️ Doctor Endpoints

### Get All Doctors (Public)

- **GET** `/api/doctors`

### Get Doctor by ID (Public)

- **GET** `/api/doctors/:id`

### Get Doctors by Specialization (Public)

- **GET** `/api/doctors/specialization/:specialization`

### Get Doctor's Available Slots (Public)

- **GET** `/api/doctors/:doctorId/availability`

### Get My Profile (Doctor Only)

- **GET** `/api/doctors/me/profile`
- **Headers:** `Authorization: Bearer <token>`

### Update My Profile (Doctor Only)

- **PUT** `/api/doctors/me/profile`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**

```json
{
  "specialization": "Cardiology",
  "experience": 12,
  "qualification": "MD, MBBS, DM",
  "consultation_fee": 600
}
```

### Add Availability Slot (Doctor Only)

- **POST** `/api/doctors/me/availability`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**

```json
{
  "available_date": "2026-01-20",
  "start_time": "09:00",
  "end_time": "12:00"
}
```

### Add Multiple Availability Slots (Doctor Only)

- **POST** `/api/doctors/me/availability/bulk`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**

```json
{
  "slots": [
    {
      "available_date": "2026-01-20",
      "start_time": "09:00",
      "end_time": "12:00"
    },
    {
      "available_date": "2026-01-20",
      "start_time": "14:00",
      "end_time": "17:00"
    }
  ]
}
```

### Get My Availability (Doctor Only)

- **GET** `/api/doctors/me/availability`
- **Headers:** `Authorization: Bearer <token>`

### Delete Availability Slot (Doctor Only)

- **DELETE** `/api/doctors/me/availability/:slotId`
- **Headers:** `Authorization: Bearer <token>`

---

## 📅 Appointment Endpoints

### Create Appointment (Patient Only)

- **POST** `/api/appointments`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**

```json
{
  "doctor_id": 1,
  "appointment_date": "2026-01-20",
  "appointment_time": "10:00",
  "reason": "Regular checkup"
}
```

### Get My Appointments (Patient Only)

- **GET** `/api/appointments/my-appointments`
- **Headers:** `Authorization: Bearer <token>`

### Cancel My Appointment (Patient Only)

- **PUT** `/api/appointments/:id/cancel`
- **Headers:** `Authorization: Bearer <token>`

### Get Doctor's Appointments (Doctor Only)

- **GET** `/api/appointments/doctor-appointments`
- **Headers:** `Authorization: Bearer <token>`

### Update Appointment Status (Doctor/Admin)

- **PUT** `/api/appointments/:id/status`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**

```json
{
  "status": "CONFIRMED"
}
```

- **Valid statuses:** `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`

### Get All Appointments (Admin Only)

- **GET** `/api/appointments`
- **Headers:** `Authorization: Bearer <token>`

### Get Appointments by Date (Admin Only)

- **GET** `/api/appointments/date/:date`
- **Headers:** `Authorization: Bearer <token>`
- **Example:** `/api/appointments/date/2026-01-20`

### Get Appointments by Status (Admin Only)

- **GET** `/api/appointments/status/:status`
- **Headers:** `Authorization: Bearer <token>`
- **Example:** `/api/appointments/status/PENDING`

### Get Appointment by ID

- **GET** `/api/appointments/:id`
- **Headers:** `Authorization: Bearer <token>`

---

## 🔔 Notification Endpoints

### Get My Notifications

- **GET** `/api/notifications`
- **Headers:** `Authorization: Bearer <token>`

### Get Unread Notifications

- **GET** `/api/notifications/unread`
- **Headers:** `Authorization: Bearer <token>`

### Get Unread Count

- **GET** `/api/notifications/unread-count`
- **Headers:** `Authorization: Bearer <token>`

### Mark Notification as Read

- **PUT** `/api/notifications/:id/read`
- **Headers:** `Authorization: Bearer <token>`

### Mark All as Read

- **PUT** `/api/notifications/read-all`
- **Headers:** `Authorization: Bearer <token>`

### Delete Notification

- **DELETE** `/api/notifications/:id`
- **Headers:** `Authorization: Bearer <token>`

### Delete All Notifications

- **DELETE** `/api/notifications`
- **Headers:** `Authorization: Bearer <token>`

---

## 👑 Admin Endpoints

### Get Dashboard Stats

- **GET** `/api/admin/dashboard`
- **Headers:** `Authorization: Bearer <token>`

### Get Recent Appointments

- **GET** `/api/admin/appointments/recent?limit=10`
- **Headers:** `Authorization: Bearer <token>`

### Create User

- **POST** `/api/admin/users`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**

```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "role": "PATIENT",
  "phone": "1234567890"
}
```

### Send Notification to User

- **POST** `/api/admin/notifications`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**

```json
{
  "user_id": 1,
  "title": "System Update",
  "message": "The system will be under maintenance tomorrow",
  "type": "ADMIN"
}
```

### Broadcast Notification to Role

- **POST** `/api/admin/notifications/broadcast`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**

```json
{
  "role": "PATIENT",
  "title": "New Feature",
  "message": "Check out our new appointment booking feature!",
  "type": "SYSTEM"
}
```

---

## 👤 User Management Endpoints (Admin Only)

### Get All Users

- **GET** `/api/users`
- **Headers:** `Authorization: Bearer <token>`

### Get Users by Role

- **GET** `/api/users/role/:role`
- **Headers:** `Authorization: Bearer <token>`
- **Example:** `/api/users/role/PATIENT`

### Get All Patients

- **GET** `/api/users/patients`
- **Headers:** `Authorization: Bearer <token>`

### Get User by ID

- **GET** `/api/users/:id`
- **Headers:** `Authorization: Bearer <token>`

### Update User

- **PUT** `/api/users/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**

```json
{
  "name": "Updated Name",
  "phone": "9876543210"
}
```

### Delete User

- **DELETE** `/api/users/:id`
- **Headers:** `Authorization: Bearer <token>`

---

## Testing with Postman

### Step 1: Create a New Collection

Create a new collection named "Hospital Management API"

### Step 2: Set Up Environment Variables

Create environment variables:

- `base_url`: `http://localhost:5000/api`
- `token`: (leave empty, will be set after login)

### Step 3: Test Flow

1. **Register Admin** (first user)
   - POST `{{base_url}}/auth/register`
   - Set role as "ADMIN"

2. **Login**
   - POST `{{base_url}}/auth/login`
   - Copy the token from response
   - Set `token` environment variable

3. **Set Authorization**
   - In Postman, go to Authorization tab
   - Select "Bearer Token"
   - Enter `{{token}}`

4. **Test Protected Routes**
   - Use the token for all authenticated requests

### Postman Collection Structure

```
📁 Hospital Management API
├── 📁 Auth
│   ├── Register
│   ├── Login
│   ├── Get Profile
│   ├── Update Profile
│   └── Change Password
├── 📁 Doctors
│   ├── Get All Doctors
│   ├── Get Doctor by ID
│   ├── Get by Specialization
│   ├── Get Availability
│   ├── [Doctor] Get My Profile
│   ├── [Doctor] Update Profile
│   └── [Doctor] Add Availability
├── 📁 Appointments
│   ├── [Patient] Create Appointment
│   ├── [Patient] Get My Appointments
│   ├── [Patient] Cancel Appointment
│   ├── [Doctor] Get Doctor Appointments
│   ├── [Doctor/Admin] Update Status
│   └── [Admin] Get All Appointments
├── 📁 Notifications
│   ├── Get My Notifications
│   ├── Get Unread
│   ├── Mark as Read
│   └── Delete Notification
└── 📁 Admin
    ├── Get Dashboard Stats
    ├── Create User
    ├── Send Notification
    └── Broadcast Notification
```

---

## Response Format

### Success Response

```json
{
    "success": true,
    "message": "Operation successful",
    "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (in development mode)"
}
```

### Validation Error

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Name is required",
      "path": "name",
      "location": "body"
    }
  ]
}
```
