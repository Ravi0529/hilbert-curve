# Hilbert Lab

Hilbert Lab is an image-to-sound project. It takes a two-dimensional image, follows the pixels in Hilbert curve order, and converts the resulting one-dimensional signal into a WAV audio file.

The application also displays the image, the Hilbert curve path over the image, the one-dimensional signal, and basic statistics about the signal.

## What Is a Hilbert Curve?

A Hilbert curve is a continuous space-filling curve. It is a line that travels through a square grid and visits every position in that grid exactly once. The curve is built recursively: a small pattern is repeated at larger and larger sizes, with rotations and reflections that allow the sections to connect.

In this project, the image is a 256 by 256 pixel grid. A 256 by 256 image contains 65,536 pixels. The Hilbert curve creates an ordered list of those 65,536 pixel positions:

```text
(x0, y0), (x1, y1), (x2, y2), ... , (x65535, y65535)
```

The order is important. A normal row-by-row scan moves from the end of one row to the beginning of the next row, which can create a large jump across the image. The Hilbert curve usually moves between nearby pixels, even though it eventually covers the whole image.

This property is called spatial locality. Pixels that are close together in the image tend to remain close together in the one-dimensional sequence. That makes the Hilbert curve useful when two-dimensional data must be represented as a one-dimensional stream.

## What the Project Does

The conversion process has these steps:

1. The user uploads an image through the web interface.
2. The server opens the image and converts it to grayscale.
3. The server resizes the image to exactly 256 by 256 pixels.
4. The Hilbert curve generates the coordinates for all 65,536 pixels.
5. The grayscale value at each coordinate is read in Hilbert order.
6. The ordered pixel values are returned as a one-dimensional signal.
7. The signal values are converted into signed audio sample values.
8. The server writes the samples to a 44.1 kHz WAV file.
9. The client displays the results and provides an audio player and download link.

Grayscale values range from 0 to 255. A value of 0 represents black and a value of 255 represents white. Before the values are written as audio, they are mapped to the signed audio range from -1.0 to 1.0 and then stored as 16-bit PCM samples.

## Why Use a Hilbert Curve?

An image has two dimensions: width and height. Audio is a one-dimensional signal that changes over time. To turn an image into sound, the image must be flattened into an ordered list of values.

The Hilbert curve is used as the flattening method because it preserves spatial relationships better than a simple row-by-row scan. Nearby pixels often produce nearby audio samples, so areas of the image can create related sections of the waveform. Large changes in brightness can create larger changes in the waveform and can be heard as changes in the sound.

This does not mean that the resulting sound is a complete or natural representation of everything in the image. It is a way to explore the relationship between visual structure and a signal that can be measured or heard. Different traversal methods can produce different sounds from the same image, so the Hilbert curve is also useful for comparing how data ordering affects sonification.

Hilbert curves are useful beyond this project in areas such as:

- Image and signal processing
- Data visualization
- Spatial indexing and database search
- Computer graphics
- Cache-friendly algorithms
- Converting multidimensional data into a sequence

## Features

- Upload an image in the browser
- Convert the image to a 256 by 256 grayscale image
- Draw the Hilbert curve over the processed image
- Display the Hilbert-ordered one-dimensional signal
- Show signal length, minimum, maximum, mean, and standard deviation
- Play the generated WAV file in the browser
- Download the generated WAV file

## Project Structure

```text
hilbert-curve/
├── client/                 Next.js frontend
│   └── app/
│       ├── page.tsx        Upload interface and visualizations
│       └── globals.css     Global styles
├── server/                 FastAPI backend
│   └── app/
│       ├── main.py         API routes and file generation
│       ├── hilbert/
│       │   └── curve.py    Hilbert coordinate calculation
│       ├── image/
│       │   └── processor.py Image processing and statistics
│       └── audio/
│           └── generator.py WAV generation
└── README.md
```

## Requirements

- Python 3.10 or newer
- Node.js and npm
- A modern web browser

## Running the Backend

Open a terminal in the `server` directory. Create and activate a virtual environment, then install the Python dependencies:

```bash
cd server
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
```

On macOS or Linux, activate the environment with:

```bash
source .venv/bin/activate
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`. The health check is available at `http://localhost:8000/api/health`.

## Running the Frontend

Open another terminal in the `client` directory and install the JavaScript dependencies:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:3000` in a browser. The frontend is configured to send image conversions to the backend at `http://localhost:8000`.

## API Endpoints

### `GET /api/health`

Returns the current health status of the backend:

```json
{
  "status": "ok"
}
```

### `POST /api/convert`

Accepts an uploaded image as multipart form data. It returns the conversion ID, processed image information, signal statistics, and URLs for the generated grayscale image and WAV file.

### `GET /api/convert/{file_id}/data`

Returns the Hilbert-ordered grayscale values and the list of pixel coordinates used to create the curve overlay.

## Technical Details

- The image size is fixed at 256 by 256 pixels.
- The Hilbert curve requires the grid size to be a power of two. The value 256 is suitable because $256 = 2^8$.
- The signal contains $256 \times 256 = 65,536$ samples.
- Audio is generated at a sample rate of 44,100 samples per second.
- Audio samples are stored as signed 16-bit PCM values in a WAV file.
- Image processing uses Pillow and NumPy.
- WAV generation uses SciPy.
- The backend uses FastAPI and the frontend uses Next.js with React.

## Important Limitation

The current backend stores conversion data in memory and generated files on the local server. Conversion data will be lost when the backend restarts, and this setup is intended for local experimentation rather than production storage.
