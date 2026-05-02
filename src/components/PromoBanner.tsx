import React from 'react';
import { motion } from 'motion/react';
import { Tag, Sparkles } from 'lucide-react';

const PromoBanner: React.FC = () => {
  const promoText = "WELCOME30: 30% OFF ON 1ST ORDER • REVISIT: 20% OFF ON 2ND ORDER • OFF25: 25% OFF ON 3RD ORDER • (OFFERS EXCLUDE 5K PLAN) • ";
  
  return (
    <div className="fixed bottom-0 left-0 right-0 w-full bg-black/80 border-t border-accent-blue/20 overflow-hidden py-3 backdrop-blur-xl z-[100]">
      <div className="flex whitespace-nowrap">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{
            repeat: Infinity,
            duration: 30,
            ease: "linear",
          }}
          className="flex items-center gap-4"
        >
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4">
              <Tag className="w-3 h-3 text-accent-blue" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-blue">
                {promoText}
              </span>
              <Sparkles className="w-3 h-3 text-accent-blue" />
            </div>
          ))}
        </motion.div>
        
        {/* Duplicate for seamless loop */}
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{
            repeat: Infinity,
            duration: 30,
            ease: "linear",
          }}
          className="flex items-center gap-4"
        >
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4">
              <Tag className="w-3 h-3 text-accent-blue" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-blue">
                {promoText}
              </span>
              <Sparkles className="w-3 h-3 text-accent-blue" />
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default PromoBanner;
