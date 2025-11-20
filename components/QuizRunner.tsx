import React, { useState, useCallback } from 'react';
import { Question, UserAnswers, QuizMode } from '../types';
import { Button } from './Button';
import { Timer } from './Timer';
import { MAX_TIME_SECONDS } from '../constants';
import { ChevronLeft, ChevronRight, CheckCircle2, XCircle, Zap, BookOpen, Bookmark, SkipForward, X, AlertCircle } from 'lucide-react';

interface QuizRunnerProps {
  questions: Question[];
  mode: QuizMode;
  onComplete: (answers: UserAnswers, timeTaken: number, bookmarks: number[]) => void;
  onQuit: () => void;
}

export const QuizRunner: React.FC<QuizRunnerProps> = ({ questions, mode, onComplete, onQuit }) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswers>({});
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState(MAX_TIME_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [showUnansweredConfirm, setShowUnansweredConfirm] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const isExamMode = mode === QuizMode.TIMED || mode === QuizMode.UNTIMED;
  const isPracticeOrStreak = mode === QuizMode.PRACTICE || mode === QuizMode.STREAK;
  
  const progressPercentage = isSubmitting 
    ? 100 
    : ((currentQuestionIndex + 1) / questions.length) * 100;
    
  const isAnswered = answers[currentQuestionIndex] !== undefined;
  const answeredCount = Object.keys(answers).length;

  const handleOptionSelect = (optionIndex: number) => {
    if (isSubmitting) return;
    
    // In Practice/Streak modes, prevent changing answer once selected
    if (isPracticeOrStreak && isAnswered) return;

    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: optionIndex
    }));

    // Special handling for Streak Mode - check instantly if game over
    if (mode === QuizMode.STREAK) {
      const isCorrect = optionIndex === currentQuestion.correctIndex;
      if (!isCorrect) {
        // Wrong answer in streak mode ends the game
        setIsSubmitting(true);
        setTimeout(() => {
          onComplete({
            ...answers,
            [currentQuestionIndex]: optionIndex
          }, 0, Array.from(bookmarks));
        }, 1500);
      }
    }
  };

  const toggleBookmark = () => {
    setBookmarks(prev => {
      const next = new Set(prev);
      if (next.has(currentQuestionIndex)) {
        next.delete(currentQuestionIndex);
      } else {
        next.add(currentQuestionIndex);
      }
      return next;
    });
  };

  const handleNext = () => {
    if (isSubmitting) return;
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (mode === QuizMode.PRACTICE || mode === QuizMode.STREAK) {
      // End of questions for practice/streak
      handleSubmit();
    }
  };

  const handleSkip = () => {
    if (isSubmitting) return;
    
    // 1. Clear answer for this question if user selected something then decided to skip
    setAnswers(prev => {
        const next = { ...prev };
        delete next[currentQuestionIndex];
        return next;
    });

    // 2. Flag for review (Bookmark) if not already bookmarked
    if (!bookmarks.has(currentQuestionIndex)) {
        setBookmarks(prev => new Set(prev).add(currentQuestionIndex));
    }

    // 3. Move to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (isSubmitting) return;
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinishClick = () => {
    if (isExamMode && answeredCount < questions.length) {
      setShowUnansweredConfirm(true);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = useCallback(() => {
    setShowUnansweredConfirm(false);
    const timeTaken = mode === QuizMode.TIMED ? MAX_TIME_SECONDS - secondsLeft : 0; // Track time only for timed
    setIsSubmitting(true);
    setTimeout(() => {
      onComplete(answers, timeTaken, Array.from(bookmarks));
    }, 800);
  }, [answers, secondsLeft, bookmarks, onComplete, mode]);

  const handleTimeUp = useCallback(() => {
    if (mode === QuizMode.TIMED) {
      onComplete(answers, MAX_TIME_SECONDS, Array.from(bookmarks));
    }
  }, [answers, bookmarks, onComplete, mode]);

  // Helper to determine option styling
  const getOptionStyle = (idx: number) => {
    const isSelected = answers[currentQuestionIndex] === idx;
    const isCorrect = idx === currentQuestion.correctIndex;
    
    // Base style
    let style = `relative group flex items-start p-4 rounded-xl text-left transition-all duration-300 border-2 `;
    
    if (isPracticeOrStreak && isAnswered) {
      if (isCorrect) {
         // Always show correct answer in Green
         style += 'border-emerald-500 bg-emerald-50 ';
      } else if (isSelected && !isCorrect) {
         // Show wrong selection in Red
         style += 'border-red-500 bg-red-50 ';
      } else {
         style += 'border-slate-100 opacity-50 ';
      }
    } else {
      // Exam Mode or Unanswered
      if (isSelected) {
        style += 'border-indigo-600 bg-indigo-50/50 shadow-md shadow-indigo-900/5 scale-[1.02] z-10 ';
      } else {
        style += 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50 bg-white hover:scale-[1.01] ';
      }
    }
    
    if (isSubmitting) style += 'cursor-default ';
    
    return style;
  };

  const isBookmarked = bookmarks.has(currentQuestionIndex);

  return (
    <div className="min-h-screen bg-slate-50 md:py-8 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shadow-sm ${mode === QuizMode.STREAK ? 'bg-orange-500 text-white' : 'bg-slate-900 text-white'}`}>
                {mode === QuizMode.STREAK ? <Zap className="w-4 h-4" /> : 'UK'}
             </div>
             <div className="hidden sm:flex flex-col">
               <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mode</span>
               <span className="text-sm font-bold text-slate-900 leading-none">
                 {mode === QuizMode.STREAK ? 'Streak' : mode === QuizMode.TIMED ? 'Timed Exam' : mode === QuizMode.UNTIMED ? 'Untimed' : 'Practice'}
               </span>
             </div>
          </div>
          
          {/* Center Status */}
          <div className="flex items-center gap-4">
            {mode === QuizMode.TIMED && (
              <Timer 
                secondsLeft={secondsLeft} 
                setSecondsLeft={setSecondsLeft} 
                onTimeUp={handleTimeUp} 
              />
            )}
            {isExamMode && (
               <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-sm font-medium text-slate-600">
                 <div className="w-2 h-2 rounded-full bg-indigo-500" />
                 <span>Answered: {answeredCount}/{questions.length}</span>
               </div>
            )}
            {mode === QuizMode.STREAK && (
              <div className="flex items-center gap-2 text-orange-600 font-bold px-3 py-1 bg-orange-50 rounded-full">
                 <Zap className="w-4 h-4 fill-current" />
                 <span>{Object.keys(answers).filter(k => answers[parseInt(k)] === questions[parseInt(k)].correctIndex).length}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isExamMode && (
              <Button 
                variant="primary" 
                className="!px-4 !py-2 text-sm hidden sm:flex"
                onClick={handleFinishClick}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Finish'}
              </Button>
            )}
            <button 
              onClick={() => setShowQuitConfirm(true)}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Quit Quiz"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="h-1 bg-slate-100 w-full">
          <div 
            className={`h-full transition-all duration-700 ease-out ${mode === QuizMode.STREAK ? 'bg-orange-500' : 'bg-indigo-600'}`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-6 md:py-10 flex flex-col">
        <div className="mb-6 flex justify-between items-end">
          <div className="text-slate-500 font-medium text-sm uppercase tracking-wide">
            Question {currentQuestionIndex + 1} of {questions.length}
          </div>
          <div className="md:hidden text-xs font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
             Answered: {answeredCount}/{questions.length}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
          <div className="p-6 md:p-8 border-b border-slate-100 flex gap-4 justify-between items-start">
            <div className="space-y-3">
               {currentQuestion.chapterReference && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{currentQuestion.chapterReference}</span>
                  </div>
               )}
               <h2 className="text-xl md:text-2xl font-semibold text-slate-900 leading-relaxed">
                 {currentQuestion.text}
               </h2>
            </div>
            <button 
              onClick={toggleBookmark}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isBookmarked ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400'}`}
              aria-label="Bookmark question"
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </div>

          <div className="p-6 md:p-8 grid gap-4">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = answers[currentQuestionIndex] === idx;
              const isCorrect = idx === currentQuestion.correctIndex;
              
              // Icon logic for practice mode
              let Icon = null;
              if (isPracticeOrStreak && isAnswered) {
                if (isCorrect) Icon = CheckCircle2;
                else if (isSelected) Icon = XCircle;
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(idx)}
                  disabled={isSubmitting || (isPracticeOrStreak && isAnswered)}
                  className={getOptionStyle(idx)}
                >
                  <div className={`
                    w-6 h-6 rounded-full border-2 mr-4 flex-shrink-0 flex items-center justify-center mt-0.5 transition-all duration-300
                    ${isSelected && !isPracticeOrStreak ? 'border-indigo-600 bg-indigo-600 scale-110' : ''}
                    ${!isSelected && !isPracticeOrStreak ? 'border-slate-300 group-hover:border-indigo-400' : ''}
                    ${isPracticeOrStreak && isAnswered && isCorrect ? 'border-emerald-500 bg-emerald-500 text-white' : ''}
                    ${isPracticeOrStreak && isAnswered && isSelected && !isCorrect ? 'border-red-500 bg-red-500 text-white' : ''}
                  `}>
                    {(!isPracticeOrStreak && isSelected) && <div className="w-2 h-2 bg-white rounded-full" />}
                    {Icon && <Icon className="w-4 h-4 text-white" />}
                  </div>
                  <span className={`font-medium transition-colors duration-300 
                    ${isSelected && !isPracticeOrStreak ? 'text-indigo-900' : 'text-slate-700'}
                    ${isPracticeOrStreak && isAnswered && isCorrect ? 'text-emerald-900' : ''}
                    ${isPracticeOrStreak && isAnswered && isSelected && !isCorrect ? 'text-red-900' : ''}
                  `}>
                    {option}
                  </span>
                </button>
              );
            })}
          </div>
          
          {/* Explanation Panel for Practice/Streak Mode */}
          {isPracticeOrStreak && isAnswered && (
            <div className={`px-8 pb-8 animate-in fade-in slide-in-from-top-2 duration-300`}>
               <div className={`p-4 rounded-xl ${answers[currentQuestionIndex] === currentQuestion.correctIndex ? 'bg-emerald-50 border border-emerald-100' : 'bg-red-50 border border-red-100'}`}>
                 <div className="flex gap-2 mb-2 font-bold text-sm uppercase tracking-wide">
                    <BookOpen className="w-4 h-4" /> Explanation
                 </div>
                 <p className="text-slate-700 mb-2">{currentQuestion.explanation}</p>
                 <p className="text-sm text-slate-500">Reference: {currentQuestion.chapterReference}</p>
                 
                 {mode === QuizMode.STREAK && answers[currentQuestionIndex] !== currentQuestion.correctIndex && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-red-200 text-red-600 font-bold flex items-center justify-center gap-2">
                      <XCircle className="w-5 h-5" /> Streak Broken! Redirecting...
                    </div>
                 )}
               </div>
            </div>
          )}
        </div>

        {/* Navigation Footer */}
        <div className="mt-8 grid grid-cols-3 items-center">
          {/* Left: Previous */}
          <div className="justify-self-start">
             {!isPracticeOrStreak ? (
               <Button 
                 variant="outline" 
                 onClick={handlePrev} 
                 disabled={currentQuestionIndex === 0 || isSubmitting}
                 className="!px-5"
               >
                 <ChevronLeft className="w-5 h-5 mr-1" /> Previous
               </Button>
            ) : (
               <div />
            )}
          </div>

          {/* Center: Skip */}
          <div className="justify-self-center">
            {isExamMode && currentQuestionIndex < questions.length - 1 && (
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={isSubmitting}
                className="text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              >
                Skip <SkipForward className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
          
          {/* Right: Next/Finish */}
          <div className="justify-self-end">
            {(currentQuestionIndex < questions.length - 1) ? (
              <Button 
                variant={isPracticeOrStreak ? 'primary' : 'secondary'} 
                onClick={handleNext}
                disabled={isSubmitting || (isPracticeOrStreak && !isAnswered)}
                className="!px-5"
              >
                Next <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            ) : (
              <Button 
                 variant="primary"
                 onClick={handleFinishClick}
                 disabled={isSubmitting || (isPracticeOrStreak && !isAnswered)}
                 className="!px-6"
              >
                {isSubmitting ? 'Finishing...' : 'Finish Test'} <CheckCircle2 className={`w-5 h-5 ml-2 ${isSubmitting ? 'animate-pulse' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Quit Confirmation Modal */}
      {showQuitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all animate-in zoom-in-95 duration-200">
              <h3 className="text-lg font-bold text-slate-900 mb-2">Quit Quiz?</h3>
              <p className="text-slate-600 mb-6">Your progress will be lost and this attempt won't be saved. Are you sure?</p>
              <div className="flex gap-3">
                 <Button variant="outline" fullWidth onClick={() => setShowQuitConfirm(false)}>Cancel</Button>
                 <Button variant="primary" fullWidth className="!bg-red-600 hover:!bg-red-700 focus:ring-red-600" onClick={onQuit}>Quit</Button>
              </div>
           </div>
        </div>
      )}

      {/* Unanswered Confirmation Modal */}
      {showUnansweredConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transform transition-all animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-4 mx-auto">
                <AlertCircle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2 text-center">Unanswered Questions</h3>
              <p className="text-slate-600 mb-6 text-center">
                You have <strong>{questions.length - answeredCount}</strong> unanswered questions. 
                These will be marked as incorrect if you submit now.
              </p>
              <div className="flex gap-3">
                 <Button variant="outline" fullWidth onClick={() => setShowUnansweredConfirm(false)}>Review</Button>
                 <Button variant="primary" fullWidth onClick={handleSubmit}>Submit Anyway</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};