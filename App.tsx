import React, { useState } from 'react';
import { QuizState, Question, UserAnswers, QuizMode } from './types';
import { generateQuizQuestions } from './services/geminiService';
import { LoadingScreen } from './components/LoadingScreen';
import { QuizRunner } from './components/QuizRunner';
import { ResultsView } from './components/ResultsView';
import { FlashCardManager } from './components/FlashCardManager';
import { Button } from './components/Button';
import { BookOpen, CheckCircle2, Layout, Library, GraduationCap, Clock, Zap, BrainCircuit, X } from 'lucide-react';

type AppView = 'HOME' | 'QUIZ' | 'FLASHCARDS';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('HOME');
  const [showModeSelect, setShowModeSelect] = useState(false);

  // Quiz State
  const [quizState, setQuizState] = useState<QuizState>(QuizState.IDLE);
  const [selectedMode, setSelectedMode] = useState<QuizMode>(QuizMode.TIMED);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [timeTaken, setTimeTaken] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const startQuiz = async (mode: QuizMode) => {
    setSelectedMode(mode);
    setShowModeSelect(false);
    setCurrentView('QUIZ');
    setQuizState(QuizState.LOADING);
    setError(null);
    setBookmarks([]);
    
    try {
      // Generate more questions for streak mode to allow longer play
      const count = mode === QuizMode.STREAK ? 40 : 25;
      const generatedQuestions = await generateQuizQuestions(count);
      setQuestions(generatedQuestions);
      setQuizState(QuizState.IN_PROGRESS);
    } catch (err) {
      setError("Failed to generate quiz. Please check your connection or try again.");
      setQuizState(QuizState.ERROR);
    }
  };

  const handleQuizComplete = (answers: UserAnswers, time: number, finalBookmarks: number[]) => {
    setUserAnswers(answers);
    setTimeTaken(time);
    setBookmarks(finalBookmarks);
    setQuizState(QuizState.COMPLETED);
  };

  const handleRetryQuiz = () => {
    setQuizState(QuizState.IDLE);
    setQuestions([]);
    setUserAnswers({});
    setBookmarks([]);
    setTimeTaken(0);
    // Restart with same mode
    startQuiz(selectedMode);
  };
  
  const handleBackToHome = () => {
    setCurrentView('HOME');
    setQuizState(QuizState.IDLE);
    setShowModeSelect(false);
    setError(null);
  };

  // --- RENDER LOGIC ---

  if (currentView === 'FLASHCARDS') {
    return <FlashCardManager onBack={handleBackToHome} />;
  }

  if (currentView === 'QUIZ') {
    if (quizState === QuizState.LOADING) {
      return <LoadingScreen />;
    }

    if (quizState === QuizState.IN_PROGRESS) {
      return (
        <QuizRunner 
          questions={questions} 
          mode={selectedMode}
          onComplete={handleQuizComplete} 
          onQuit={handleBackToHome}
        />
      );
    }

    if (quizState === QuizState.COMPLETED) {
      return (
        <div className="relative">
          <div className="absolute top-4 left-4 z-50">
            <Button variant="outline" onClick={handleBackToHome} className="!px-3 !py-2 text-sm">
              Home
            </Button>
          </div>
          <ResultsView 
            questions={questions} 
            userAnswers={userAnswers} 
            timeTaken={timeTaken} 
            mode={selectedMode}
            bookmarks={bookmarks}
            onRetry={handleRetryQuiz}
          />
        </div>
      );
    }
    
    if (quizState === QuizState.ERROR) {
       return (
         <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md w-full">
               <div className="text-red-500 font-bold text-xl mb-2">Error</div>
               <p className="text-slate-600 mb-6">{error}</p>
               <Button onClick={handleBackToHome}>Return Home</Button>
            </div>
         </div>
       );
    }
  }

  // HOME VIEW
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 relative overflow-hidden bg-slate-50">
        
        {/* Abstract Shapes */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-100/50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 z-0 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 z-0 pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-24">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
              <Layout className="w-4 h-4" />
              <span>Official 2025 Curriculum</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Life in the UK <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                Preparation Hub
              </span>
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed">
              Your complete AI-powered study companion. Take realistic timed mock exams or master facts with smart flashcards.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Mock Test Card */}
            <div className="group relative bg-white rounded-3xl shadow-xl border border-slate-200 p-8 hover:-translate-y-1 transition-all duration-300 cursor-default overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <GraduationCap className="w-32 h-32 text-indigo-600" />
               </div>
               <div className="relative z-10">
                 <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-6 h-6" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">Take a Quiz</h2>
                 <p className="text-slate-600 mb-8 h-12">
                   Choose from Timed, Practice, or Survival modes. Test your knowledge.
                 </p>
                 <Button onClick={() => setShowModeSelect(true)} fullWidth className="text-lg py-4 shadow-lg shadow-indigo-100">
                   Start Quiz
                 </Button>
               </div>
            </div>

            {/* Flash Cards Card */}
            <div className="group relative bg-white rounded-3xl shadow-xl border border-slate-200 p-8 hover:-translate-y-1 transition-all duration-300 cursor-default overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Library className="w-32 h-32 text-emerald-600" />
               </div>
               <div className="relative z-10">
                 <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6">
                    <BookOpen className="w-6 h-6" />
                 </div>
                 <h2 className="text-2xl font-bold text-slate-900 mb-2">Flash Cards</h2>
                 <p className="text-slate-600 mb-8 h-12">
                   Spaced repetition system to memorize dates, history, and facts efficiently.
                 </p>
                 <Button onClick={() => setCurrentView('FLASHCARDS')} fullWidth variant="secondary" className="!bg-emerald-600 hover:!bg-emerald-700 text-lg py-4 shadow-lg shadow-emerald-100">
                   Open Flash Cards
                 </Button>
               </div>
            </div>
          </div>

        </div>
      </div>

      {/* Mode Selection Modal */}
      {showModeSelect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-8 transform transition-all animate-in fade-in zoom-in duration-200 relative overflow-hidden">
              <button 
                onClick={() => setShowModeSelect(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Select Quiz Mode</h2>
              <p className="text-slate-600 mb-8">Choose how you want to practice today.</p>

              <div className="grid md:grid-cols-2 gap-4">
                 {/* TIMED MODE */}
                 <button 
                    onClick={() => startQuiz(QuizMode.TIMED)}
                    className="flex flex-col items-start p-5 rounded-xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
                 >
                    <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                       <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Timed Exam</h3>
                    <p className="text-sm text-slate-500 text-left">Real exam conditions. 45 minutes, 25 questions. No feedback until the end.</p>
                 </button>

                 {/* PRACTICE MODE */}
                 <button 
                    onClick={() => startQuiz(QuizMode.PRACTICE)}
                    className="flex flex-col items-start p-5 rounded-xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                 >
                    <div className="p-3 bg-emerald-100 rounded-lg text-emerald-600 mb-4 group-hover:scale-110 transition-transform">
                       <BrainCircuit className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Practice Mode</h3>
                    <p className="text-sm text-slate-500 text-left">Learn as you go. Immediate feedback and explanations for every question.</p>
                 </button>

                 {/* UNTIMED MODE */}
                 <button 
                    onClick={() => startQuiz(QuizMode.UNTIMED)}
                    className="flex flex-col items-start p-5 rounded-xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all group"
                 >
                    <div className="p-3 bg-blue-100 rounded-lg text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                       <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Untimed</h3>
                    <p className="text-sm text-slate-500 text-left">Stress-free. Take your time to think through 25 questions.</p>
                 </button>

                 {/* STREAK MODE */}
                 <button 
                    onClick={() => startQuiz(QuizMode.STREAK)}
                    className="flex flex-col items-start p-5 rounded-xl border-2 border-slate-100 hover:border-orange-500 hover:bg-orange-50 transition-all group"
                 >
                    <div className="p-3 bg-orange-100 rounded-lg text-orange-600 mb-4 group-hover:scale-110 transition-transform">
                       <Zap className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg mb-1">Survival Streak</h3>
                    <p className="text-sm text-slate-500 text-left">How far can you go? The quiz ends as soon as you get one wrong answer.</p>
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;