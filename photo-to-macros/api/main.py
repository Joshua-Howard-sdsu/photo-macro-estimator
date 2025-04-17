from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from api.food_lookup import get_macros_from_label
from api.prompts import gpt_blurb
import base64

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_credentials=True,
    allow_methods=["*"], allow_headers=["*"],
)

@app.post("/analyze")
async def analyze(file: UploadFile):
    contents = await file.read()
    b64 = base64.b64encode(contents).decode("utf-8")

    # MOCK food recognition for now (replace with real Google Vision later)
    label = "pizza"
    macros = get_macros_from_label(label)
    summary = gpt_blurb(label, macros)

    return {
        "food": label,
        "macros": macros,
        "summary": summary
    }
