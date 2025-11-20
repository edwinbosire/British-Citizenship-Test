import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full border border-slate-100">
        <div className="relative flex justify-center mb-6">
           <div className="absolute inset-0 bg-indigo-100 rounded-full blur-xl opacity-50 animate-pulse"></div>
           <Loader2 className="w-12 h-12 text-indigo-600 animate-spin relative z-10" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Generating Test Paper</h2>
        <p className="text-slate-500">
          Our AI is crafting a unique 25-question mock test based on the latest "Life in the UK" handbook. This may take a few moments.
        </p>
      </div>
    </div>
  );
};
