# ⚙️ Phase 2 – Backend Development

## 📌 Goal
Build a secure and scalable backend using Spring Boot with REST APIs and JWT authentication.

---

## 🏗️ Backend Architecture
The backend follows a layered architecture:

- Controller Layer → Handles HTTP requests
- Service Layer → Business logic
- Repository Layer → Database interaction
- DTO Layer → Data transfer objects
- Security Layer → Authentication & authorization

---

## 🔐 Authentication & Security
- JWT-based authentication implemented
- Access Token + Refresh Token mechanism
- Role-based authorization (Admin / User)
- Spring Security configuration
- Password encryption using BCrypt
- Token blacklist system (logout handling)

---

## 📊 Database Integration
- Connected with MySQL database
- ORM: Spring Data JPA / Hibernate

### Entities:
- User
- Note
- PredictionHistory
- RefreshToken

---

## 🔗 REST API Development

### Authentication APIs
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout

### Notes APIs
- GET /api/notes
- POST /api/notes
- PUT /api/notes/{id}
- DELETE /api/notes/{id}

### Detection APIs
- POST /api/detect → Fake news detection

### Analytics APIs
- GET /api/analytics → Prediction stats

### Chat API
- POST /api/chat → AI assistant

---

## 🧠 Business Logic Features
- News text sent to ML API for prediction
- Response stored in PredictionHistory
- User-specific data handling
- Exception handling with GlobalExceptionHandler

---

## ⚙️ Additional Features
- Input validation using annotations
- Logging for debugging
- Error handling with proper status codes

---

## 🎯 Deliverables
- Fully functional backend APIs
- Secure authentication system
- ML API integration ready
- Clean and scalable architecture