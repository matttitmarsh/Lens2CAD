"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { Upload, FileDown, Loader2, Scan, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Failed to process image");
      }

      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const [isWakingUp, setIsWakingUp] = useState(false);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        const res = await fetch(`${API_URL}/health`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          return true;
        }
      } catch (e) {
        return false;
      }
      return false;
    };

    const init = async () => {
      // Initial check
      const ready = await checkHealth();
      if (!ready) {
        setIsWakingUp(true);
        // Poll until ready
        const interval = setInterval(async () => {
          const isReady = await checkHealth();
          if (isReady) {
            setIsWakingUp(false);
            clearInterval(interval);
          }
        }, 3000);
      }
    };

    init();
  }, []);

  return (
    <main className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30">
      {/* Header */}
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Lens2CAD Logo" className="w-8 h-8" />
            <span className="font-bold text-xl tracking-tight">Lens2CAD</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-neutral-400">
            <span>v1.0.0</span>
            <Link href="/documentation" className="hover:text-white transition-colors">Documentation</Link>
          </div>
        </div>

        {/* Wake Up Banner */}
        {isWakingUp && (
          <div className="bg-indigo-500/10 border-b border-indigo-500/20 py-2 px-4 text-center animate-in slide-in-from-top-2">
            <p className="text-sm text-indigo-300 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Waking up the AI engines... this may take about 30 seconds.
            </p>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero / Upload Section */}
        {!result && (
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-20">
            {/* Left Column: Text */}
            <div className="flex-1 text-center lg:text-left space-y-8">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent leading-tight">
                Turn Photos into <br className="hidden lg:block" /> CAD Files
              </h1>
              <p className="text-lg text-neutral-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Upload a photo of your object on our A4 reference sheet. <br className="hidden lg:block" />
                We'll correct the perspective and generate accurate SVG/DXF files instantly.
              </p>

              <div>
                <a
                  href={`${API_URL}/static/marker_sheet_a4.pdf`}
                  download="Lens2CAD_Reference_A4.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  Download Reference Sheet (A4)
                </a>
              </div>
            </div>

            {/* Right Column: Upload / Status */}
            <div className="flex-1 w-full max-w-md lg:max-w-xl">
              {!loading && (
                <div
                  className={cn(
                    "relative group cursor-pointer border-2 border-dashed rounded-2xl p-12 transition-all duration-300 aspect-square flex flex-col items-center justify-center text-center",
                    dragActive
                      ? "border-indigo-500 bg-indigo-500/10 scale-[1.02]"
                      : "border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/50"
                  )}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleChange}
                  />

                  <div className="flex flex-col items-center gap-6">
                    <div className="w-20 h-20 rounded-full bg-neutral-900 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-neutral-800 shadow-xl">
                      <Upload className="w-10 h-10 text-neutral-400 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xl font-medium text-white">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-sm text-neutral-500">
                        Supports JPG, PNG (Max 10MB)
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {loading && (
                <div className="border-2 border-neutral-800 rounded-2xl p-12 bg-neutral-900/20 flex flex-col items-center justify-center gap-6 aspect-square animate-pulse">
                  <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                  <p className="text-lg text-neutral-400 font-medium">Processing image...</p>
                </div>
              )}

              {error && (
                <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col items-center gap-4 text-red-400 text-center">
                  <AlertCircle className="w-8 h-8" />
                  <p className="text-sm font-medium">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-xs uppercase tracking-wider hover:text-red-300 font-bold"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex flex-col lg:flex-row gap-8 items-start h-full lg:h-[calc(100vh-200px)]">

              {/* Preview Card */}
              <div className="flex-1 w-full h-full bg-neutral-900/50 border border-white/5 rounded-2xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                  <h3 className="font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Scan Result
                  </h3>
                  <span className="text-xs text-neutral-500 font-mono">
                    Scale: {result.scale.toFixed(2)} px/mm
                  </span>
                </div>

                <div className="flex-1 bg-white/5 relative flex items-center justify-center p-8 overflow-hidden">
                  {/* SVG Preview */}
                  <img
                    src={result.svg_url}
                    alt="Processed SVG"
                    className="max-w-full max-h-full shadow-2xl object-contain"
                  />
                </div>
              </div>

              {/* Actions Card */}
              <div className="w-full lg:w-96 space-y-4 flex-shrink-0">
                <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-6 space-y-6">
                  <div>
                    <h3 className="font-medium text-lg mb-1">Download Files</h3>
                    <p className="text-sm text-neutral-500">
                      Ready for fabrication.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <a
                      href={result.svg_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <span className="font-bold text-orange-500 text-xs">SVG</span>
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm">Vector File</p>
                          <p className="text-xs text-neutral-500">For Laser / Web</p>
                        </div>
                      </div>
                      <FileDown className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                    </a>

                    <a
                      href={result.dxf_url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 bg-neutral-800 hover:bg-neutral-700 rounded-xl transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <span className="font-bold text-blue-500 text-xs">DXF</span>
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-sm">CAD File</p>
                          <p className="text-xs text-neutral-500">For CNC / Engineering</p>
                        </div>
                      </div>
                      <FileDown className="w-5 h-5 text-neutral-500 group-hover:text-white transition-colors" />
                    </a>
                  </div>
                </div>

                <button
                  onClick={() => setResult(null)}
                  className="w-full py-4 rounded-xl border border-neutral-800 hover:bg-neutral-900 transition-colors text-neutral-400 hover:text-white flex items-center justify-center gap-2"
                >
                  <Scan className="w-4 h-4" />
                  Scan Another Object
                </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </main>
  );
}
