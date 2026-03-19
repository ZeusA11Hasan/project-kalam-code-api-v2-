"use client"

import { useEffect, useState, useMemo } from "react";
import { getProgress, getLevelStatus, LEVELS, type LevelData } from "@/lib/levelStore";

export default function LevelMap() {
    const [progress, setProgress] = useState(getProgress());

    useEffect(() => {
        const handleProgressUpdate = (e: any) => {
            setProgress(e.detail);
        };
        window.addEventListener("xpAdded", handleProgressUpdate);
        return () => window.removeEventListener("xpAdded", handleProgressUpdate);
    }, []);

    // SVG ViewBox: 0 0 280 620
    const nodes = [
        { id: 1, cx: 140, cy: 530, name: "Variables & Datatypes" },
        { id: 2, cx: 80, cy: 400, name: "Loops" },
        { id: 3, cx: 185, cy: 285, name: "If / Else" },
        { id: 4, cx: 95, cy: 175, name: "Lists & Functions" },
        { id: 5, cx: 155, cy: 70, name: "Build Your Own AI" }
    ];

    const paths = [
        { id: "path-1-2", d: "M 140 530 C 100 490, 60 450, 80 400", from: 1, to: 2 },
        { id: "path-2-3", d: "M 80 400 C 120 360, 160 325, 185 285", from: 2, to: 3 },
        { id: "path-3-4", d: "M 185 285 C 150 250, 110 215, 95 175", from: 3, to: 4 },
        { id: "path-4-5", d: "M 95 175 C 115 145, 140 110, 155 70", from: 4, to: 5 }
    ];

    return (
        <div className="level-panel-container size-full overflow-hidden bg-[#03060F]">
            <svg
                viewBox="0 0 280 620"
                className="size-full"
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <radialGradient id="glow-bottom">
                        <stop offset="0%" stopColor="#1E3A8A" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="glow-mid">
                        <stop offset="0%" stopColor="#4338CA" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="transparent" stopOpacity="0" />
                    </radialGradient>
                    <filter id="path-blur">
                        <feGaussianBlur stdDeviation="3" />
                    </filter>
                    <filter id="grayscale">
                        <feColorMatrix type="saturate" values="0" />
                        <feComponentTransfer>
                            <feFuncA type="linear" slope="0.4" />
                        </feComponentTransfer>
                    </filter>
                    <filter id="gold-glow">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Layer 1 — Background */}
                <rect width="280" height="620" fill="#03060F" />

                {/* Layer 2 — City grid */}
                <g opacity="0.07">
                    {/* Vertical perspective lines */}
                    {[0, 35, 70, 105, 140, 175, 210, 245, 280].map((x, i) => (
                        <line key={i} x1="140" y1="0" x2={x} y2="620" stroke="#8AB4F8" strokeWidth="0.5" />
                    ))}
                    {/* Horizontal elliptical arcs (straight as requested for simulated perspective) */}
                    {[80, 150, 210, 265, 315, 360, 400, 440, 475, 510].map((y, i) => (
                        <line key={i} x1="0" y1={y} x2="280" y2={y} stroke="#8AB4F8" strokeWidth="0.5" />
                    ))}
                </g>

                {/* Layer 3 — Glow blobs */}
                <ellipse cx="140" cy="580" rx="180" ry="100" fill="url(#glow-bottom)" />
                <ellipse cx="80" cy="300" rx="120" ry="140" fill="url(#glow-mid)" />

                {/* Layer 4 — Path trails */}
                {paths.map((path, i) => {
                    const statusFrom = getLevelStatus(path.from, progress.currentLevel);
                    const statusTo = getLevelStatus(path.to, progress.currentLevel);

                    let opacityOuter = 0.08;
                    let opacityCore = 0.15;
                    let isDashed = true;
                    let isGlowing = false;

                    if (statusFrom === "completed" && (statusTo === "completed" || statusTo === "active")) {
                        opacityOuter = 0.4;
                        opacityCore = 0.9;
                        isDashed = false;
                        isGlowing = true;
                    } else if (statusFrom === "active" || statusTo === "active") {
                        opacityOuter = 0.2;
                        opacityCore = 0.5;
                        isDashed = true;
                    }

                    return (
                        <g key={path.id}>
                            {/* Outer glow layer */}
                            <path
                                d={path.d}
                                fill="none"
                                stroke="#E0F2FE"
                                strokeWidth="12"
                                opacity={opacityOuter}
                                filter="url(#path-blur)"
                            />
                            {/* Core path layer */}
                            <path
                                id={path.id}
                                d={path.d}
                                fill="none"
                                stroke={isGlowing ? "#E0F2FE" : "#3B82F6"}
                                strokeWidth="3"
                                opacity={opacityCore}
                                strokeLinecap="round"
                                strokeDasharray={isDashed ? "6 8" : "none"}
                                className={isDashed ? "animate-dashMove" : ""}
                            />
                            {/* Animation Dot (Only for completed paths) */}
                            {isGlowing && (
                                <g>
                                    <circle r="8" fill="#E0F2FE" opacity="0.3">
                                        <animateMotion dur="2.5s" repeatCount="indefinite">
                                            <mpath href={`#${path.id}`} />
                                        </animateMotion>
                                    </circle>
                                    <circle r="4" fill="white" opacity="0.95">
                                        <animateMotion dur="2.5s" repeatCount="indefinite">
                                            <mpath href={`#${path.id}`} />
                                        </animateMotion>
                                    </circle>
                                </g>
                            )}
                        </g>
                    );
                })}

                {/* Layer 6-9 — Nodes */}
                {nodes.map((node, i) => {
                    const status = getLevelStatus(node.id, progress.currentLevel);
                    const level = LEVELS[i];
                    const isCompleted = status === "completed";
                    const isActive = status === "active";
                    const isLocked = status === "locked";

                    if (isCompleted) {
                        return (
                            <g key={node.id}>
                                <circle cx={node.cx} cy={node.cy} r="36" fill="radial-gradient(circle, #0D9488 0%, transparent 100%)" opacity="0.25" />
                                <circle cx={node.cx} cy={node.cy} r="30" fill="none" stroke="#0D9488" strokeWidth="2.5" filter="drop-shadow(0 0 5px #0D9488)" />
                                <circle cx={node.cx} cy={node.cy} r="23" fill="radial-gradient(circle, #03060F 0%, #000000 100%)" />
                                <text x={node.cx} y={node.cy} dy="0" fontSize="20" textAnchor="middle" dominantBaseline="central">{level.emoji}</text>
                                <g transform={`translate(${node.cx + 20}, ${node.cy - 20})`}>
                                    <circle r="10" fill="#22C55E" />
                                    <path d="M -4 0 L -1 3 L 4 -2" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </g>
                                <text x={node.cx} y={node.cy + 45} fontSize="12" fontWeight="600" fill="white" textAnchor="middle" opacity="0.8">{level.name}</text>
                            </g>
                        );
                    }

                    if (isActive) {
                        return (
                            <g key={node.id} className="animate-nodeFloat">
                                <circle cx={node.cx} cy={node.cy} r="42" fill="none" stroke="#FACC15" strokeWidth="1.5" opacity="0.8">
                                    <animate attributeName="r" from="34" to="48" dur="2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" from="0.8" to="0" dur="2s" repeatCount="indefinite" />
                                </circle>
                                <circle cx={node.cx} cy={node.cy} r="34" fill="radial-gradient(circle, #FACC15 0%, transparent 100%)" opacity="0.35" />
                                <circle cx={node.cx} cy={node.cy} r="29" fill="none" stroke="#FACC15" strokeWidth="3" filter="url(#gold-glow)" />
                                <circle cx={node.cx} cy={node.cy} r="22" fill="radial-gradient(circle, #451a03 0%, #000000 100%)" />
                                <text x={node.cx} y={node.cy} dy="0" fontSize="22" textAnchor="middle" dominantBaseline="central">{level.emoji}</text>
                                <g transform={`translate(${node.cx}, ${node.cy - 45})`} className="animate-starFloat">
                                    <path d="M 0,-7 L 2,-2 L 7,0 L 2,2 L 0,7 L -2,2 L -7,0 L -2,-2 Z" fill="#FACC15">
                                        <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="5s" repeatCount="indefinite" />
                                    </path>
                                </g>
                                <text x={node.cx} y={node.cy + 45} fontSize="12" fontWeight="600" fill="white" textAnchor="middle">{level.name}</text>
                            </g>
                        );
                    }

                    return (
                        <g key={node.id} opacity="0.45">
                            <circle cx={node.cx} cy={node.cy} r="28" fill="none" stroke="#1E3A8A" strokeWidth="2" />
                            <circle cx={node.cx} cy={node.cy} r="21" fill="#03060F" filter="url(#grayscale)" />
                            <text x={node.cx} y={node.cy} dy="0" fontSize="20" textAnchor="middle" dominantBaseline="central" filter="url(#grayscale)">{level.emoji}</text>
                            <g transform={`translate(${node.cx}, ${node.cy - 14})`}>
                                <path d="M -5 -6 A 5 5 0 0 1 5 -6 L 5 0 L -5 0 Z" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
                                <rect x="-7" y="0" width="14" height="11" rx="2.5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                            </g>
                            <text x={node.cx} y={node.cy + 42} fontSize="10" fill="rgba(255,255,255,0.6)" textAnchor="middle">{level.name}</text>
                        </g>
                    );
                })}
            </svg>

            <style jsx>{`
                @keyframes dashMove {
                    to { stroke-dashoffset: -28; }
                }
                .animate-dashMove {
                    animation: dashMove 1.5s linear infinite;
                }
                @keyframes node-float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .animate-nodeFloat {
                    animation: node-float 2.5s ease-in-out infinite;
                }
                @keyframes star-float {
                    0%, 100% { transform: translate(0, -3px); }
                    50% { transform: translate(0, 0); }
                }
                .animate-starFloat {
                    animation: star-float 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
