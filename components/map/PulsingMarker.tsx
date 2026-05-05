'use client';

import { motion } from 'framer-motion';

export default function PulsingMarker() {
  return (
    <div className="relative flex items-center justify-center" aria-hidden="true">
      {/* Outer slow pulse */}
      <motion.div
        className="absolute rounded-full bg-blue-400/20"
        initial={{ width: 12, height: 12, opacity: 0.8 }}
        animate={{ width: 56, height: 56, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
      />
      {/* Mid pulse */}
      <motion.div
        className="absolute rounded-full bg-blue-400/30"
        initial={{ width: 12, height: 12, opacity: 0.6 }}
        animate={{ width: 32, height: 32, opacity: 0 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
      />
      {/* Core dot */}
      <div className="relative z-10 h-3 w-3 rounded-full bg-blue-400 shadow-lg shadow-blue-500/60 ring-2 ring-white/70" />
    </div>
  );
}
