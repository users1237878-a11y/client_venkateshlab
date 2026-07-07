import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppIcon, AtheronLogo } from './AppIcon';

interface SplashScreenProps {
  onComplete: () => void;
}

const BOOT_STEPS = [
  "Awakening Storage Cache...",
  "Initializing Database Channels...",
  "Compiling Seat Plan Grid...",
  "Loading Student Registers...",
  "Preparing Accounts Audit...",
  "System Secured."
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [stepText, setStepText] = useState(BOOT_STEPS[0]);

  useEffect(() => {
    // Elegant loading simulation with slight randomness
    let currentPct = 0;
    const interval = setInterval(() => {
      const remaining = 100 - currentPct;
      // Increment faster at first, then slow down slightly
      const increment = Math.max(2, Math.floor(Math.random() * (remaining > 50 ? 15 : 8)));
      currentPct = Math.min(100, currentPct + increment);
      setProgress(currentPct);

      // Map progress to specific boot message milestones
      const stepIdx = Math.min(
        BOOT_STEPS.length - 1,
        Math.floor((currentPct / 100) * BOOT_STEPS.length)
      );
      setStepText(BOOT_STEPS[stepIdx]);

      if (currentPct >= 100) {
        clearInterval(interval);
        // Generous, premium delay before finishing for the exit animation
        setTimeout(() => {
          onComplete();
        }, 800);
      }
    }, 90);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-[#0E131F] flex flex-col justify-between items-center text-white px-6 overflow-hidden select-none"
      id="splash-screen-container"
    >
      {/* Background ambient neon radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top spacing to push center content down */}
      <div className="h-10" />

      {/* Center Section: App Brand & Core Icon */}
      <div className="flex flex-col items-center justify-center text-center">
        {/* Animated App Icon Wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, rotate: -15 }}
          animate={{ opacity: 1, scale: 1.0, rotate: 0 }}
          transition={{ 
            type: "spring", 
            stiffness: 80, 
            damping: 15,
            delay: 0.1 
          }}
          className="relative mb-6"
        >
          <AppIcon size={84} className="shadow-[0_12px_30px_rgba(59,130,246,0.25)] border border-slate-700/30" />
          {/* Subtle pulsating outer aura ring */}
          <div className="absolute inset-0 -m-2 border border-blue-500/30 rounded-2xl animate-pulse" />
        </motion.div>

        {/* Animated Headline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="space-y-1.5"
        >
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-indigo-100 to-indigo-200 bg-clip-text text-transparent">
            SHRI VENKATESH LIBRARY
          </h1>
          <p className="text-[9px] font-semibold text-blue-400 tracking-[0.2em] uppercase">
            STUDY LAB MANAGER
          </p>
        </motion.div>

        {/* Dynamic Interactive Loading bar */}
        <div className="w-48 mt-12 space-y-2.5">
          {/* Progress bar container */}
          <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden p-[2px] border border-slate-700/20">
            <motion.div 
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full"
              style={{ width: `${progress}%` }}
              layout
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Progress metrics row */}
          <div className="flex justify-between items-center text-[9px] font-medium text-slate-400 font-mono tracking-tight px-0.5">
            <span className="animate-pulse">{stepText}</span>
            <span className="font-bold text-slate-200 text-[10px]">{progress}%</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: Atheron Labs Credit with their official Emblem */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 60 }}
        className="pb-10 flex flex-col items-center gap-2.5 text-center relative z-10"
      >
        <div className="flex items-center gap-2 bg-slate-900/50 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800/40 shadow-xl shadow-black/10">
          <AtheronLogo size={24} className="text-blue-400" />
          <div className="text-left leading-none">
            <span className="text-[7.5px] font-black text-slate-450 uppercase tracking-[0.25em] block mb-0.5">Developed by</span>
            <span className="text-[9.5px] font-black tracking-wider bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ATHERON LABS
            </span>
          </div>
        </div>
        <p className="text-[7.5px] text-slate-500 font-bold uppercase tracking-widest pl-1">
          STUDIO BUILD • VERSION 2.2.0
        </p>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
