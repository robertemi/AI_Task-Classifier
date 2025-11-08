import React from 'react'
import { Button } from '@/components/ui/button'
import GridScan from './GridScan'

export default function Landing({ onStart }: { onStart: () => void }) {
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black">
            {/* Animated background (GridScan fills the viewport) */}
            <div className="absolute inset-0 z-0">
                <GridScan
                    className="w-full h-full"
                    sensitivity={0.55}
                    lineThickness={1}
                    linesColor="#392e4e"
                    gridScale={0.1}
                    scanColor="#FF9FFC"
                    scanOpacity={0.4}
                    enablePost
                    bloomIntensity={0.6}
                    chromaticAberration={0.002}
                    noiseIntensity={0.01}
                />
            </div>

            {/* gradient overlay must not block pointer events so GridScan remains interactive */}
            <div className="absolute inset-0 z-10 bg-gradient-to-br from-purple-900/30 via-indigo-800/25 to-blue-900/30 pointer-events-none" />

            <header className="relative z-20 max-w-4xl px-6 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-md">
                    SmartPM — make task descriptions smarter with AI
                </h1>

                <p className="mt-4 text-lg text-white/85 max-w-2xl mx-auto">
                    Use AI-enhanced descriptions and contextual retrieval to make tasks clearer, actionable and
                    searchable for your team.
                </p>

                <div className="mt-8 flex justify-center">
                    <Button onClick={onStart} className="text-white" aria-label="Start now and sign in">
                        Start now
                    </Button>
                </div>
            </header>
        </div>
    )
}