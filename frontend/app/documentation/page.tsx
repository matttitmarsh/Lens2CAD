"use client";

import { ArrowLeft, FileDown, Lightbulb, Camera, Scan, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function Documentation() {
    return (
        <main className="min-h-screen bg-neutral-950 text-white selection:bg-indigo-500/30">
            {/* Header */}
            <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <img src="/logo.svg" alt="Lens2CAD Logo" className="w-8 h-8" />
                            <span className="font-bold text-xl tracking-tight">Lens2CAD</span>
                        </Link>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-neutral-400">
                        <Link href="/" className="flex items-center gap-2 hover:text-white transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Back to App
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold mb-4">Documentation & Best Practices</h1>
                    <p className="text-lg text-neutral-400">
                        How to get the most accurate results with ShapeScan.
                    </p>
                </div>

                <div className="space-y-16">
                    {/* Section 1: The Basics */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 text-indigo-400">
                            <FileDown className="w-6 h-6" />
                            <h2 className="text-2xl font-semibold text-white">1. The Reference Sheet</h2>
                        </div>
                        <div className="prose prose-invert max-w-none text-neutral-300">
                            <p>
                                ShapeScan relies on a specific A4 reference sheet to calculate scale and correct perspective.
                                Without this sheet, the system cannot determine the size of your object.
                            </p>
                            <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-6 mt-4">
                                <h3 className="font-medium text-white mb-2">Printing Instructions</h3>
                                <ul className="list-disc list-inside space-y-2 text-sm">
                                    <li>Print the sheet on standard <strong>A4 paper</strong>.</li>
                                    <li>Ensure print scaling is set to <strong>100%</strong> or "Actual Size". Do not use "Fit to Page".</li>
                                    <li>The markers must be clearly visible and not cut off by printer margins.</li>
                                </ul>
                                <div className="mt-6">
                                    <a
                                        href="http://localhost:8000/static/marker_sheet_a4.pdf"
                                        download="ShapeScan_Reference_A4.pdf"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-medium transition-colors text-white"
                                    >
                                        <FileDown className="w-4 h-4" />
                                        Download Reference Sheet
                                    </a>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Photography Best Practices */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 text-orange-400">
                            <Camera className="w-6 h-6" />
                            <h2 className="text-2xl font-semibold text-white">2. Taking the Photo</h2>
                        </div>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="font-medium text-lg flex items-center gap-2">
                                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                                    Lighting
                                </h3>
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    <strong>Even, diffuse lighting</strong> is key. Avoid strong shadows or direct sunlight that creates high contrast.
                                    Shadows can be mistaken for part of the object.
                                </p>
                                <ul className="space-y-2 text-sm text-neutral-400">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>Use soft daylight or multiple light sources.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <span>Avoid casting your own shadow over the paper.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-medium text-lg flex items-center gap-2">
                                    <Scan className="w-5 h-5 text-blue-400" />
                                    Camera Angle & Distance
                                </h3>
                                <p className="text-neutral-400 text-sm leading-relaxed">
                                    While our software corrects perspective, the physical laws of optics still apply.
                                </p>
                                <ul className="space-y-2 text-sm text-neutral-400">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <span><strong>Hold the camera directly above</strong> the object (nadir view).</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                        <span><strong>Move further away and zoom in</strong> (2x - 5x). This reduces perspective distortion (parallax) significantly compared to holding the camera close.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Technical Note */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3 text-red-400">
                            <AlertTriangle className="w-6 h-6" />
                            <h2 className="text-2xl font-semibold text-white">3. Technical Note: Distortion & Parallax</h2>
                        </div>
                        <div className="bg-neutral-900/50 border border-white/10 rounded-xl p-8 space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-white mb-2">Does ShapeScan correct lens distortion?</h3>
                                <p className="text-neutral-400 leading-relaxed">
                                    Currently, ShapeScan performs a <strong>planar homography transformation</strong>. This mathematically aligns the four corners of the A4 sheet to a perfect rectangle, correcting the perspective of the <em>plane of the paper</em>.
                                </p>
                                <p className="text-neutral-400 leading-relaxed mt-2">
                                    However, it does <strong>not</strong> currently apply non-linear lens distortion correction (undistortion) specific to your camera lens (e.g., removing the "fisheye" effect of wide-angle lenses).
                                </p>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-white mb-2">Recommendation for Mobile Users (Pixel, iPhone, Samsung)</h3>
                                <p className="text-neutral-400 leading-relaxed">
                                    Modern phones (like the Pixel 9 Pro XL) have excellent main sensors but often use wide-angle lenses which introduce radial distortion, especially at close range (25-30cm).
                                </p>
                                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-4 mt-4">
                                    <p className="text-indigo-300 font-medium">
                                        For the most accurate engineering-grade results:
                                    </p>
                                    <ul className="list-disc list-inside mt-2 space-y-1 text-indigo-200/80 text-sm">
                                        <li>Use the <strong>Telephoto lens (2x or 5x)</strong> if your phone has one.</li>
                                        <li>Stand back (1 meter+) and zoom in. This flattens the field and minimizes lens distortion.</li>
                                        <li>Avoid the "0.5x" or "Ultrawide" lens at all costs for measurement tasks.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </main>
    );
}
