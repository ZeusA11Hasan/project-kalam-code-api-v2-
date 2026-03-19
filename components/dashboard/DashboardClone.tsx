"use client"

import React from 'react'
import {
    LayoutDashboard,
    Calendar,
    CheckSquare,
    BarChart2,
    Plus,
    Search,
    Bell,
    Share2,
    MoreVertical,
    ChevronRight,
    Target,
    Settings,
    Home,
    Gamepad2,
    User,
    Edit3,
    Trash2,
    ExternalLink,
    PieChart,
    X
} from 'lucide-react'
import { FloatingDock } from "@/components/chat"
import { cn } from '@/lib/utils'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    RadialBarChart,
    RadialBar,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

// --- Mock Data ---
const dockItems = [
    { title: "Home", icon: <Home className="size-full text-white" />, href: "/" },
    { title: "Game", icon: <Gamepad2 className="size-full text-white" />, href: "/game" },
    { title: "Dashboard", icon: <LayoutDashboard className="size-full text-white" />, href: "/dashboard" },
    { title: "Profile", icon: <User className="size-full text-white" />, href: "/profile" },
    { title: "Settings", icon: <Settings className="size-full text-white" />, href: "/settings" }
]

const weeklyProcessData = [
    { name: 'M', learning: 30, coding: 25, quizes: 15 },
    { name: 'T', learning: 40, coding: 35, quizes: 20 },
    { name: 'W', learning: 25, coding: 50, quizes: 30 },
    { name: 'T', learning: 45, coding: 30, quizes: 25 },
    { name: 'F', learning: 35, coding: 25, quizes: 40 },
    { name: 'S', learning: 55, coding: 40, quizes: 35 },
    { name: 'S', learning: 40, coding: 30, quizes: 25 },
]

const radialData = [
    { name: 'Work', value: 120, fill: '#FFFFFF' },
    { name: 'Meditation', value: 80, fill: 'rgba(255,255,255,0.5)' },
    { name: 'Project\'s', value: 60, fill: 'rgba(255,255,255,0.2)' },
]

// --- Glass Variants ---
const glassBase = "bg-white/[0.06] backdrop-blur-[24px] backdrop-saturate-[1.5] border-t border-l border-white/20 border-b border-r border-black/40 shadow-[0_20px_50px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.3),inset_0_-2px_5px_rgba(0,0,0,0.5),inset_0_0_15px_rgba(255,255,255,0.05)]";
const glassThin = "bg-white/[0.02] backdrop-blur-[20px] backdrop-saturate-[1.4] border-t border-l border-white/10 border-b border-r border-black/40 shadow-[0_20px_50px_rgba(0,0,0,0.4),inset_0_1px_2px_rgba(255,255,255,0.2),inset_0_-2px_5px_rgba(0,0,0,0.5),inset_0_0_15px_rgba(255,255,255,0.02)]";
const glassBlack = "bg-black/60 backdrop-blur-[32px] backdrop-saturate-[1.8] border-t border-l border-white/10 border-b border-r border-white/5 shadow-[0_40px_80px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.15),inset_0_-2px_10px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.02)]";

// Ambient Background Orbs + Video
const AmbientBackground = () => (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        {/* Cinematic Video Background */}
        <video autoPlay loop muted playsInline className="absolute inset-0 size-full object-cover">
            <source src="/background.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[12px]" />

        {/* Dynamic Color Blobs */}
        <div className="absolute left-[-10%] top-[-10%] size-[500px] animate-pulse rounded-full bg-purple-600/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] size-[600px] animate-pulse rounded-full bg-blue-600/20 blur-[150px]" style={{ animationDelay: '2s' }} />
        <div className="absolute left-[30%] top-[40%] size-[300px] animate-pulse rounded-full bg-pink-600/15 blur-[100px]" style={{ animationDelay: '4s' }} />
    </div>
);

// Convex Lens Overlay to sell the 3D curve
const GlassCurvature = () => (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1)_0%,transparent_70%)]" />
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
);

const CustomCapsuleBar = (props: any) => {
    const { x, y, width, height, fill } = props;
    if (!height || height <= 0) return null;
    const radius = width / 2;
    const gap = 3; // Gap between capsules
    return (
        <rect
            x={x}
            y={y + gap}
            width={width}
            height={Math.max(0, height - gap * 2)}
            rx={radius}
            ry={radius}
            fill={fill}
            className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
        />
    );
};

const InfoSubCard = ({ label, value, icon: Icon, className }: { label: string, value: number, icon: any, className?: string }) => (
    <motion.div
        whileHover={{ y: -4, scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
        className={cn("group relative flex flex-1 cursor-pointer items-center gap-4 overflow-hidden rounded-3xl border-l border-t border-white/10 bg-white/[0.04] p-4 shadow-[0_10px_20px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)] transition-all", className)}
    >
        <div className="flex size-10 items-center justify-center rounded-2xl bg-white/5 text-white/60 transition-colors group-hover:text-white">
            <Icon size={18} strokeWidth={2.5} />
        </div>
        <div className="flex flex-col">
            <span className="mb-0.5 text-[9px] font-black uppercase tracking-[0.2em] opacity-40">{label}</span>
            <span className="text-xl font-bold tabular-nums text-white">{value}</span>
        </div>
        <GlassCurvature />
    </motion.div>
);

const TaskCard = ({ title, time, dots = false }: { title: string, time: string, dots?: boolean }) => (
    <motion.div
        whileHover={{ rotateX: 5, rotateY: -5, translateZ: 20, scale: 1.02 }}
        initial={{ rotateX: 0, rotateY: 0, translateZ: 0 }}
        className={cn(glassBase, "group relative flex h-full transform-gpu flex-col justify-between overflow-visible rounded-[1.75rem] p-4 hover:bg-white/[0.05] hover:shadow-[0_80px_120px_-30px_rgba(0,0,0,0.7)]")}
        style={{ transformStyle: 'preserve-3d' }}
    >
        <div className="pointer-events-none absolute inset-0 rounded-[1.75rem] bg-gradient-to-br from-white/[0.1] to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
        <div className="relative z-10 flex items-start justify-between" style={{ transform: 'translateZ(30px)' }}>
            <div className="flex size-10 items-center justify-center rounded-full border border-white/30 bg-white/20 text-white shadow-[0_4px_8px_rgba(0,0,0,0.3)] backdrop-blur-md transition-transform group-hover:scale-110">
                <Target size={18} strokeWidth={2.5} />
            </div>
            <div className="cursor-pointer rounded-full p-1.5 text-white/40 transition-colors hover:bg-white/20 hover:text-white">
                <MoreVertical size={16} />
            </div>
        </div>
        <div className="relative z-10 mt-1" style={{ transform: 'translateZ(40px)' }}>
            <h4 className="line-clamp-2 pr-2 text-[13px] font-black leading-tight tracking-tight text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">{title}</h4>
            <p className="mt-1.5 text-[9px] font-black uppercase tracking-wider text-white/50 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">{time}</p>
        </div>

        {dots && (
            <div className="absolute right-4 top-10 z-30 flex translate-y-[-5px] flex-col gap-2 rounded-xl border border-white/20 bg-black/80 px-3 py-2 text-[9px] text-white opacity-0 shadow-[0_4px_8px_rgba(0,0,0,0.3)] backdrop-blur-[60px] transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100" style={{ transform: 'translateZ(60px)' }}>
                <div className="flex cursor-pointer items-center gap-2 font-black transition-colors hover:text-gray-300"><Edit3 size={10} /> Add Note</div>
                <div className="flex cursor-pointer items-center gap-2 font-black transition-colors hover:text-red-400"><Trash2 size={10} /> Delete</div>
            </div>
        )}

        <div className="absolute bottom-4 right-4 z-10 flex size-6 items-center justify-center rounded-full bg-white shadow-[0_4px_8px_rgba(0,0,0,0.3)] transition-transform group-hover:scale-125" style={{ transform: 'translateZ(20px)' }}>
            <div className="size-1.5 animate-pulse rounded-full bg-black"></div>
        </div>
    </motion.div>
)

const ProjectProgressCard = ({ title, progress, status, desc }: { title: string, progress: number, status: string, desc: string }) => (
    <motion.div
        whileHover={{ rotateX: -4, rotateY: 4, translateZ: 30, scale: 1.02 }}
        initial={{ rotateX: 0, rotateY: 0, translateZ: 0 }}
        className="group flex flex-1 transform-gpu flex-col justify-between rounded-[1.75rem] border border-white/[0.05] bg-[#0a0a0b]/80 p-4 text-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] saturate-[150%] backdrop-blur-3xl transition-all duration-500 hover:border-white/[0.1]"
        style={{ transformStyle: 'preserve-3d' }}
    >
        <div className="relative z-10 flex w-full items-start justify-between" style={{ transform: 'translateZ(15px)' }}>
            <h4 className="text-[13px] font-black tracking-tight">{title}</h4>
            <div className="relative flex size-8 items-center justify-center">
                <div className="absolute inset-0 animate-pulse rounded-full bg-white/10 blur-xl"></div>
                <div className="relative z-10 flex size-full items-center justify-center p-0.5">
                    <svg viewBox="0 0 36 36" className="size-full -rotate-90">
                        <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/10" />
                        <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="100" strokeDashoffset={100 - progress} className="text-white drop-shadow-[0_0_8px_white]" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black">{progress}%</span>
                </div>
            </div>
        </div>
        <div className="relative z-10 mt-2" style={{ transform: 'translateZ(25px)' }}>
            <div className="mb-1.5 flex items-center gap-1.5">
                <div className="size-1 rounded-full bg-white opacity-40 shadow-[0_0_5px_white]"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">{status}</span>
            </div>
            <p className="truncate text-[8px] font-extrabold leading-[1.3] text-white/50 drop-shadow-sm">{desc}</p>
        </div>
    </motion.div>
)

const TaskDonutChart = ({ completed, total, size = 80, strokeWidth = 6 }: { completed: number, total: number, size?: number, strokeWidth?: number }) => {
    const percentage = (completed / total) * 100;
    const center = size / 2;
    const radius = center - (strokeWidth / 2);
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div className="group pointer-events-none relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg] transform-gpu">
                {/* Outer Track - Minimalist/Subtle */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth={strokeWidth}
                />

                {/* Inner Progress - Pure White */}
                <motion.circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.9)"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
                    className="drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]"
                />
            </svg>

            {/* Center Text - Centered & Premium Typography */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="translate-x-[0.5px] text-[13px] font-black tracking-widest text-white/90">{Math.round(percentage)}%</span>
            </div>

            {/* Subtle Tooltip - Only on hover and refined */}
            <div className="pointer-events-none absolute -top-10 left-1/2 z-50 origin-bottom -translate-x-1/2 scale-90 whitespace-nowrap rounded-xl border border-white/10 bg-white/10 px-3 py-1.5 opacity-0 shadow-2xl backdrop-blur-2xl transition-opacity duration-300 group-hover:scale-100 group-hover:opacity-100">
                <div className="text-[10px] font-black tracking-widest text-white">{completed} / {total}</div>
            </div>
        </div>
    );
};

export default function GrowthDashboard() {
    const [leftWidth, setLeftWidth] = React.useState(42)
    const [midWidth, setMidWidth] = React.useState(33)
    const [selectedGoal, setSelectedGoal] = React.useState<number | null>(null)
    const [h1, setH1] = React.useState(85) // Height for col 1
    const [h2, setH2] = React.useState(85) // Height for col 2
    const [h3, setH3] = React.useState(85) // Height for col 3
    const [containerMaxWidth, setContainerMaxWidth] = React.useState(100)
    const [isResizingH1, setIsResizingH1] = React.useState(false)
    const [isResizingH2, setIsResizingH2] = React.useState(false)
    const [isResizingV1, setIsResizingV1] = React.useState(false)
    const [isResizingV2, setIsResizingV2] = React.useState(false)
    const [isResizingV3, setIsResizingV3] = React.useState(false)
    const [isResizingR, setIsResizingR] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const startResizingH1 = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizingH1(true)
    }, [])

    const startResizingH2 = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizingH2(true)
    }, [])

    const startResizingV1 = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizingV1(true)
    }, [])

    const startResizingV2 = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizingV2(true)
    }, [])

    const startResizingV3 = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizingV3(true)
    }, [])

    const startResizingR = React.useCallback((e: React.MouseEvent) => {
        e.preventDefault()
        setIsResizingR(true)
    }, [])

    const stopResizing = React.useCallback(() => {
        setIsResizingH1(false)
        setIsResizingH2(false)
        setIsResizingV1(false)
        setIsResizingV2(false)
        setIsResizingV3(false)
        setIsResizingR(false)
    }, [])

    const resize = React.useCallback((e: MouseEvent) => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()

        if (isResizingH1) {
            const newWidth = ((e.clientX - rect.left) / rect.width) * 100
            setLeftWidth(Math.min(Math.max(newWidth, 20), 70))
        }

        if (isResizingH2) {
            const relativeX = e.clientX - rect.left
            const newCumulativeWidth = (relativeX / rect.width) * 100
            const newMidWidth = newCumulativeWidth - leftWidth
            setMidWidth(Math.min(Math.max(newMidWidth, 10), 100 - leftWidth - 10))
        }

        if (isResizingV1) {
            const newHeight = ((e.clientY - rect.top) / rect.height) * 100
            setH1(Math.min(Math.max(newHeight, 30), 100))
        }

        if (isResizingV2) {
            const newHeight = ((e.clientY - rect.top) / rect.height) * 100
            setH2(Math.min(Math.max(newHeight, 30), 100))
        }

        if (isResizingV3) {
            const newHeight = ((e.clientY - rect.top) / rect.height) * 100
            setH3(Math.min(Math.max(newHeight, 30), 100))
        }

        if (isResizingR) {
            const newMaxWidth = ((e.clientX - rect.left) / rect.width) * 100
            setContainerMaxWidth(Math.min(Math.max(newMaxWidth, 50), 100))
        }
    }, [isResizingH1, isResizingH2, isResizingV1, isResizingV2, isResizingV3, isResizingR, leftWidth])

    React.useEffect(() => {
        if (isResizingH1 || isResizingH2 || isResizingV1 || isResizingV2 || isResizingV3 || isResizingR) {
            window.addEventListener('mousemove', resize)
            window.addEventListener('mouseup', stopResizing)
        } else {
            window.removeEventListener('mousemove', resize)
            window.removeEventListener('mouseup', stopResizing)
        }
        return () => {
            window.removeEventListener('mousemove', resize)
            window.removeEventListener('mouseup', stopResizing)
        }
    }, [isResizingH1, isResizingH2, isResizingV1, isResizingV2, isResizingV3, isResizingR, resize, stopResizing])

    return (
        <div className="font-outfit relative flex h-screen w-full overflow-hidden selection:bg-white selection:text-black">
            <AmbientBackground />

            {/* 🛸 LEFT FLOATING DOCK */}
            <div className="fixed left-3 top-1/2 z-[60] hidden -translate-y-1/2 lg:block">
                <FloatingDock items={dockItems} />
            </div>

            {/* 🏙️ MAIN CONTENT */}
            <div className="z-20 flex h-screen flex-1 flex-col overflow-hidden p-6 lg:ml-[130px] lg:mr-6">
                <div className="flex size-full flex-col items-start">
                    <header className="relative z-30 mb-6 flex w-full items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <div className="relative flex size-8 items-center justify-center">
                                <div className="absolute inset-0 scale-150 rounded-full border border-white/30 bg-white/20 blur-xl backdrop-blur-2xl"></div>
                                <svg viewBox="0 0 40 40" fill="none" className="relative z-10 size-7 drop-shadow-[0_0_8px_white]">
                                    <rect x="8" y="8" width="8" height="24" rx="4" fill="white" />
                                    <rect x="24" y="8" width="8" height="24" rx="4" fill="white" />
                                    <circle cx="20" cy="20" r="4" fill="white" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-black tracking-tighter text-white drop-shadow-xl">Hi, User!</h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[10px] font-black text-white shadow-2xl backdrop-blur-3xl transition-all hover:scale-105 hover:bg-white/20">
                                <Plus size={14} strokeWidth={3} />
                                <span>Create</span>
                            </button>
                            <div className="ml-1 flex items-center gap-3">
                                <button className="flex size-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-xl backdrop-blur-2xl transition-all hover:bg-white/20"><Search size={16} strokeWidth={3} /></button>
                                <button className="relative flex size-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white shadow-xl backdrop-blur-2xl transition-all hover:bg-white/20"><Bell size={16} strokeWidth={3} /><span className="absolute right-2.5 top-2.5 size-1 rounded-full bg-white shadow-[0_0_8px_white]"></span></button>
                                <div className="ml-0.5 size-9 cursor-pointer overflow-hidden rounded-full border-2 border-white/30 bg-white/10 shadow-2xl backdrop-blur-2xl">
                                    <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80" alt="Profile" className="size-full object-cover opacity-80 transition-opacity hover:opacity-100" />
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* MAIN RESIZABLE CONTAINER */}
                    <div ref={containerRef} className="flex size-full select-none flex-col gap-6 px-6 pb-6" style={{ maxWidth: `${containerMaxWidth}%`, transition: isResizingR ? 'none' : 'max-width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                        <div className="group/h relative flex h-full items-start gap-6">

                            {/* COLUMN 1: OVERALL METRICS */}
                            <div className="flex flex-col gap-4" style={{ width: `${leftWidth}%`, height: `${h1}%`, transition: isResizingH1 || isResizingV1 ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                <motion.div
                                    layout
                                    whileHover={{ rotateX: 2, rotateY: -2, perspective: 1000 }}
                                    className={cn(glassBlack, "group relative flex flex-1 transform-gpu flex-col overflow-hidden rounded-[2.5rem] p-8 transition-all duration-500")}
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    <GlassCurvature />
                                    <header className="relative z-10 mb-8 flex items-start justify-between" style={{ transform: 'translateZ(30px)' }}>
                                        <div className="flex flex-col">
                                            <span className="mb-1 text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Management</span>
                                            <h2 className="text-3xl font-black tracking-tighter text-white">Overall Metrics</h2>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/10 text-white/40 transition-all hover:bg-white/10 hover:text-white"><Share2 size={16} /></div>
                                            <div className="flex size-9 cursor-pointer items-center justify-center rounded-full border border-white/10 text-white/40 transition-all hover:bg-white/10 hover:text-white"><MoreVertical size={16} /></div>
                                        </div>
                                    </header>

                                    <div className="relative z-10 mb-6 flex items-center gap-8" style={{ transform: 'translateZ(40px)' }}>
                                        <div className="flex flex-col">
                                            <div className="text-2xl font-black text-white">43 TASK DONE</div>
                                            <div className="mt-1 text-[10px] font-extrabold uppercase tracking-widest text-white/30">Production</div>
                                        </div>
                                        <div className="h-10 w-[1px] bg-white/10"></div>
                                        <div className="flex flex-col">
                                            <div className="text-2xl font-black text-white">2 ACTIVE</div>
                                            <div className="mt-1 text-[10px] font-extrabold uppercase tracking-widest text-white/30">In Focus</div>
                                        </div>
                                    </div>

                                    <div className="relative z-10 mb-8 h-1.5 w-full overflow-hidden rounded-full border border-white/5 bg-white/5" style={{ transform: 'translateZ(20px)' }}>
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '85%' }}
                                            className="h-full rounded-full bg-gradient-to-r from-white/20 to-white/80 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                                        />
                                    </div>

                                    <div className="relative z-10 min-h-0 w-full flex-1" style={{ transform: 'translateZ(50px)' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={weeklyProcessData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barSize={14}>
                                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }}
                                                    dy={10}
                                                    padding={{ left: 10, right: 10 }}
                                                />
                                                <Tooltip cursor={{ fill: 'transparent' }} content={() => null} />
                                                <Bar dataKey="quizes" stackId="a" fill="#FF8A8A" shape={<CustomCapsuleBar />} />
                                                <Bar dataKey="coding" stackId="a" fill="#FFD966" shape={<CustomCapsuleBar />} />
                                                <Bar dataKey="learning" stackId="a" fill="#72C1B4" shape={<CustomCapsuleBar />} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Legend matching the image style */}
                                    <div className="relative z-10 mt-6 flex flex-wrap gap-4 px-1" style={{ transform: 'translateZ(30px)' }}>
                                        <div className="flex items-center gap-2">
                                            <div className="size-2.5 rounded-full bg-[#72C1B4] shadow-[0_0_8px_#72C1B4]"></div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Learning</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="size-2.5 rounded-full bg-[#FFD966] shadow-[0_0_8px_#FFD966]"></div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Coding</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="size-2.5 rounded-full bg-[#FF8A8A] shadow-[0_0_8px_#FF8A8A]"></div>
                                            <span className="text-[10px] font-black uppercase tracking-wider text-white/50">Quizes</span>
                                        </div>
                                    </div>

                                    <div className="relative z-10 mt-8 flex gap-4" style={{ transform: 'translateZ(30px)' }}>
                                        <InfoSubCard label="Project's" value={32} icon={PieChart} className={glassBlack} />
                                        <InfoSubCard label="Complete" value={25} icon={CheckSquare} className={glassBlack} />
                                    </div>
                                </motion.div>
                                <div onMouseDown={startResizingV1} className="group relative z-50 -my-3.5 flex h-1.5 cursor-row-resize items-center justify-center transition-all duration-300 hover:bg-white/10">
                                    <div className={cn("pointer-events-none h-[2px] w-20 rounded-full transition-all duration-300", isResizingV1 ? "w-40 scale-y-150 bg-white" : "w-10 bg-white/10 group-hover:bg-white/40")} />
                                </div>
                            </div>

                            {/* HORIZONTAL DIVIDER 1 */}
                            <div onMouseDown={startResizingH1} className="group relative z-50 -mx-5 flex w-4 cursor-col-resize items-center justify-center transition-all duration-300">
                                <div className={cn("pointer-events-none h-24 w-[2px] rounded-full transition-all duration-300", isResizingH1 ? "h-48 scale-x-[3] bg-white" : "h-12 bg-white/10 group-hover:bg-white/40")} />
                            </div>

                            {/* COLUMN 2: ACTIVITY & TEAM */}
                            <div className="flex flex-col gap-4 overflow-hidden" style={{ width: `${midWidth}%`, height: `${h2}%`, transition: isResizingH2 || isResizingV2 ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                <motion.div
                                    whileHover={{ rotateX: -2, rotateY: 2, perspective: 1000 }}
                                    className={cn(glassThin, "group relative flex flex-1 transform-gpu flex-col overflow-hidden rounded-[2.5rem] p-8 transition-all duration-500")}
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    <GlassCurvature />
                                    <h4 className="relative z-10 mb-6 text-[10px] font-black uppercase tracking-[0.2em] opacity-40" style={{ transform: 'translateZ(20px)' }}>Recent Activity</h4>
                                    <div className="relative z-10 space-y-6" style={{ transform: 'translateZ(30px)' }}>
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="group/row flex items-center gap-4">
                                                <div className="size-2.5 rounded-full bg-white/10 transition-all group-hover/row:bg-white group-hover/row:shadow-[0_0_10px_white]"></div>
                                                <div className="flex flex-col">
                                                    <div className="text-[11px] font-black opacity-80">Update Core UI</div>
                                                    <div className="text-[9px] font-bold uppercase opacity-30">4h ago</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="relative z-10 mt-auto" style={{ transform: 'translateZ(20px)' }}>
                                        <h4 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Team</h4>
                                        <div className="flex -space-x-3">
                                            {[1, 2, 3, 4].map((i) => (
                                                <div key={i} className="size-9 overflow-hidden rounded-full border-2 border-black bg-white/10 ring-2 ring-white/5">
                                                    <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="team" className="size-full object-cover opacity-60" />
                                                </div>
                                            ))}
                                            <div className="flex size-9 items-center justify-center rounded-full border-2 border-black bg-white/10 text-[8px] font-black">+2</div>
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                            {/* HORIZONTAL DIVIDER 2 */}
                            <div onMouseDown={startResizingH2} className="group relative z-50 -mx-5 flex w-4 cursor-col-resize items-center justify-center transition-all duration-300">
                                <div className={cn("pointer-events-none h-24 w-[2px] rounded-full transition-all duration-300", isResizingH2 ? "h-48 scale-x-[3] bg-white" : "h-12 bg-white/10 group-hover:bg-white/40")} />
                            </div>

                            {/* COLUMN 3: GOALS & FOCUS */}
                            <div className="flex flex-col gap-4" style={{ width: `${100 - leftWidth - midWidth}%`, height: `${h3}%`, transition: isResizingH2 || isResizingV3 ? 'none' : 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1), height 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                                <motion.div
                                    layout
                                    whileHover={{ rotateX: 2, rotateY: 2, perspective: 1000 }}
                                    className={cn(glassThin, "relative flex flex-1 transform-gpu flex-col overflow-hidden rounded-[2.5rem] p-8 transition-all duration-500")}
                                    style={{ transformStyle: 'preserve-3d' }}
                                >
                                    <GlassCurvature />
                                    <div className="relative z-10 mb-4 mt-0 flex flex-col" style={{ transform: 'translateZ(30px)' }}>
                                        <h4 className="mb-1 px-1 text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Month Progress</h4>
                                        <div className="flex items-start justify-between">
                                            <div className="flex flex-col pt-2">
                                                <div className="text-4xl font-black leading-none tracking-wide text-white drop-shadow-2xl">11 / 17</div>
                                                <div className="mt-3 px-1 text-[9px] font-bold uppercase tracking-[0.4em] text-white/20">Tasks Done</div>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <TaskDonutChart completed={11} total={17} size={64} strokeWidth={5} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative z-10 mt-2 flex min-h-0 flex-1 flex-col" style={{ transform: 'translateZ(20px)' }}>
                                        <div className="mb-4 flex items-center justify-between px-2">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Main Goals</h4>
                                            <motion.button whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }} className="group flex size-7 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/20 shadow-xl transition-all hover:bg-white/10 hover:text-white"><Plus size={12} strokeWidth={3} className="transition-transform group-hover:scale-125" /></motion.button>
                                        </div>
                                        <div className="no-scrollbar relative flex-1 snap-y snap-mandatory scroll-pt-4 space-y-4 overflow-y-auto scroll-smooth px-2 pb-24" style={{ maskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 85%, transparent 100%)' }}>
                                            {[1, 2, 3, 4, 5].map((i) => (
                                                <motion.div
                                                    key={i}
                                                    onClick={() => setSelectedGoal(i)}
                                                    whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.2)' }}
                                                    className="group flex transform-gpu cursor-pointer snap-start snap-always items-center gap-4 rounded-[1.75rem] border border-white/5 bg-white/[0.03] p-4 shadow-[0_4px_12px_-4px_rgba(0,0,0,0.5)] transition-all active:scale-[0.98]"
                                                >
                                                    <div className="flex size-6 items-center justify-center rounded-xl border-2 border-white/10 transition-all group-hover:border-white/40"><div className="size-2.5 scale-0 rounded-md bg-white shadow-[0_0_12px_white] transition-all duration-300 group-hover:scale-100"></div></div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-2 w-[80%] overflow-hidden rounded-full bg-white/5"><div className="h-full bg-gradient-to-r from-white/20 via-white/40 to-white/60 transition-all duration-500 group-hover:from-white/40 group-hover:to-white" style={{ width: `${40 + Math.random() * 40}%` }}></div></div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                        <div onMouseDown={startResizingV3} className="group absolute bottom-2 left-1/2 z-[60] flex h-1.5 w-16 -translate-x-1/2 cursor-row-resize items-center justify-center p-4 transition-all hover:bottom-1">
                                            <div className={cn("h-[3px] w-12 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)] transition-all duration-500", isResizingV3 ? "h-[4px] w-20 bg-white shadow-[0_0_20px_white]" : "bg-white/20 group-hover:bg-white/50")} />
                                        </div>
                                    </div>
                                </motion.div>
                            </div>

                        </div>
                    </div>
                </div>

                <div onMouseDown={startResizingR} className="group fixed right-0 top-0 z-50 flex h-full w-4 cursor-col-resize items-center justify-center transition-all duration-300">
                    <div className={cn("pointer-events-none h-20 w-[2px] rounded-full transition-all duration-300", isResizingR ? "h-full scale-x-150 bg-white shadow-[0_0_20px_white]" : "h-40 bg-white/5 group-hover:bg-white/20")} />
                </div>

                {/* GOAL POPOVER / MODAL */}
                <AnimatePresence>
                    {selectedGoal !== null && (
                        <div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-12">
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedGoal(null)}
                                className="pointer-events-auto absolute inset-0 cursor-pointer bg-black/80 backdrop-blur-xl"
                            />
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, y: 50, rotateX: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: 50, rotateX: 20 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                                className={cn(glassBlack, "pointer-events-auto relative z-10 flex w-full max-w-lg flex-col gap-8 rounded-[3rem] border border-white/10 p-10 shadow-[0_50px_100px_rgba(0,0,0,0.8)]")}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Goal Detail</span>
                                        <h3 className="text-3xl font-black tracking-tight text-white">Main Project Milestone</h3>
                                    </div>
                                    <button
                                        onClick={() => setSelectedGoal(null)}
                                        className="flex size-10 items-center justify-center rounded-full border border-white/10 text-white/40 shadow-xl transition-all hover:bg-white/10 hover:text-white"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1 rounded-3xl border border-white/5 bg-white/5 p-5">
                                        <div className="text-[9px] font-black uppercase tracking-widest opacity-30">Progress</div>
                                        <div className="text-2xl font-black text-white">75%</div>
                                    </div>
                                    <div className="space-y-1 rounded-3xl border border-white/5 bg-white/5 p-5">
                                        <div className="text-[9px] font-black uppercase tracking-widest opacity-30">Deadline</div>
                                        <div className="text-2xl font-black italic text-white">24 MAR</div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Notes</h4>
                                    <div className="rounded-[2rem] border border-white/5 bg-black/40 p-6 text-sm italic leading-relaxed text-white/50">
                                        "Continuously refining the user experience for the next launch phase. The focus should be on performance and responsiveness."
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button className="h-14 flex-1 rounded-2xl bg-white text-sm font-black text-black transition-transform hover:scale-[1.02] active:scale-95">COMPLETE NOW</button>
                                    <button className="flex h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 text-sm font-black text-white transition-all hover:bg-white/10"><Edit3 size={18} /></button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
