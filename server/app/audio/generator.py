from pathlib import Path

import numpy as np
from scipy.io.wavfile import write

SAMPLE_RATE = 44_100


def generate_wav(values: np.ndarray, output_path: Path) -> None:
    """
    convert grayscale values [0, 255] into a WAV waveform
    """

    audio = values.astype(np.float32)

    audio = (audio / 255.0) * 2.0 - 1.0

    audio = (audio * 32767).astype(np.int16)

    write(
        output_path,
        SAMPLE_RATE,
        audio,
    )
