
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re

app = FastAPI(title="Privacy-First AI Browser Agent")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:63342", "http://127.0.0.1:63342"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScanRequest(BaseModel):
    text: str


def mask_sensitive_data(text):
    # Mask email addresses
    text = re.sub(
        r'\b[\w.-]+@[\w.-]+\.\w+\b',
        '[EMAIL]',
        text
    )

    # Mask phone numbers (10 digits)


    text = re.sub(
        r'(?<!\d)(?:\+91[- ]?)?[6-9]\d{4}[ -]?\d{5}(?!\d)',
        '[PHONE]',
        text
    )


    return text


@app.get("/")
def home():
    return {"message": "Privacy Agent Backend is running!"}


@app.post("/scan")
def scan_text(request: ScanRequest):
    masked_text = mask_sensitive_data(request.text)

    return {
        "original_text": request.text,
        "masked_text": masked_text
    }

