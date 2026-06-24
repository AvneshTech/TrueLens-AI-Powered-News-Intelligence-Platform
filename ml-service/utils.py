import re
import logging

logger = logging.getLogger(__name__)

# FIX M-9: do NOT call nltk.download() unconditionally at import time.
# A blocking network download on every cold start is fragile (it fails in
# offline/air-gapped containers and slows boot). Instead:
#   1. Try to use the corpus that the Docker image already baked in at build.
#   2. If it is genuinely missing, attempt a one-time download.
#   3. If that also fails (no network), fall back to a small built-in list so
#      the service still starts and clean_text() keeps working.
_FALLBACK_STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "if", "while", "is", "are", "was",
    "were", "be", "been", "being", "to", "of", "in", "on", "for", "with", "as",
    "by", "at", "from", "this", "that", "these", "those", "it", "its", "i",
    "you", "he", "she", "they", "we", "me", "him", "her", "them", "us", "my",
    "your", "his", "their", "our", "not", "no", "so", "than", "then", "too",
    "very", "can", "will", "just", "do", "does", "did", "has", "have", "had",
}


def _load_stop_words():
    try:
        from nltk.corpus import stopwords
        try:
            return set(stopwords.words("english"))
        except LookupError:
            import nltk
            nltk.download("stopwords", quiet=True)
            return set(stopwords.words("english"))
    except Exception as exc:  # offline / nltk missing
        logger.warning("Falling back to built-in stopwords (%s)", exc)
        return set(_FALLBACK_STOPWORDS)


stop_words = _load_stop_words()


def clean_text(text):
    if not isinstance(text, str):
        return ""

    text = text.lower()
    text = re.sub(r"[^a-zA-Z]", " ", text)
    words = text.split()
    words = [w for w in words if w not in stop_words]

    return " ".join(words)
