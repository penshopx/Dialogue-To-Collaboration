import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene5Outro() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 6000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-bg-dark z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 w-full h-full">
         <motion.div 
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100vw] h-[100vw] rounded-full opacity-20 blur-[120px]"
           style={{ background: 'radial-gradient(circle, var(--color-accent), transparent)' }}
           animate={{ scale: [0.8, 1.2, 1] }}
           transition={{ duration: 4, ease: "easeOut" }}
         />
      </div>

      <div className="relative z-20 flex flex-col items-center text-center">
        
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: phase >= 1 ? 1 : 0.8, opacity: phase >= 1 ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="flex items-center gap-6 mb-8"
        >
           {/* Logo Mark */}
           <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-accent to-accent-light flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.5)]">
             <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
           </div>
           
           <h1 className="text-[6vw] font-display font-black text-white tracking-tight">
             CollabBuilder
           </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 20 }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-[2.5vw] text-text-secondary font-medium">
            AI-Assisted Workflow Platform
          </p>
          <div className="w-12 h-1 bg-accent mx-auto mt-6 rounded-full" />
        </motion.div>

      </div>
    </motion.div>
  );
}
