import React from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroIntroProps {
  framerUrl?: string;
  onEnter: () => void;
}

const DEFAULT_FRAMER_URL = 'https://smooth-symptoms-034746.framer.app';

export const HeroIntro: React.FC<HeroIntroProps> = ({
  framerUrl = DEFAULT_FRAMER_URL,
  onEnter,
}) => {
  return (
    <motion.section
      id="hero-intro"
      aria-label="Schermata introduttiva"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0A0A0A]"
    >
      {/*
        Centered symmetrically at 100vw x (100vh + 140px) inside the overflow-hidden
        flexbox viewport so the Framer template remains dead-center while its internal
        scrolling and original animations run freely and the bottom-right
        "Made in Framer" badge stays clipped below the viewport edge.
      */}
      <iframe
        src={framerUrl}
        title="Esperienza introduttiva EvoPlan"
        className="pointer-events-auto block h-[calc(100vh+140px)] w-screen shrink-0 border-0 bg-[#0A0A0A]"
        allow="accelerometer; autoplay; fullscreen; gyroscope"
        loading="eager"
      />

      {/* Minimalist white CTA centered at the bottom */}
      <div className="pointer-events-auto absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
        <button
          type="button"
          onClick={onEnter}
          aria-label="Entra nel sito"
          className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-xs font-semibold tracking-[0.2em] text-[#0A0A0A] uppercase shadow-lg transition-all duration-200 hover:bg-neutral-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A] whitespace-nowrap shrink-0"
        >
          <span>ENTRA</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </button>
      </div>
    </motion.section>
  );
};
