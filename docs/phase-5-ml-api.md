# 🔗 Phase 5 – ML API & Backend Integration

## 📌 Goal
Integrate ML model with backend services

## 🐍 ML API
- Flask-based API
- `/predict` endpoint

### Returns:
- Prediction (Fake / Real)
- Confidence score

## 🔗 Backend Integration
- MlService calls ML API
- DetectionController handles requests
- Stores results in PredictionHistory

## 🧠 Additional AI Features
- HuggingFaceService (Chat Assistant)
- FactCheckService
- Sentiment Analysis API

## 📊 Controllers Implemented
- DetectionController
- ChatController
- FactCheckController
- AnalyticsController

## 🎯 Deliverables
- End-to-end ML integration
- Prediction stored & displayed