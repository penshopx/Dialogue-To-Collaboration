import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const beforeAfterImg = `${import.meta.env.BASE_URL}illustrations/before-after-chaos.png`;

export function Scene1Hook() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2500),
      setTimeout(() => setPhase(3), 4500),
      setTimeout(() => setPhase(4), 6500)
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-bg-dark z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(20px)' }}
      transition={{ duration: 0.8 }}
    >
      {/* Background elements */}
      <motion.div className="absolute inset-0 overflow-hidden opacity-20">
         <motion.img 
            src={beforeAfterImg} 
            className="w-full h-full object-cover filter blur-sm grayscale brightness-50"
            animate={{ scale: [1.1, 1.2], rotate: [0, 2] }}
            transition={{ duration: 8, ease: "linear" }}
         />
      </motion.div>

      <div className="relative z-20 flex flex-col items-center justify-center w-full max-w-5xl px-8">
        
        <motion.div
          className="flex flex-col gap-6 items-center text-center"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: phase >= 1 ? 0 : 50, opacity: phase >= 1 ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <motion.h1 
            className="text-[6vw] leading-[1.1] font-display font-bold tracking-tight"
            animate={{ y: phase >= 3 ? -30 : 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            Collaboration is <span className="text-error italic">chaotic.</span>
          </motion.h1>

          <motion.div 
            className="flex gap-4 flex-wrap justify-center mt-8"
          >
            {['Fragmented messages', 'Lost files', 'Unclear ownership', 'Endless meetings'].map((text, i) => (
              <motion.div
                key={i}
                className="px-6 py-3 bg-white/5 border border-white/10 rounded-full text-[1.5vw] font-medium backdrop-blur-md"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ 
                  opacity: phase >= 2 ? 1 : 0, 
                  scale: phase >= 2 ? 1 : 0.8, 
                  y: phase >= 3 ? -30 : (phase >= 2 ? 0 : 20)
                }}
                transition={{ 
                  delay: phase >= 2 ? i * 0.15 : 0, 
                  type: "spring", stiffness: 300, damping: 20 
                }}
              >
                {text}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div 
          className="absolute inset-0 flex items-center justify-center bg-bg-dark/80 backdrop-blur-xl"
          initial={{ clipPath: "circle(0% at 50% 50%)" }}
          animate={{ clipPath: phase >= 3 ? "circle(150% at 50% 50%)" : "circle(0% at 50% 50%)" }}
          transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1] }}
        >
            <motion.h2 
              className="text-[5vw] font-display font-bold text-white text-center"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: phase >= 3 ? 0 : 30, opacity: phase >= 3 ? 1 : 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              It's time to bring order to the chaos.
            </motion.h2>
        </motion.div>

      </div>
    </motion.div>
  );
}
