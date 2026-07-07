import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Volume2, VolumeX, Sparkles } from 'lucide-react';

interface Bubble {
  id: number;
  size: number;
  xPercent: number; // horizontal starting position (0 - 100)
  duration: number; // rising animation duration (seconds)
  delay: number; // staggered startup delay
  colorClass: string;
  glowClass: string;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

const COLORS = [
  { bg: 'bg-indigo-400/20 border-indigo-300/30 text-indigo-500', glow: 'shadow-[0_0_12px_rgba(129,140,248,0.2)]' },
  { bg: 'bg-blue-400/20 border-blue-300/30 text-blue-500', glow: 'shadow-[0_0_12px_rgba(96,165,250,0.2)]' },
  { bg: 'bg-sky-400/25 border-sky-300/35 text-sky-500', glow: 'shadow-[0_0_12px_rgba(56,189,248,0.25)]' },
  { bg: 'bg-purple-400/20 border-purple-300/30 text-purple-500', glow: 'shadow-[0_0_12px_rgba(192,132,252,0.2)]' },
  { bg: 'bg-emerald-400/15 border-emerald-300/25 text-emerald-500', glow: 'shadow-[0_0_12px_rgba(52,211,153,0.15)]' },
  { bg: 'bg-pink-400/20 border-pink-300/30 text-pink-500', glow: 'shadow-[0_0_12px_rgba(244,114,182,0.2)]' }
];

// Sound Synthesizer function using Web Audio API
const playPopSound = (muted: boolean) => {
  if (muted) return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    // Classic short bubbly click: rapidly sweep frequency from 300Hz to 1200Hz
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.09);
  } catch (e) {
    // Fail silently if browser blocks autoplay/audio context
  }
};

const FloatingBubbleBackground: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [poppedCount, setPoppedCount] = useState<number>(() => {
    return Number(localStorage.getItem('shrivenkatesh_popped_bubbles') || '0');
  });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [muted, setMuted] = useState<boolean>(() => {
    return localStorage.getItem('shrivenkatesh_bubble_mute') === 'true';
  });

  // Initialize a set of stable randomized bubbles
  useEffect(() => {
    const initialBubbles: Bubble[] = Array.from({ length: 18 }, (_, i) => {
      const col = COLORS[i % COLORS.length];
      return {
        id: i,
        size: 20 + (i * 9) % 36, // sizes 20px - 56px
        xPercent: (i * 19) % 91 + 5, // distributed across 5% - 95%
        duration: 9 + (i * 3.1) % 13, // durations 9s - 22s
        delay: (i * 1.7) % 12, // staggered delay up to 12s
        colorClass: col.bg,
        glowClass: col.glow
      };
    });
    setBubbles(initialBubbles);
  }, []);

  // Update particles loop
  useEffect(() => {
    if (particles.length === 0) return;

    const frame = requestAnimationFrame(() => {
      setParticles(prev => 
        prev
          .map(p => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.12, // subtle gravity
            size: p.size * 0.94 // shrink over time
          }))
          .filter(p => p.size > 0.4)
      );
    });

    return () => cancelAnimationFrame(frame);
  }, [particles]);

  const handlePop = (e: React.MouseEvent<HTMLDivElement>, bubble: Bubble) => {
    e.stopPropagation();
    
    // Play synth sound
    playPopSound(muted);

    // Save increment
    const newCount = poppedCount + 1;
    setPoppedCount(newCount);
    localStorage.setItem('shrivenkatesh_popped_bubbles', String(newCount));

    // Get click position relative to the workspace element container
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
    
    if (rect && parentRect) {
      const clickX = rect.left - parentRect.left + rect.width / 2;
      const clickY = rect.top - parentRect.top + rect.height / 2;

      // Spawn pop particles
      const newParticles: Particle[] = Array.from({ length: 8 }, (_, i) => {
        const angle = (i * Math.PI * 2) / 8 + Math.random() * 0.4;
        const speed = 1.8 + Math.random() * 2.5;
        return {
          id: `${bubble.id}-${Date.now()}-${i}`,
          x: clickX,
          y: clickY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2, // upward initial push
          size: 3 + Math.random() * 4,
          color: bubble.colorClass.split(' ')[0] // extract background color
        };
      });

      setParticles(prev => [...prev, ...newParticles]);
    }

    // Temporarily hide bubble and respawn from the bottom with a clean layout animation reset
    setBubbles(prev => 
      prev.map(b => b.id === bubble.id ? { 
        ...b, 
        id: b.id + 1000, 
        delay: 0.1, 
        xPercent: Math.random() * 90 + 5, 
        duration: 8 + Math.random() * 12 
      } : b)
    );
  };

  const toggleMute = () => {
    const nextMute = !muted;
    setMuted(nextMute);
    localStorage.setItem('shrivenkatesh_bubble_mute', String(nextMute));
  };

  return (
    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none select-none -z-10">
      {/* Sound & Counter Interface (Interactive & click/touch targets are pointer-events-auto) */}
      <div className="absolute top-3.5 right-3.5 flex items-center gap-2.5 z-20 pointer-events-auto">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-3xs text-[9px] font-black text-slate-600">
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Pops: <span className="text-indigo-600 font-extrabold">{poppedCount}</span></span>
        </div>

        <button
          onClick={toggleMute}
          title={muted ? "Unmute bubble pops" : "Mute bubble pops"}
          className="p-1.5 rounded-full bg-white/70 backdrop-blur-md border border-slate-200/50 shadow-3xs text-slate-500 hover:text-slate-800 hover:bg-white active:scale-95 transition-all cursor-pointer"
        >
          {muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Render rising bubbles */}
      {bubbles.map((bubble) => (
        <motion.div
          key={bubble.id}
          initial={{ y: "110%", x: "0%" }}
          animate={{
            y: "-15%",
            x: [
              "0%",
              `${Math.sin(bubble.id) * 35}%`,
              `${Math.cos(bubble.id) * -35}%`,
              `${Math.sin(bubble.id * 1.5) * 25}%`,
              "0%"
            ],
            rotate: [0, 45, -45, 25, 0]
          }}
          transition={{
            duration: bubble.duration,
            delay: bubble.delay,
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            left: `${bubble.xPercent}%`,
            width: `${bubble.size}px`,
            height: `${bubble.size}px`
          }}
          className="absolute bottom-0 pointer-events-auto group cursor-crosshair"
        >
          <motion.div
            onClick={(e) => handlePop(e, bubble)}
            whileHover={{ scale: 1.15, filter: "brightness(1.15)" }}
            whileTap={{ scale: 0.9 }}
            className={`w-full h-full rounded-full border flex items-center justify-center transition-shadow duration-300 relative ${bubble.colorClass} ${bubble.glowClass}`}
          >
            {/* Glossy inner light reflect */}
            <div className="absolute top-1 left-1.5 w-1/3 h-1/3 bg-white/30 rounded-full blur-[0.5px]"></div>
            
            {/* Mini bubble core decor */}
            <div className="absolute inset-[10%] rounded-full border border-white/10 pointer-events-none"></div>
          </motion.div>
        </motion.div>
      ))}

      {/* Pop Particle burst effects */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
          className={`rounded-full pointer-events-none ${p.color}`}
        />
      ))}
    </div>
  );
};

export default FloatingBubbleBackground;
