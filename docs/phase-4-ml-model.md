# 🤖 Phase 4 – Machine Learning & NLP Engine

<p align="center">
  <b>Building an intelligent Fake News Detection system using Natural Language Processing and Machine Learning</b>
</p>

---

# 🎯 Goal

Develop a reliable machine learning pipeline capable of analyzing news content and classifying it as **Fake** or **Real** while providing confidence scores for decision support.

---

# 📊 Dataset

## Source

- Kaggle Fake News Dataset

## Dataset Contents

Each record contains:

- News Title
- News Content
- Label (Fake / Real)

---

# 🧹 Data Preprocessing Pipeline

Raw text data was cleaned and transformed before training.

### Processing Steps

- Convert text to lowercase
- Remove punctuation
- Remove special characters
- Remove stop words
- Tokenization
- Whitespace normalization
- Text cleaning and normalization

---

# ⚙️ Feature Engineering

To convert textual information into machine-readable features:

## TF-IDF Vectorization

Applied:

- Term Frequency (TF)
- Inverse Document Frequency (IDF)

Benefits:

- Captures word importance
- Reduces influence of common terms
- Produces sparse numerical vectors suitable for classification

---

# 🧠 Model Selection

## Logistic Regression

Selected because of:

- Strong baseline performance
- Fast training time
- Low computational overhead
- Good interpretability
- Excellent performance on text classification tasks

---

# 🔍 Machine Learning Pipeline

```mermaid
graph LR

A[Raw News Text]
--> B[Text Preprocessing]

B --> C[TF-IDF Vectorization]

C --> D[Logistic Regression Model]

D --> E[Prediction]

E --> F[Confidence Score]
```

---

# 📈 Model Evaluation

The model was evaluated using standard classification metrics.

| Metric | Purpose |
|----------|----------|
| Accuracy | Overall prediction correctness |
| Precision | Quality of positive predictions |
| Recall | Ability to identify fake news |
| F1-Score | Balance between Precision & Recall |

---

# 🧪 Training Workflow

```text
Dataset
   │
   ▼
Preprocessing
   │
   ▼
TF-IDF Feature Extraction
   │
   ▼
Train/Test Split
   │
   ▼
Model Training
   │
   ▼
Evaluation
   │
   ▼
Model Serialization
```

---

# 💾 Model Persistence

Trained artifacts are stored for inference:

```text
model.pkl

tfidf_vectorizer.pkl
```

These files are loaded by the Flask ML service during startup.

---

# 🌐 Flask ML Service

The trained model is exposed through a lightweight REST API.

### Responsibilities

- Receive prediction requests
- Process incoming text
- Generate fake/real classification
- Return confidence score
- Support backend integration

---

# 🔌 Backend Integration

```text
React Frontend
        │
        ▼
Spring Boot Backend
        │
        ▼
Flask ML Service
        │
        ▼
Prediction Response
```

---

# 📡 Prediction API Flow

```text
User Input
    │
    ▼
Backend Request
    │
    ▼
ML Service
    │
    ▼
Text Preprocessing
    │
    ▼
TF-IDF Transformation
    │
    ▼
Logistic Regression
    │
    ▼
Prediction Result
```

---

# 🚀 Production Considerations

- Model loaded once at startup
- Fast inference response time
- Stateless API design
- Easy model replacement
- Scalable microservice architecture

---

# 🔮 Future Enhancements

- Transformer-Based Models (BERT/RoBERTa)
- Explainable AI Predictions
- Multi-Language Detection
- Continuous Model Retraining
- Ensemble Learning Approaches

---

# ✅ Phase 4 Deliverables

- Dataset Collection Completed
- NLP Preprocessing Pipeline Built
- TF-IDF Feature Engineering Implemented
- Logistic Regression Model Trained
- Model Evaluation Performed
- Model Serialization Completed
- Flask Inference API Developed
- Backend Integration Ready

---

## 📊 Phase Status

**Status:** ✅ Completed

**Technology Stack:** Python • Flask • Scikit-Learn • NLTK • TF-IDF • Logistic Regression