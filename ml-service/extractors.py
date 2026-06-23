"""
PHASE 6: text extraction helpers for the /predict/url and /predict/file endpoints.

Kept separate from app.py so the extraction logic (which does its own I/O, parsing,
and error handling) stays independently testable from the Flask routing layer.
"""
import io
import json
import logging
import re

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

# ─── Shared limits ──────────────────────────────────────────────────────────
MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024  # 10 MB cap on any fetched/uploaded content
REQUEST_TIMEOUT_SECONDS = 10
USER_AGENT = "TrueLens-Bot/1.0 (+https://truelens.example/bot)"

# A short list of well-known low-credibility / satire domains used for a basic
# heuristic signal alongside the ML model's text-only prediction. This is
# intentionally small and conservative — it nudges the result, it never
# overrides the model.
LOW_CREDIBILITY_DOMAINS = {
    "theonion.com",
    "babylonbee.com",
    "worldnewsdailyreport.com",
    "empirenews.net",
    "nationalreport.net",
}

HIGH_CREDIBILITY_DOMAINS = {
    "reuters.com",
    "apnews.com",
    "bbc.com",
    "bbc.co.uk",
    "npr.org",
    "nytimes.com",
    "wsj.com",
    "theguardian.com",
}


class ExtractionError(Exception):
    """Raised when a URL or file's content can't be turned into article text."""


def domain_credibility_hint(url: str) -> str | None:
    """Returns 'high', 'low', or None for an unrecognized domain."""
    try:
        from urllib.parse import urlparse
        host = urlparse(url).hostname or ""
        host = host.lower().removeprefix("www.")
    except Exception:
        return None

    if host in LOW_CREDIBILITY_DOMAINS:
        return "low"
    if host in HIGH_CREDIBILITY_DOMAINS:
        return "high"
    return None


def extract_text_from_url(url: str) -> str:
    """
    Fetches a URL and extracts the main article text using a readability-style
    heuristic: prefer <article>/<main>, fall back to the largest cluster of <p>
    tags, and strip nav/script/style/aside noise.
    """
    if not re.match(r"^https?://", url, re.IGNORECASE):
        raise ExtractionError("URL must start with http:// or https://")

    try:
        response = requests.get(
            url,
            headers={"User-Agent": USER_AGENT},
            timeout=REQUEST_TIMEOUT_SECONDS,
            stream=True,
        )
        response.raise_for_status()

        content_type = response.headers.get("Content-Type", "")
        if "text/html" not in content_type and "application/xhtml" not in content_type:
            raise ExtractionError(f"URL did not return HTML content (got {content_type or 'unknown'})")

        raw = response.raw.read(MAX_DOWNLOAD_BYTES + 1, decode_content=True)
        if len(raw) > MAX_DOWNLOAD_BYTES:
            raise ExtractionError("Page is too large to analyze")

    except requests.exceptions.Timeout:
        raise ExtractionError("Timed out fetching the URL")
    except requests.exceptions.SSLError:
        raise ExtractionError("Could not establish a secure connection to that URL")
    except requests.exceptions.ConnectionError:
        raise ExtractionError("Could not connect to that URL")
    except requests.exceptions.HTTPError as e:
        raise ExtractionError(f"URL returned an error response ({e.response.status_code})")
    except ExtractionError:
        raise
    except Exception as e:
        logger.warning("Unexpected error fetching URL %s: %s", url, e)
        raise ExtractionError("Could not fetch that URL")

    soup = BeautifulSoup(raw, "html.parser")

    for tag in soup(["script", "style", "nav", "header", "footer", "aside", "noscript", "form"]):
        tag.decompose()

    article = soup.find("article") or soup.find("main")
    container = article if article else soup.body

    if container is None:
        raise ExtractionError("Could not find readable content on that page")

    paragraphs = [p.get_text(" ", strip=True) for p in container.find_all("p")]
    paragraphs = [p for p in paragraphs if len(p.split()) >= 5]  # drop nav/caption noise
    text = "\n\n".join(paragraphs)

    if len(text.split()) < 30:
        raise ExtractionError(
            "Could not extract enough readable article text from that page"
        )

    return text


def extract_text_from_file(filename: str, file_bytes: bytes) -> str:
    """Dispatches to the right parser based on file extension."""
    if len(file_bytes) > MAX_DOWNLOAD_BYTES:
        raise ExtractionError("File is too large to analyze (max 10MB)")

    lower_name = (filename or "").lower()

    if lower_name.endswith(".pdf"):
        return _extract_pdf(file_bytes)
    if lower_name.endswith(".docx"):
        return _extract_docx(file_bytes)
    if lower_name.endswith(".csv"):
        return _extract_csv(file_bytes)
    if lower_name.endswith(".json"):
        return _extract_json(file_bytes)
    if lower_name.endswith(".txt"):
        return _extract_txt(file_bytes)

    raise ExtractionError(
        "Unsupported file type. Please upload a .txt, .pdf, .docx, .csv, or .json file"
    )


def _extract_pdf(file_bytes: bytes) -> str:
    from pypdf import PdfReader

    try:
        reader = PdfReader(io.BytesIO(file_bytes))
    except Exception as e:
        raise ExtractionError(f"Could not read PDF: {e}")

    if reader.is_encrypted:
        raise ExtractionError("Encrypted PDFs are not supported")

    pages_text = []
    for page in reader.pages:
        try:
            pages_text.append(page.extract_text() or "")
        except Exception:
            continue  # skip unreadable pages rather than failing the whole document

    text = "\n\n".join(pages_text).strip()
    if not text:
        raise ExtractionError(
            "No extractable text found in PDF (it may be a scanned image)"
        )
    return text


def _extract_docx(file_bytes: bytes) -> str:
    from docx import Document

    try:
        doc = Document(io.BytesIO(file_bytes))
    except Exception as e:
        raise ExtractionError(f"Could not read DOCX: {e}")

    text = "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
    if not text:
        raise ExtractionError("No extractable text found in DOCX")
    return text


def _extract_txt(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode("utf-8", errors="replace")
    except Exception as e:
        raise ExtractionError(f"Could not read text file: {e}")


def _extract_csv(file_bytes: bytes) -> str:
    import csv as csv_module

    try:
        decoded = file_bytes.decode("utf-8", errors="replace")
        reader = csv_module.reader(io.StringIO(decoded))
        rows = list(reader)
    except Exception as e:
        raise ExtractionError(f"Could not read CSV: {e}")

    if not rows:
        raise ExtractionError("CSV file is empty")

    # Flatten every cell into a single text blob — the model only consumes
    # plain text, so structure beyond row order is lost on purpose here.
    text = "\n".join(" ".join(cell for cell in row if cell) for row in rows)
    if not text.strip():
        raise ExtractionError("No extractable text found in CSV")
    return text


def _extract_json(file_bytes: bytes) -> str:
    try:
        data = json.loads(file_bytes.decode("utf-8", errors="replace"))
    except Exception as e:
        raise ExtractionError(f"Could not parse JSON: {e}")

    def collect_strings(value, acc):
        if isinstance(value, str):
            acc.append(value)
        elif isinstance(value, dict):
            for v in value.values():
                collect_strings(v, acc)
        elif isinstance(value, list):
            for v in value:
                collect_strings(v, acc)

    strings: list[str] = []
    collect_strings(data, strings)
    text = "\n".join(s for s in strings if len(s.split()) >= 3)

    if not text.strip():
        raise ExtractionError("No extractable text found in JSON")
    return text
