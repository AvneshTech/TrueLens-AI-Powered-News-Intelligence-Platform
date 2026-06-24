# 🤖 TrueLens ML Service

AI-powered Fake News Detection Microservice built with Flask, Scikit-Learn, and NLP.

This service is responsible for:

- 📰 Fake News Detection
- 🔗 URL-based News Analysis
- 📄 Document Analysis (PDF / DOCX)
- 🧠 Machine Learning Predictions
- 📊 Confidence Score Generation
- 🔍 Text Extraction & Processing

---

# 📁 Folder Structure

```bash
ml-service/
│
├── app.py                # Flask API Server
├── train.py              # Model Training Script
├── model.py              # ML Model Utilities
├── extractors.py         # URL/PDF/DOCX Text Extraction
├── utils.py              # Helper Functions
│
├── model.pkl             # Trained ML Model
├── vectorizer.pkl        # TF-IDF Vectorizer
│
├── requirements.txt      # Python Dependencies
├── README.md             # Documentation
│
├── Fake.csv              # Training Dataset (Optional)
└── True.csv              # Training Dataset (Optional)
```

---

# 🚀 Tech Stack

- Python 3.13
- Flask
- Scikit-Learn
- NLTK
- NumPy
- BeautifulSoup
- Requests
- PyPDF
- Python DOCX
- Gunicorn

---

# ⚙️ Local Setup

## Step 1 Clone Repository

```bash
git clone https://github.com/AvneshTech/TrueLens-AI-Powered-News-Intelligence-Platform.git

cd TrueLens
```

---

## Step 2 Navigate to ML Service

```bash
cd ml-service
```

---

## Step 3 Create Virtual Environment

### Windows

```bash
python -m venv .venv
```

### Activate

```bash
.venv\Scripts\activate
```

Terminal should show:

```bash
(.venv)
```

---

## Step 4 Install Dependencies

```bash
pip install -r requirements.txt
```

Verify:

```bash
python -m pip list
```

---

# ▶️ Run ML Service

Start Flask Server:

```bash
python app.py
```

Server runs on:

```bash
http://localhost:5000
```

Health Check:

```bash
http://localhost:5000/health
```

---

# 🧠 Model Training

Training is required only if:

- model.pkl missing
- vectorizer.pkl missing
- Dataset updated
- Scikit-Learn version changed

---

## Dataset Required

Place files inside:

```bash
ml-service/
```

Files:

```bash
Fake.csv
True.csv
```

Dataset Source:

https://www.kaggle.com/datasets/clmentbisaillon/fake-and-real-news-dataset

---

## Train Model

```bash
python train.py
```

Expected Output:

```bash
Loading dataset...
Cleaning text...
Splitting data...
Vectorizing...
Training model...
Evaluating...
Saving model...
DONE
```

Generated Files:

```bash
model.pkl
vectorizer.pkl
```

---

# 🧪 API Endpoints

## Health Check

### GET

```http
/health
```

Response

```json
{
  "status": "healthy"
}
```

---

## Text Prediction

### POST

```http
/predict/text
```

Body:

```json
{
  "text":"Breaking news content..."
}
```

Response:

```json
{
  "prediction":"REAL",
  "confidence":98.7
}
```

---

## URL Prediction

### POST

```http
/predict/url
```

Body:

```json
{
  "url":"https://example.com/news"
}
```

Response:

```json
{
  "prediction":"FAKE",
  "confidence":94.2
}
```

---

# 🛠 Common Commands

## Activate Environment

```bash
.venv\Scripts\activate
```

---

## Deactivate Environment

```bash
deactivate
```

---

## Install New Package

```bash
pip install package-name
```

Example:

```bash
pip install pandas
```

---

## Update Requirements

```bash
pip freeze > requirements.txt
```

---

## Check Installed Packages

```bash
pip list
```

---

## Check Scikit Learn Version

```bash
python -c "import sklearn; print(sklearn.__version__)"
```

---

## Check Pandas Version

```bash
python -c "import pandas; print(pandas.__version__)"
```

---

# 🚀 Deployment (Render)

## Build Command

```bash
pip install -r requirements.txt
```

---

## Start Command

```bash
gunicorn app:app
```

---

# 🔄 Retraining Workflow

When model compatibility issues occur:

Example Error:

```python
AttributeError:
'LogisticRegression'
object has no attribute 'multi_class'
```

Solution:

### Download Dataset

```bash
Fake.csv
True.csv
```

### Train Again

```bash
python train.py
```

### Commit Updated Model

```bash
git add model.pkl vectorizer.pkl
git commit -m "Retrain ML model"
git push origin main
```

### Redeploy Render

```bash
Manual Deploy
→ Deploy Latest Commit
```

---

# 🔧 Git Commands

## Check Status

```bash
git status
```

---

## Add Changes

```bash
git add .
```

---

## Commit

```bash
git commit -m "Update ML service"
```

---

## Push

```bash
git push origin main
```

---

## Pull Latest Changes

```bash
git pull origin main
```

---

# 📊 Model Information

Algorithm:

```text
Logistic Regression
```

Vectorizer:

```text
TF-IDF Vectorizer
```

Dataset:

```text
Fake.csv
True.csv
```

Accuracy:

```text
~98.8%
```

---

# 👨‍💻 Author

Avnesh Kumar

GitHub:
https://github.com/AvneshTech

Project:
TrueLens – AI Powered News Intelligence Platform