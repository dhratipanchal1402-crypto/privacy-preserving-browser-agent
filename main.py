
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import re
import pytesseract
from PIL import Image
from PIL import ImageFilter

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

app = FastAPI(title="Privacy-First AI Browser Agent")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:63342", "http://127.0.0.1:63342"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScanRequest(BaseModel):
    text: str
class ImageScanRequest(BaseModel):
    image_path: str

def mask_sensitive_data(text):

    # Email detection
    text = re.sub(
        r'\b[\w.-]+@[\w.-]+\.\w+\b',
        '[EMAIL]',
        text
    )

    # Indian phone number detection
    text = re.sub(
        r'(?<!\d)(?:\+91[- ]?)?[6-9]\d{4}[ -]?\d{5}(?!\d)',
        '[PHONE]',
        text
    )

    # Aadhaar number detection
    text = re.sub(
        r'(?<!\d)\d{4}[ -]?\d{4}[ -]?\d{4}(?!\d)',
        '[AADHAAR]',
        text
    )

    # PAN number detection
    text = re.sub(
        r'\b[A-Z]{5}\d{4}[A-Z]\b',
        '[PAN]',
        text,
        flags=re.IGNORECASE
    )

    # Credit/Debit card number detection
    text = re.sub(
        r'(?<!\d)(?:\d[ -]?){13,19}(?!\d)',
        '[CARD NUMBER]',
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
        "masked_text": masked_text,
        "protection_status": "Sensitive data masked successfully"
    }
@app.post("/scan-image")
def scan_image(request: ImageScanRequest):
    image = Image.open(request.image_path).convert("RGB")

    data = pytesseract.image_to_data(
        image,
        output_type=pytesseract.Output.DICT
    )

    for i, word in enumerate(data["text"]):

        word = word.strip()

        if not word:
            continue

        is_email = re.fullmatch(
            r'[\w.-]+@[\w.-]+\.\w+',
            word
        )

        is_phone = re.fullmatch(
            r'(?:\+91[- ]?)?[6-9]\d{4}[ -]?\d{5}',
            word
        )

        if is_email or is_phone:

            x = data["left"][i]
            y = data["top"][i]
            w = data["width"][i]
            h = data["height"][i]

            area = image.crop((x, y, x + w, y + h))
            blurred = area.filter(ImageFilter.GaussianBlur(10))

            image.paste(blurred, (x, y))

    output_path = request.image_path.replace(
        ".png", "_masked.png"
    )

    image.save(output_path)

    return {
        "message": "Image masking completed!",
        "masked_image_path": output_path
    }
