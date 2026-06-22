# ⚙️ Phase 2 – Backend Development

<p align="center">
  <b>Building a secure, scalable, and production-ready backend using Spring Boot</b>
</p>

---

## 🎯 Objective

Develop a **robust REST API backend** with secure authentication, MongoDB persistence, and seamless AI/ML integration.

---

## 🏗️ Backend Architecture

The backend follows a **layered architecture pattern** for scalability, maintainability, and clean separation of concerns:

```mermaid
graph TD

A[Controller Layer] --> B[Service Layer]

B --> C[Repository Layer]
B --> D[DTO Layer]
B --> E[Security Layer]

C --> F[(MongoDB Database)]

E --> G[JWT Authentication]
E --> H[Role-Based Authorization]

B --> I[External APIs]
I --> J[NewsAPI]
I --> K[Hugging Face API]

B --> L[ML Service Integration]
L --> M[Python Flask ML Service]