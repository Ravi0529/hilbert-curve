from io import BytesIO

import numpy as np
from PIL import Image

from app.hilbert.curve import generate_hilbert_path

IMAGE_SIZE = 256


def process_image(image_bytes: bytes) -> np.ndarray:
    """
    resize uploaded image to 256x256 and convert it to grayscale

    it returns numpy arr with shape (256, 256) and values in range [0, 255]
    """

    image = Image.open(BytesIO(image_bytes))

    image = image.convert("L")

    image = image.resize(
        (IMAGE_SIZE, IMAGE_SIZE),
        Image.Resampling.LANCZOS,
    )

    return np.array(image, dtype=np.uint8)


def image_to_hilbert_array(
    image: np.ndarray,
) -> tuple[np.ndarray, list[tuple[int, int]]]:
    """
    traverse the grayscale img using hilbert ordering

    it returns 1D hilbert array containing pixel values and list of (x, y) coordinates corresponding to each value
    """

    height, width = image.shape

    if height != IMAGE_SIZE or width != IMAGE_SIZE:
        raise ValueError(
            f"Image must be exactly {IMAGE_SIZE}x{IMAGE_SIZE}, " f"got {width}x{height}"
        )

    path = generate_hilbert_path(IMAGE_SIZE)

    values = [int(image[y, x]) for x, y in path]

    return np.array(values, dtype=np.uint8), path


def calculate_statistics(array: np.ndarray) -> dict:
    return {
        "length": int(len(array)),
        "min": int(array.min()),
        "max": int(array.max()),
        "mean": float(array.mean()),
        "std": float(array.std()),
    }
