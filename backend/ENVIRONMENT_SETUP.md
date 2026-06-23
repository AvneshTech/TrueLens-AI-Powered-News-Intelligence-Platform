# 🔧 TrueLens Backend - Environment Setup

This document explains how to configure environment variables required for running the TrueLens Backend locally and in production.

---

# 📋 Prerequisites

Before starting the backend, ensure you have:

- Java 21+
- Maven 3.9+
- MongoDB Atlas Account (or Local MongoDB)
- NewsAPI Key
- Hugging Face API Token
- Resend API Key (for email verification)

---

# ⚙️ Environment Configuration

Create a `.env` file or configure the following environment variables in your deployment platform.

---

# 🗄️ MongoDB Configuration

### Local MongoDB

```env
MONGODB_URI=mongodb://localhost:27017/truelens
```

### MongoDB Atlas

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/truelens?retryWrites=true&w=majority
```

---

# 🔐 JWT Configuration

```env
JWT_SECRET=replace_with_a_secure_32_plus_character_secret

JWT_EXPIRATION=86400000
```

### Security Recommendation

- Use a secret with at least 32 characters
- Never commit secrets to GitHub
- Rotate secrets periodically

---

# 📰 News API Configuration

Used for fetching and verifying news content.

```env
NEWS_API_KEY=your_newsapi_key
```

Get your API key:

https://newsapi.org

---

# 🤖 Hugging Face Configuration

Used for sentiment analysis and AI-powered features.

```env
HUGGINGFACE_API_KEY=your_huggingface_api_key

HUGGINGFACE_MODEL=distilbert-base-uncased-finetuned-sst-2-english

HUGGINGFACE_SENTIMENT_MODEL=cardiffnlp/twitter-roberta-base-sentiment
```

Generate API token:

https://huggingface.co/settings/tokens

---

# 🧠 ML Service Configuration

Backend communicates with the Flask ML service.

```env
ML_SERVICE_URL=http://localhost:5000
```

---

# 📧 Email Verification Configuration

Used for:

- Account Verification
- Password Reset Emails

```env
RESEND_API_KEY=your_resend_api_key

MAIL_FROM=TrueLens <onboarding@resend.dev>

APP_FRONTEND_URL=http://localhost:5173
```

Get API Key:

https://resend.com

---

# 🌐 CORS Configuration

Development:

```env
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Production Example:

```env
APP_CORS_ALLOWED_ORIGINS=https://truelens.vercel.app
```

Multiple Origins:

```env
APP_CORS_ALLOWED_ORIGINS=http://localhost:5173,https://truelens.vercel.app
```

---

# ⚙️ Server Configuration

```env
PORT=8080

SPRING_LOGGING_LEVEL=INFO
```

---

# 🚀 Running Locally

Start the backend using:

```bash
mvn spring-boot:run
```

Or:

```bash
./mvnw spring-boot:run
```

Backend URL:

```text
http://localhost:8080
```

---

# 📖 API Documentation

After starting the backend:

```text
http://localhost:8080/swagger-ui/index.html
```

---

# 🛡️ Security Best Practices

- Never commit `.env` files
- Store secrets in deployment environment variables
- Use strong JWT secrets
- Restrict CORS origins in production
- Rotate API keys regularly
- Enable HTTPS in production

---

# 🌍 Production Environment Variables

Required variables:

```env
MONGODB_URI
JWT_SECRET
NEWS_API_KEY
HUGGINGFACE_API_KEY
RESEND_API_KEY
ML_SERVICE_URL
APP_FRONTEND_URL
APP_CORS_ALLOWED_ORIGINS
```

---

# ✅ Environment Checklist

- MongoDB Connected
- JWT Secret Configured
- NewsAPI Key Added
- Hugging Face Token Added
- Resend API Key Added
- Flask ML Service Running
- Frontend URL Configured
- CORS Origins Configured

TrueLens Backend is now ready to run.