from pathlib import Path
from uuid import uuid4
from PIL import Image

from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.audio.generator import generate_wav
from app.image.processor import (
    calculate_statistics,
    image_to_hilbert_array,
    process_image,
)

BASE_DIR = Path(__file__).resolve().parent.parent
GENERATED_DIR = BASE_DIR / "generated"

GENERATED_DIR.mkdir(exist_ok=True)

app = FastAPI(
    title="Hilbert Lab API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount(
    "/files",
    StaticFiles(directory=GENERATED_DIR),
    name="files",
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/convert")
async def convert_image(
    file: UploadFile = File(...),
):
    image_bytes = await file.read()

    file_id = uuid4().hex

    image = process_image(image_bytes)

    grayscale_filename = f"{file_id}.png"
    grayscale_path = GENERATED_DIR / grayscale_filename

    Image.fromarray(image).save(grayscale_path)

    hilbert_array, path = image_to_hilbert_array(image)

    statistics = calculate_statistics(hilbert_array)
    print("6. Statistics calculated")

    audio_filename = f"{file_id}.wav"
    audio_path = GENERATED_DIR / audio_filename

    generate_wav(
        hilbert_array,
        audio_path,
    )

    return {
        "image": {
            "width": 256,
            "height": 256,
            "grayscale": True,
        },
        "statistics": statistics,
        "files": {
            "grayscale": f"/files/{grayscale_filename}",
            "audio": f"/files/{audio_filename}",
        },
    }
