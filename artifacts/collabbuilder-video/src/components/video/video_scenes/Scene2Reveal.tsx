import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export function Scene2Reveal() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1500),
      setTimeout(() => setPhase(3), 3000),
      setTimeout(() => setPhase(4), 5000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-accent z-10 overflow-hidden"
      initial={{ clipPath: "circle(0% at 50% 50%)" }}
      animate={{ clipPath: "circle(150% at 50% 50%)" }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
    >
      {/* Background Rings */}
      <motion.div 
        className="absolute w-[120vw] h-[120vw] border-[1px] border-white/10 rounded-full"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
      />
      <motion.div 
        className="absolute w-[80vw] h-[80vw] border-[2px] border-white/20 rounded-full"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2, delay: 0.2, ease: "easeOut" }}
      />

      <div className="relative z-20 flex flex-col items-center text-center px-8 w-full">
        <motion.div
          className="overflow-hidden mb-6"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: phase >= 1 ? "0%" : "100%" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-[2.5vw] font-display font-medium text-white/80 tracking-widest uppercase">Introducing</h2>
          </motion.div>
        </motion.div>

        <motion.div
           className="relative"
        >
          <motion.h1 
            className="text-[10vw] font-display font-black text-white leading-none tracking-tighter"
            initial={{ opacity: 0, scale: 0.8, filter: "blur(20px)" }}
            animate={{ 
              opacity: phase >= 2 ? 1 : 0, 
              scale: phase >= 2 ? 1 : 0.8, 
              filter: phase >= 2 ? "blur(0px)" : "blur(20px)",
              y: phase >= 4 ? -20 : 0
            }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            CollabBuilder
          </motion.h1>
          
          {/* Accent line */}
          <motion.div 
            className="absolute -bottom-4 left-0 h-2 bg-white"
            initial={{ width: "0%" }}
            animate={{ width: phase >= 2 ? "100%" : "0%" }}
            transition={{ delay: 0.5, duration: 1, ease: "circOut" }}
          />
        </motion.div>

        <motion.p 
          className="text-[3vw] text-white/90 mt-12 font-medium"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: phase >= 3 ? 1 : 0, y: phase >= 3 ? 0 : 30 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          From <span className="font-bold text-white">Dialog</span> to <span className="font-bold text-white">Collaboration</span>.
        </motion.p>
      </div>

    </motion.div>
  );
}
