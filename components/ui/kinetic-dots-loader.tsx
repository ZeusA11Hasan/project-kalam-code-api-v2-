'use client';

import React from 'react';

export default function KineticDotsLoader() {
    const dots = 4;

    return (
        <div className='flex items-center justify-center bg-transparent'>
            <div className='flex gap-5'>
                {[...Array(dots)].map((_, i) => (
                    <div
                        key={i}
                        className='relative flex h-20 w-6 flex-col items-center justify-end'
                    >
                        {/* 1. THE BOUNCING DOT */}
                        <div
                            className='relative z-10 size-5'
                            style={{
                                animation: 'gravity-bounce 1.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
                                animationDelay: `${i * 0.15}s`,
                                willChange: 'transform'
                            }}
                        >
                            <div
                                className='size-full rounded-full bg-gradient-to-b from-cyan-300 to-blue-600 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                                style={{
                                    animation: 'rubber-morph 1.4s linear infinite',
                                    animationDelay: `${i * 0.15}s`,
                                    willChange: 'transform'
                                }}
                            />

                            {/* Specular highlight for liquid look */}
                            <div className='absolute left-1 top-1 size-1.5 rounded-full bg-white/60 blur-[0.5px]' />
                        </div>

                        {/* 2. FLOOR RIPPLE (Shockwave on impact) */}
                        <div
                            className='absolute bottom-0 h-3 w-10 rounded-[100%] border border-cyan-500/30 opacity-0'
                            style={{
                                animation: 'ripple-expand 1.4s linear infinite',
                                animationDelay: `${i * 0.15}s`,
                            }}
                        />

                        {/* 3. REFLECTIVE SHADOW */}
                        <div
                            className='absolute -bottom-1 h-1.5 w-5 rounded-[100%] bg-cyan-500/40 blur-sm'
                            style={{
                                animation: 'shadow-breathe 1.4s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite',
                                animationDelay: `${i * 0.15}s`,
                            }}
                        />
                    </div>
                ))}
            </div>

            <style jsx>{`
        @keyframes gravity-bounce {
          0% { transform: translateY(0); animation-timing-function: cubic-bezier(0.33, 1, 0.68, 1); }
          50% { transform: translateY(-40px); animation-timing-function: cubic-bezier(0.32, 0, 0.67, 0); }
          100% { transform: translateY(0); }
        }

        @keyframes rubber-morph {
          0% { transform: scale(1.4, 0.6); }
          5% { transform: scale(0.9, 1.1); }
          15% { transform: scale(1, 1); }
          50% { transform: scale(1, 1); }
          85% { transform: scale(0.9, 1.1); }
          100% { transform: scale(1.4, 0.6); }
        }

        @keyframes shadow-breathe {
          0% { transform: scale(1.4); opacity: 0.6; }
          50% { transform: scale(0.5); opacity: 0.1; }
          100% { transform: scale(1.4); opacity: 0.6; }
        }

        @keyframes ripple-expand {
          0% { transform: scale(0.5); opacity: 0; border-width: 4px; }
          5% { opacity: 0.8; }
          30% { transform: scale(1.5); opacity: 0; border-width: 0px; }
          100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
        </div>
    )
}
