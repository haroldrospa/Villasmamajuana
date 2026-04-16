import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import logo from '@/assets/logo-villa.png';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    // Phase 1: Enter animations play (1.5s)
    const holdTimer = setTimeout(() => setPhase('hold'), 1500);
    // Phase 2: Hold visible (until 3.5s)
    const exitTimer = setTimeout(() => setPhase('exit'), 3500);
    // Phase 3: Exit fade out (0.8s), then complete
    const completeTimer = setTimeout(() => onComplete(), 4300);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
      style={{ backgroundColor: 'hsl(39, 33%, 94%)' }}
      animate={phase === 'exit' ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
    >
      {/* Mountain silhouettes */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ height: '40%' }}
      >
        <motion.path
          d="M0,320 L0,200 Q180,80 360,180 Q540,60 720,160 Q900,40 1080,140 Q1260,60 1440,180 L1440,320 Z"
          fill="hsl(153, 43%, 21%, 0.08)"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.2, ease: 'easeOut' }}
        />
        <motion.path
          d="M0,320 L0,240 Q200,140 400,220 Q600,120 800,200 Q1000,100 1200,190 Q1350,130 1440,220 L1440,320 Z"
          fill="hsl(153, 43%, 21%, 0.05)"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.8, delay: 0.5, ease: 'easeOut' }}
        />
      </svg>

      {/* Floating leaves */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          style={{
            left: `${15 + i * 18}%`,
            top: `${20 + (i % 3) * 20}%`,
            color: 'hsl(153, 43%, 21%, 0.12)',
          }}
          initial={{ opacity: 0, y: 30, rotate: -20 }}
          animate={{ opacity: 1, y: [-10, 10, -10], rotate: [10, -5, 10] }}
          transition={{
            opacity: { duration: 1, delay: 0.8 + i * 0.2 },
            y: { duration: 4, delay: 0.8 + i * 0.2, repeat: Infinity, ease: 'easeInOut' },
            rotate: { duration: 5, delay: 0.8 + i * 0.2, repeat: Infinity, ease: 'easeInOut' },
          }}
        >
          🍃
        </motion.div>
      ))}

      {/* Logo + Text */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.7, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.img
          src={logo}
          alt="Villas Mamajuana"
          className="w-44 h-44 md:w-56 md:h-56 object-contain drop-shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        />

        {/* Gold line */}
        <motion.div
          className="h-0.5 rounded-full mt-6"
          style={{ backgroundColor: 'hsl(37, 42%, 61%)' }}
          initial={{ width: 0 }}
          animate={{ width: 80 }}
          transition={{ duration: 0.8, delay: 1.2, ease: 'easeOut' }}
        />

        {/* Tagline */}
        <motion.p
          className="text-sm tracking-[0.2em] mt-5 font-light"
          style={{ color: 'hsl(153, 20%, 35%)', fontFamily: 'var(--font-body)' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.5 }}
        >
          Un paraíso natural entre montañas
        </motion.p>
      </motion.div>

      {/* Loading dots */}
      <motion.div
        className="absolute bottom-16 flex gap-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 0.5 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: 'hsl(37, 42%, 61%)' }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.3, 0.8] }}
            transition={{
              duration: 1.2,
              delay: 2 + i * 0.25,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
    </motion.div>
  );
};

export default SplashScreen;
