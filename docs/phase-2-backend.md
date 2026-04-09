# ⚙️ Phase 2 – Backend Development

<p align="center">
  <b>Building a secure, scalable, and production-ready backend using Spring Boot</b>
</p>

---

## 🎯 Objective
Develop a **robust REST API backend** with secure authentication, clean architecture, and seamless ML integration.

---

## 🏗️ Backend Architecture

The backend follows a **layered architecture pattern** for scalability and maintainability:

```mermaid
graph TD
A[Controller Layer] --> B[Service Layer]
B --> C[Repository Layer]
B --> D[DTO Layer]
B --> E[Security Layer]
C --> F[MySQL Database]