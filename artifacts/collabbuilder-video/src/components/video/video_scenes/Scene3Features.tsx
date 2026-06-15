import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const aiAgentsImg = `${import.meta.env.BASE_URL}illustrations/ai-agents.png`;
const heroPipeline = `${import.meta.env.BASE_URL}illustrations/hero-pipeline.png`;

export function Scene3Features() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),   // Setup pipeline
      setTimeout(() => setPhase(2), 3000),  // Pipeline focus
      setTimeout(() => setPhase(3), 6000),  // AI Agents in
      setTimeout(() => setPhase(4), 8000),  // Human Gates
      setTimeout(() => setPhase(5), 11000), // Human Gates focus
      setTimeout(() => setPhase(6), 13000), // Out
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col justify-center bg-bg-dark z-10 px-16"
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, y: "-100%", filter: "blur(10px)" }}
      transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="absolute inset-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--color-accent)_0%,_transparent_70%)]" />

      {/* Title */}
      <motion.div 
        className="absolute top-16 left-16 z-30"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -20 }}
      >
        <h2 className="text-[3vw] font-display font-bold text-white">Structure the Chaos</h2>
        <div className="h-1 w-24 bg-accent mt-2" />
      </motion.div>

      {/* Feature 1: 8-Stage Pipeline */}
      <motion.div 
        className="absolute left-16 top-1/2 -translate-y-1/2 w-[40vw] z-20"
        initial={{ opacity: 0, x: -50 }}
        animate={{ 
          opacity: phase >= 1 && phase < 3 ? 1 : 0.3, 
          x: phase >= 1 ? 0 : -50,
          scale: phase >= 1 && phase < 3 ? 1 : 0.9
        }}
        transition={{ duration: 0.8 }}
      >
        <h3 className="text-[2.5vw] font-bold text-accent-light mb-4">8-Stage Pipeline</h3>
        <p className="text-[1.5vw] text-text-secondary leading-relaxed mb-8">
          Intake → Framing → Skeptic Gate → Blueprint → Delivery → QA Gate → Release → Retro
        </p>
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
           <img src={heroPipeline} className="w-full h-auto object-cover" />
        </div>
      </motion.div>

      {/* Feature 2: AI Agents */}
      <motion.div 
        className="absolute right-16 top-1/4 w-[35vw] z-30"
        initial={{ opacity: 0, x: 50 }}
        animate={{ 
          opacity: phase >= 3 && phase < 4 ? 1 : (phase >= 4 ? 0.3 : 0), 
          x: phase >= 3 ? 0 : 50,
          scale: phase >= 3 && phase < 4 ? 1 : (phase >= 4 ? 0.9 : 0.8)
        }}
        transition={{ duration: 0.8 }}
      >
        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl mb-6">
           <img src={aiAgentsImg} className="w-full h-auto object-cover" />
        </div>
        <h3 className="text-[2.2vw] font-bold text-accent-light mb-2">3 Dedicated AI Agents</h3>
        <p className="text-[1.2vw] text-text-secondary">Strategis • Skeptis • Eksekutor</p>
      </motion.div>

      {/* Feature 3: Human Gates */}
      <motion.div 
        className="absolute right-16 bottom-1/4 w-[35vw] z-30"
        initial={{ opacity: 0, y: 50 }}
        animate={{ 
          opacity: phase >= 4 ? 1 : 0, 
          y: phase >= 4 ? 0 : 50,
          scale: phase >= 4 ? 1 : 0.8
        }}
        transition={{ duration: 0.8 }}
      >
        <div className="p-8 rounded-2xl bg-white/5 border border-accent/30 backdrop-blur-md">
          <h3 className="text-[2.2vw] font-bold text-white mb-4">Human-in-the-Loop Gates</h3>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-success/20 border border-success flex items-center justify-center">
               <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
               </svg>
            </div>
            <p className="text-[1.2vw] text-text-secondary">Approve, reject, or request revisions at critical milestones.</p>
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
}
