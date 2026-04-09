# 🤖 Phase 4 – Machine Learning Model

<p align="center">
  <b>Building an intelligent Fake News Detection system using NLP and Machine Learning</b>
</p>

---

## 🎯 Objective
Develop a **reliable and accurate machine learning model** to classify news as **Fake or Real**.

---

## 📊 Dataset

- 📁 Source: **Kaggle Fake News Dataset**
- 🧾 Data includes:
  - News text
  - Labels (Fake / Real)

---

## 🧹 Data Preprocessing

Text data was cleaned and prepared using NLP techniques:

- 🔡 Convert text to lowercase  
- ❌ Remove punctuation & special characters  
- 🚫 Remove stopwords  
- ✂️ Tokenization  
- 🧼 Text normalization  

---

## ⚙️ Feature Engineering

- 🧠 Applied **TF-IDF Vectorization**
- 📊 Converted text into numerical feature vectors
- ⚖️ Performed **Train-Test Split**

---

## 🧠 Model Selection

- 🤖 Algorithm: **Logistic Regression**
- ✔ Chosen for:
  - Simplicity
  - Fast training
  - Good performance on text classification

---

## 📈 Model Evaluation

The model was evaluated using:

| Metric     | Purpose |
|-----------|--------|
| Accuracy   | Overall correctness |
| Precision  | Correct positive predictions |
| Recall     | Ability to detect fake news |
| F1-Score   | Balance between precision & recall |

---

## 🔍 ML Pipeline

```mermaid
graph LR
A[Raw Text] --> B[Preprocessing]
B --> C[TF-IDF Vectorization]
C --> D[Logistic Regression Model]
D --> E[Prediction Output]