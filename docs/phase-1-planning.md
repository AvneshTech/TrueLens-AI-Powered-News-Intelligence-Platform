# 🧠 Phase 1 – Planning & Architecture

<p align="center">
  <b>Building the foundation of TrueLens with scalable architecture & clear system design</b>
</p>

---

## 🎯 Objective

Design a **robust, scalable, secure, and production-ready architecture** before starting development.

---

## ✨ Core Features Finalized

- 🔐 JWT Authentication (Access + Refresh Token)
- 📧 Email Verification & Password Reset
- 👤 Role-Based Access Control (Admin / User)
- 📰 News Aggregation System
- 🤖 Fake News Detection (ML Integration)
- 📝 Notes Management System (CRUD + PDF/JPG Export)
- 💬 AI Chat Assistant
- 🔔 Real-Time Notifications
- 📊 Dashboard Analytics
- 🕘 Prediction History Tracking
- 📈 Admin Analytics & Monitoring

---

## 🏗️ System Architecture

```mermaid
graph TD

A[React Frontend] --> B[Spring Boot Backend]

B --> C[Python ML Service]
B --> D[(MongoDB Database)]

B --> E[NewsAPI]
B --> F[Hugging Face API]
B --> G[Resend Email Service]

D --> H[Users]
D --> I[Notes]
D --> J[Prediction History]
D --> K[Notifications]
D --> L[Refresh Tokens]
D --> M[Verification Tokens]
D --> N[Blacklisted Tokens]