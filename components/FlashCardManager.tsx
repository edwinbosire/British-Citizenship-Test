import React, { useState, useEffect } from 'react';
import { FlashCard, FlashCardDeckStats } from '../types';
import { generateFlashCards } from '../services/geminiService';
import { Button } from './Button';
import { FlashCardCard } from './FlashCardCard';
import { Play, Sparkles, ChevronLeft, Check, X } from 'lucide-react';
import { LoadingScreen } from './LoadingScreen';

interface FlashCardManagerProps {
  onBack: () => void;
}

export const FlashCardManager: React.FC<FlashCardManagerProps> = ({ onBack }) => {
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [isReviewing, setIsReviewing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [topicInput, setTopicInput] = useState('');
  
  // Review Session State
  const [reviewQueue, setReviewQueue] = useState<FlashCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Load from local storage
  useEffect(() => {
    const savedCards = localStorage.getItem('uk_life_flashcards');
    if (savedCards) {
      setCards(JSON.parse(savedCards));
    } else {
      // Initial seed data if empty
      const seed: FlashCard[] = [
        { id: '1', front: 'What constitutes the UK?', back: 'England, Scotland, Wales, and Northern Ireland.', box: 0, nextReview: Date.now(), createdAt: Date.now(), topic: 'Geography' },
        { id: '2', front: 'Who built the Tower of London?', back: 'William the Conqueror', box: 0, nextReview: Date.now(), createdAt: Date.now(), topic: 'History' }
      ];
      setCards(seed);
      localStorage.setItem('uk_life_flashcards', JSON.stringify(seed));
    }
  }, []);

  const saveCards = (newCards: FlashCard[]) => {
    setCards(newCards);
    localStorage.setItem('uk_life_flashcards', JSON.stringify(newCards));
  };

  const stats: FlashCardDeckStats = {
    totalCards: cards.length,
    dueCards: cards.filter(c => c.nextReview <= Date.now()).length,
    masteredCards: cards.filter(c => c.box >= 4).length
  };

  const handleGenerate = async () => {
    if (!topicInput.trim()) return;
    setIsGenerating(true);
    try {
      const newCardsData = await generateFlashCards(topicInput);
      const newCards: FlashCard[] = newCardsData.map(c => ({
        ...c,
        id: Math.random().toString(36).substr(2, 9),
        box: 0, // Start in Box 0 (New)
        nextReview: Date.now(), // Due immediately
        createdAt: Date.now()
      }));
      
      saveCards([...cards, ...newCards]);
      setTopicInput('');
      setShowGenerateModal(false);
    } catch (e) {
      console.error(e);
      alert('Failed to generate cards. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const startReview = () => {
    const due = cards.filter(c => c.nextReview <= Date.now()).sort((a, b) => a.nextReview - b.nextReview);
    setReviewQueue(due);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIsReviewing(true);
  };

  const handleReviewResult = (success: boolean) => {
    const currentCard = reviewQueue[currentCardIndex];
    let newBox = currentCard.box;
    let nextReview = Date.now();

    // Granular Spaced Repetition Intervals (in days)
    // Box 0: Lapsed / New (Review tomorrow)
    // Box 1: 1 day 
    // Box 2: 3 days
    // Box 3: 1 week (7 days)
    // Box 4: 2 weeks (14 days)
    // Box 5: 1 month (30 days)
    // Box 6: 3 months (90 days)
    const intervals = [1, 3, 7, 14, 30, 90];

    if (success) {
      // Promotion Logic
      // If card is in Box 0 (Lapsed/New), it moves to Box 1
      // Otherwise it increments. Capped at the last interval.
      newBox = Math.min(currentCard.box + 1, intervals.length);
      
      // Calculate next review date
      // Array is 0-indexed, so Box 1 maps to index 0
      const daysToAdd = intervals[newBox - 1] || 1;
      nextReview = Date.now() + (daysToAdd * 24 * 60 * 60 * 1000);
    } else {
      // Failure Logic (Lapsed State)
      // Reset to Box 0 regardless of current level.
      // This treats the card as "Lapsed" and ensures frequent review.
      newBox = 0;
      
      // Schedule for tomorrow (1 day)
      // Ideally this would be sooner (e.g. 10 mins), but for a daily app, 1 day is standard.
      nextReview = Date.now() + (24 * 60 * 60 * 1000);
    }

    const updatedCards = cards.map(c => 
      c.id === currentCard.id 
        ? { ...c, box: newBox, nextReview: nextReview }
        : c
    );
    
    saveCards(updatedCards);

    if (currentCardIndex < reviewQueue.length - 1) {
      setIsFlipped(false);
      setCurrentCardIndex(prev => prev + 1);
    } else {
      setIsReviewing(false); // End session
    }
  };

  if (isGenerating) {
    return <LoadingScreen />;
  }

  // --- Review View ---
  if (isReviewing && reviewQueue.length > 0) {
    const currentCard = reviewQueue[currentCardIndex];
    const progress = ((currentCardIndex) / reviewQueue.length) * 100;

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="h-1 w-full bg-slate-200">
          <div className="h-full bg-indigo-600 transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
        
        <div className="max-w-4xl mx-auto w-full px-4 py-6 flex justify-between items-center">
          <Button variant="ghost" onClick={() => setIsReviewing(false)} className="!px-2">
            <ChevronLeft className="w-5 h-5 mr-1" /> Quit
          </Button>
          <div className="text-slate-500 font-mono text-sm">
            {currentCardIndex + 1} / {reviewQueue.length}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-8">
          <FlashCardCard 
            card={currentCard} 
            isFlipped={isFlipped} 
            onFlip={() => setIsFlipped(!isFlipped)} 
          />

          <div className={`flex items-center gap-4 transition-all duration-300 ${isFlipped ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
            <Button 
              variant="outline" 
              className="!border-red-200 !text-red-600 hover:!bg-red-50 w-32 flex flex-col items-center py-3 h-auto gap-1"
              onClick={() => handleReviewResult(false)}
            >
              <div className="flex items-center"><X className="w-4 h-4 mr-1" /> Again</div>
              <span className="text-xs font-normal opacity-75">1 day</span>
            </Button>
            <Button 
              variant="primary" 
              className="!bg-emerald-600 hover:!bg-emerald-700 w-32 shadow-emerald-900/20 flex flex-col items-center py-3 h-auto gap-1"
              onClick={() => handleReviewResult(true)}
            >
              <div className="flex items-center"><Check className="w-4 h-4 mr-1" /> Good</div>
              <span className="text-xs font-normal opacity-75">
                {(() => {
                   const intervals = [1, 3, 7, 14, 30, 90];
                   const nextBox = Math.min(currentCard.box + 1, intervals.length);
                   const days = intervals[nextBox - 1] || 1;
                   return `${days} day${days > 1 ? 's' : ''}`;
                })()}
              </span>
            </Button>
          </div>
          {!isFlipped && <p className="text-slate-400 text-sm animate-pulse">Tap card to reveal answer</p>}
        </div>
      </div>
    );
  }

  // --- Dashboard View ---
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Button variant="ghost" onClick={onBack} className="mb-6 -ml-2">
          <ChevronLeft className="w-5 h-5 mr-2" /> Back to Home
        </Button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Flash Cards</h1>
            <p className="text-slate-600">Master facts with AI-powered spaced repetition.</p>
          </div>
          <Button onClick={() => setShowGenerateModal(true)} variant="secondary">
            <Sparkles className="w-4 h-4 mr-2" /> Generate New Cards
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wide">Due Today</div>
            <div className="text-4xl font-bold text-indigo-600">{stats.dueCards}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <div className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wide">Total Cards</div>
             <div className="text-4xl font-bold text-slate-900">{stats.totalCards}</div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
             <div className="text-slate-500 text-sm font-medium mb-1 uppercase tracking-wide">Mastered</div>
             <div className="text-4xl font-bold text-emerald-600">{stats.masteredCards}</div>
          </div>
        </div>

        <div className="bg-indigo-900 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 max-w-lg mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">Time to Study?</h2>
            <p className="text-indigo-200 mb-8 text-lg">
              {stats.dueCards > 0 
                ? `You have ${stats.dueCards} cards ready for review based on your spaced repetition schedule.` 
                : "You're all caught up! Generate more cards to keep learning."}
            </p>
            <Button 
              variant="primary" 
              className="!bg-white !text-indigo-900 hover:!bg-indigo-50 !py-4 !px-8 text-lg shadow-xl"
              onClick={startReview}
              disabled={stats.dueCards === 0}
            >
              {stats.dueCards > 0 ? <><Play className="w-5 h-5 mr-2 fill-current" /> Start Session</> : <><Check className="w-5 h-5 mr-2" /> All Done</>}
            </Button>
          </div>
        </div>
      </div>

      {/* Generate Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-900">Generate with AI</h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Topic</label>
                <input 
                  type="text" 
                  placeholder="e.g. The Tudors, Famous Landmarks, British Values"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  value={topicInput}
                  onChange={(e) => setTopicInput(e.target.value)}
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2">
                  Our AI will generate 5 highly relevant cards for this topic.
                </p>
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button variant="outline" fullWidth onClick={() => setShowGenerateModal(false)}>Cancel</Button>
                <Button variant="primary" fullWidth onClick={handleGenerate} disabled={!topicInput.trim()}>
                  <Sparkles className="w-4 h-4 mr-2" /> Generate
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};