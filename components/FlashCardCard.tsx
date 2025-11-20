import React from 'react';
import { FlashCard } from '../types';
import { Layers } from 'lucide-react';

interface FlashCardCardProps {
  card: FlashCard;
  isFlipped: boolean;
  onFlip: () => void;
}

export const FlashCardCard: React.FC<FlashCardCardProps> = ({ card, isFlipped, onFlip }) => {
  return (
    <div 
      className="w-full max-w-md h-64 cursor-pointer perspective-1000"
      onClick={onFlip}
    >
      <div 
        className={`relative w-full h-full duration-500 transform-style-3d transition-all ${isFlipped ? 'rotate-y-180' : ''}`}
      >
        {/* Front */}
        <div className="absolute w-full h-full backface-hidden">
          <div className="w-full h-full bg-white rounded-2xl shadow-lg border border-slate-200 p-8 flex flex-col items-center justify-center text-center hover:border-indigo-200 transition-colors">
            <span className="text-xs font-semibold tracking-wider text-indigo-600 uppercase mb-4 bg-indigo-50 px-3 py-1 rounded-full">
              {card.topic}
            </span>
            <h3 className="text-xl md:text-2xl font-bold text-slate-900 leading-relaxed">
              {card.front}
            </h3>
            <p className="mt-6 text-sm text-slate-400 font-medium">Tap to flip</p>
          </div>
        </div>

        {/* Back */}
        <div className="absolute w-full h-full backface-hidden rotate-y-180">
          <div className="w-full h-full bg-slate-900 rounded-2xl shadow-xl p-8 flex flex-col items-center justify-center text-center text-white relative">
            <p className="text-lg md:text-xl font-medium leading-relaxed">
              {card.back}
            </p>
            
            {/* SRS Box Level Indicator */}
            <div className="absolute bottom-6 left-0 w-full flex justify-center pointer-events-none">
               <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-400 text-xs font-medium backdrop-blur-sm">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Box {card.box} / 6</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};