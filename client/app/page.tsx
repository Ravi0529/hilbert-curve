"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

type Statistics = {
  length: number;
  min: number;
  max: number;
  mean: number;
  std: number;
};

type ConversionResponse = {
  id: string;
  image: {
    width: number;
    height: number;
    grayscale: boolean;
  };
  statistics: Statistics;
  files: {
    grayscale: string;
    audio: string;
  };
};

type Point = {
  x: number;
  y: number;
};

type ConversionData = {
  array: number[];
  hilbert_path: Point[];
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ConversionResponse | null>(null);

  const [conversionData, setConversionData] = useState<ConversionData | null>(
    null,
  );

  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState("");

  const originalImageUrl = file ? URL.createObjectURL(file) : null;

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setConversionData(null);
    setError("");
  };

  const handleConvert = async () => {
    if (!file) {
      setError("Please select an image first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setConversionData(null);

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(`${API_URL}/api/convert`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to convert image.");
      }

      const data: ConversionResponse = await response.json();

      setResult(data);

      // Fetch the large Hilbert data separately.
      setDataLoading(true);

      const dataResponse = await fetch(
        `${API_URL}/api/convert/${data.id}/data`,
      );

      if (!dataResponse.ok) {
        throw new Error("Failed to fetch Hilbert data.");
      }

      const hilbertData: ConversionData = await dataResponse.json();

      setConversionData(hilbertData);
    } catch (err) {
      console.error(err);

      setError("Something went wrong while processing the image.");
    } finally {
      setLoading(false);
      setDataLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        {/* Header */}
        <header className="mb-12">
          <p className="mb-3 text-sm tracking-widest text-neutral-500">
            HILBERT LAB
          </p>

          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Image → Hilbert Curve → Sound
          </h1>

          <p className="mt-4 max-w-2xl text-neutral-400">
            Convert a 2D image into a 1D signal using Hilbert curve traversal,
            then transform that signal into sound.
          </p>
        </header>

        {/* Upload */}
        <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
          <h2 className="text-lg font-medium">Upload image</h2>

          <p className="mt-1 text-sm text-neutral-500">
            The image should be of 256 × 256 pixels and it will be converted to
            grayscale.
          </p>

          <div className="mt-6">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="block w-full cursor-pointer rounded-lg border border-neutral-700 bg-neutral-950 p-3 text-sm text-neutral-300"
            />
          </div>

          {file && (
            <p className="mt-3 text-sm text-neutral-400">
              Selected: <span className="text-neutral-200">{file.name}</span>
            </p>
          )}

          <button
            onClick={handleConvert}
            disabled={!file || loading}
            className="mt-6 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Converting..." : "Convert"}
          </button>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
        </section>

        {/* Loading Hilbert data */}
        {result && dataLoading && (
          <div className="mt-8 rounded-2xl border border-neutral-800 bg-neutral-900 p-6">
            <p className="text-sm text-neutral-400">
              Loading Hilbert curve data...
            </p>
          </div>
        )}

        {result && !dataLoading && (
          <div className="mt-8 space-y-8">
            {/* Original + Hilbert curve */}
            <section className="grid gap-6 lg:grid-cols-2">
              <ImageCard
                title="Original image"
                src={originalImageUrl}
                alt="Original uploaded image"
              />

              {conversionData && (
                <HilbertOverlay
                  imageUrl={`${API_URL}${result.files.grayscale}`}
                  path={conversionData.hilbert_path}
                />
              )}
            </section>

            {/* 1D signal */}
            {conversionData && <SignalGraph values={conversionData.array} />}

            {/* Statistics + Audio */}
            <section className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
                <h2 className="font-medium">Signal statistics</h2>

                <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Stat
                    label="Length"
                    value={result.statistics.length.toLocaleString()}
                  />

                  <Stat label="Min" value={result.statistics.min.toString()} />

                  <Stat label="Max" value={result.statistics.max.toString()} />

                  <Stat
                    label="Mean"
                    value={result.statistics.mean.toFixed(2)}
                  />

                  <Stat
                    label="Std Dev"
                    value={result.statistics.std.toFixed(2)}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
                <h2 className="font-medium">Generated audio</h2>

                <p className="mt-1 text-sm text-neutral-500">
                  Hilbert-ordered grayscale values converted directly into PCM
                  audio.
                </p>

                <audio
                  controls
                  className="mt-5 w-full"
                  src={`${API_URL}${result.files.audio}`}
                />

                <a
                  href={`${API_URL}${result.files.audio}`}
                  download
                  className="mt-4 inline-block rounded-lg border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800"
                >
                  Download WAV
                </a>
              </div>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

/* -------------------------------------------------- */
/* Image Card                                          */
/* -------------------------------------------------- */

function ImageCard({
  title,
  src,
  alt,
}: {
  title: string;
  src: string | null;
  alt: string;
}) {
  if (!src) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <h2 className="mb-4 font-medium">{title}</h2>

      <div className="overflow-hidden rounded-xl bg-black">
        <img
          src={src}
          alt={alt}
          className="block aspect-square w-full object-contain"
        />
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* Hilbert Overlay                                    */
/* -------------------------------------------------- */

function HilbertOverlay({
  imageUrl,
  path,
}: {
  imageUrl: string;
  path: Point[];
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || path.length === 0) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const image = new Image();

    image.onload = () => {
      const rect = canvas.getBoundingClientRect();

      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const width = rect.width;
      const height = rect.height;

      context.clearRect(0, 0, width, height);

      // Draw image
      context.drawImage(image, 0, 0, width, height);

      // Hilbert coordinates are 0..255.
      const scaleX = width / 255;
      const scaleY = height / 255;

      context.beginPath();

      for (let i = 0; i < path.length; i++) {
        const point = path[i];

        const x = point.x * scaleX;
        const y = point.y * scaleY;

        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }

      context.strokeStyle = "rgba(255, 0, 0, 0.72)";

      context.lineWidth = 0.7;

      context.stroke();

      // Starting point
      const start = path[0];

      context.beginPath();

      context.arc(start.x * scaleX, start.y * scaleY, 4, 0, Math.PI * 2);

      context.fillStyle = "white";
      context.fill();
    };

    image.src = imageUrl;
  }, [imageUrl, path]);

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="mb-4">
        <h2 className="font-medium">Hilbert curve over image</h2>
      </div>

      <div className="mx-auto aspect-square max-w-3xl overflow-hidden rounded-xl bg-black">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      <div className="mt-4 flex items-center gap-5 text-xs text-neutral-500">
        <span>● Start</span>

        <span>0 → 65,535 pixel traversal</span>
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* 1D Signal Graph                                   */
/* -------------------------------------------------- */

function SignalGraph({ values }: { values: number[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || values.length === 0) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const rect = canvas.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = rect.width;
    const height = rect.height;

    context.clearRect(0, 0, width, height);

    context.fillStyle = "#0a0a0a";

    context.fillRect(0, 0, width, height);

    const paddingLeft = 42;
    const paddingRight = 16;
    const paddingTop = 20;
    const paddingBottom = 28;

    const graphWidth = width - paddingLeft - paddingRight;

    const graphHeight = height - paddingTop - paddingBottom;

    // Grid
    context.strokeStyle = "rgba(255,255,255,0.08)";

    context.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = paddingTop + (graphHeight / 4) * i;

      context.beginPath();

      context.moveTo(paddingLeft, y);

      context.lineTo(width - paddingRight, y);

      context.stroke();
    }

    // Y labels
    context.fillStyle = "rgba(255,255,255,0.45)";

    context.font = "11px sans-serif";
    context.textAlign = "right";

    for (let i = 0; i <= 4; i++) {
      const value = 255 - (255 / 4) * i;

      const y = paddingTop + (graphHeight / 4) * i;

      context.fillText(Math.round(value).toString(), paddingLeft - 8, y + 4);
    }

    /*
     * 65,536 points are too many to draw individually
     * at normal screen width.
     *
     * We therefore sample the data into one point
     * per horizontal pixel.
     */
    const pointCount = Math.max(2, Math.floor(graphWidth));

    context.beginPath();

    for (let i = 0; i < pointCount; i++) {
      const start = Math.floor((i / pointCount) * values.length);

      const end = Math.max(
        start + 1,
        Math.floor(((i + 1) / pointCount) * values.length),
      );

      let min = 255;
      let max = 0;

      for (let j = start; j < end && j < values.length; j++) {
        const value = values[j];

        if (value < min) {
          min = value;
        }

        if (value > max) {
          max = value;
        }
      }

      const x = paddingLeft + (i / (pointCount - 1)) * graphWidth;

      const yMax = paddingTop + graphHeight - (max / 255) * graphHeight;

      const yMin = paddingTop + graphHeight - (min / 255) * graphHeight;

      if (i === 0) {
        context.moveTo(x, yMax);
      } else {
        context.lineTo(x, yMax);
      }

      if (yMin !== yMax) {
        context.lineTo(x, yMin);
      }
    }

    context.strokeStyle = "#ffffff";
    context.lineWidth = 1;

    context.stroke();

    // X-axis
    context.strokeStyle = "rgba(255,255,255,0.2)";

    context.beginPath();

    context.moveTo(paddingLeft, height - paddingBottom);

    context.lineTo(width - paddingRight, height - paddingBottom);

    context.stroke();

    context.fillStyle = "rgba(255,255,255,0.45)";

    context.textAlign = "left";

    context.fillText("0", paddingLeft, height - 8);

    context.textAlign = "right";

    context.fillText("65,536", width - paddingRight, height - 8);
  }, [values]);

  return (
    <section className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
      <div className="mb-4">
        <h2 className="font-medium">1D Hilbert signal</h2>

        <p className="mt-1 text-sm text-neutral-500">
          Grayscale pixel values in Hilbert traversal order.
        </p>
      </div>

      <div className="h-80 w-full overflow-hidden rounded-xl border border-neutral-800">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>
    </section>
  );
}

/* -------------------------------------------------- */
/* Statistics                                         */
/* -------------------------------------------------- */

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4">
      <p className="text-xs text-neutral-500">{label}</p>

      <p className="mt-1 text-lg font-medium">{value}</p>
    </div>
  );
}
