# 🧠 Phase 1 – Planning & Architecture

<p align="center">
  <b>Building the foundation of TrueLens with scalable architecture & clear system design</b>
</p>

---

## 🎯 Objective
Design a **robust, scalable, and secure architecture** before starting development.

---

## ✨ Core Features Finalized

- 🔐 **JWT Authentication** (Access + Refresh Token)
- 👤 **Role-Based Access Control** (Admin / User)
- 📰 **News Aggregation System**
- 🤖 **Fake News Detection (ML Integration)**
- 📝 **Notes Management System (CRUD + Export)**
- 💬 **AI Chat Assistant (HuggingFace API)**
- 📊 **Dashboard Analytics**
- 🕘 **Prediction History Tracking**

---

## 🏗️ System Architecture

```mermaid
graph TD
A[React Frontend] --> B[Spring Boot Backend]
B --> C[Flask ML Service]
B --> D[MySQL Database]