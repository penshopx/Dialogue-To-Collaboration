import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const dashboardImg = `${import.meta.env.BASE_URL}illustrations/dashboard-analytics.png`;

export function Scene4Dashboard() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 5000),
      setTimeout(() => setPhase(4), 8500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-center bg-bg-muted z-10"
      initial={{ opacity: 0, y: "100%" }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.2, filter: "blur(20px)" }}
      transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="w-full max-w-[85vw] mx-auto relative h-[80vh] flex flex-col justify-center">
        
        <motion.div 
          className="text-center mb-8"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : -30 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-[4vw] font-display font-bold text-white">Full Pipeline Visibility</h2>
        </motion.div>

        <motion.div 
          className="relative w-full h-[60vh] rounded-2xl overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
          animate={{ 
            opacity: phase >= 1 ? 1 : 0, 
            scale: phase >= 1 ? 1 : 0.9,
            rotateX: phase >= 1 ? 0 : 20,
            y: phase >= 3 ? -20 : 0 
          }}
          style={{ perspective: 1000 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.img 
            src={dashboardImg} 
            className="w-full h-full object-cover origin-top"
            animate={{
              scale: phase >= 2 ? 1.1 : 1,
              y: phase >= 2 ? "-5%" : "0%"
            }}
            transition={{ duration: 6, ease: "easeOut" }}
          />
          
          <div className="absolute inset-0 bg-gradient-to-t from-bg-muted via-transparent to-transparent opacity-80" />
        </motion.div>

        {/* Hovering stat cards */}
        <motion.div 
          className="absolute bottom-12 left-12 p-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-xl"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: phase >= 3 ? 1 : 0, x: phase >= 3 ? 0 : -50 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          <p className="text-[1vw] text-text-secondary uppercase tracking-wider mb-1">Time to Delivery</p>
          <p className="text-[3vw] font-bold text-success">-40%</p>
        </motion.div>

        <motion.div 
          className="absolute bottom-24 right-12 p-6 rounded-xl bg-white/10 border border-white/20 backdrop-blur-xl"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: phase >= 3 ? 1 : 0, x: phase >= 3 ? 0 : 50 }}
          transition={{ duration: 0.8, type: "spring", delay: 0.2 }}
        >
          <p className="text-[1vw] text-text-secondary uppercase tracking-wider mb-1">Gate Approvals</p>
          <p className="text-[3vw] font-bold text-accent-light">100% Tracked</p>
        </motion.div>

      </div>
    </motion.div>
  );
}
