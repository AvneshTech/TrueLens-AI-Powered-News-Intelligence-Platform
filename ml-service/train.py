import pandas as pd
import pickle
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from utils import clean_text

print("📥 Loading dataset...")

fake = pd.read_csv("Fake.csv")
true = pd.read_csv("True.csv")

fake["label"] = 0
true["label"] = 1

df = pd.concat([fake, true])
df = df[['text', 'label']]

df = df.sample(frac=1).reset_index(drop=True)

model = LogisticRegression(max_iter=300, class_weight='balanced')

print("🧹 Cleaning text...")
df['text'] = df['text'].apply(clean_text)

print("🔀 Splitting data...")
X_train, X_test, y_train, y_test = train_test_split(
    df['text'], df['label'], test_size=0.2, random_state=42
)

print("📊 Vectorizing...")
vectorizer = TfidfVectorizer(max_features=5000)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

print("🤖 Training model...")
model = LogisticRegression(max_iter=200)
model.fit(X_train_vec, y_train)

print("📈 Evaluating...")
y_pred = model.predict(X_test_vec)

print("Accuracy:", accuracy_score(y_test, y_pred))
print(classification_report(y_test, y_pred))

print("💾 Saving model...")
pickle.dump(model, open("model.pkl", "wb"))
pickle.dump(vectorizer, open("vectorizer.pkl", "wb"))

print("✅ DONE")