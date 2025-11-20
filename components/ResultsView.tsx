import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Question, UserAnswers, QuizMode } from '../types';
import { Button } from './Button';
import { PASS_MARK_COUNT, PASS_MARK_PERCENTAGE } from '../constants';
import { CheckCircle2, XCircle, BookOpen, RotateCw, Award, AlertTriangle, Zap, Bookmark, Filter, SkipForward } from 'lucide-react';

interface ResultsViewProps {
  questions: Question[];
  userAnswers: UserAnswers;
  timeTaken: number;
  mode: QuizMode;
  bookmarks: number[]; // Indices of bookmarked questions
  onRetry: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  questions,
  userAnswers,
  timeTaken,
  mode,
  bookmarks,
  onRetry
}) => {
  const [activeTab, setActiveTab] = useState<'incorrect' | 'skipped' | 'bookmarked' | 'all'>('incorrect');

  // Calculate Stats
  let correctCount = 0;
  const incorrectQuestions: Question[] = [];
  const skippedQuestions: Question[] = [];
  
  // For streak mode, we only care about questions answered so far
  const questionsAnsweredCount = Object.keys(userAnswers).length;
  
  const effectiveQuestions = mode === QuizMode.STREAK 
      ? questions.slice(0, questionsAnsweredCount) 
      : questions;

  effectiveQuestions.forEach((q) => {
    const ans = userAnswers[q.id - 1];
    if (ans === q.correctIndex) {
      correctCount++;
    } else if (ans === undefined) {
      skippedQuestions.push(q);
    } else {
      incorrectQuestions.push(q);
    }
  });

  const scorePercentage = Math.round((correctCount / effectiveQuestions.length) * 100) || 0;
  const hasPassed = mode === QuizMode.STREAK ? correctCount > 10 : correctCount >= PASS_MARK_COUNT; 

  // Switch tabs intelligently based on results
  useEffect(() => {
     if (incorrectQuestions.length === 0) {
        if (skippedQuestions.length > 0) {
            setActiveTab('skipped');
        } else if (bookmarks.length > 0) {
            setActiveTab('bookmarked');
        } else {
            setActiveTab('all');
        }
     }
  }, []);

  // Filter questions for the review list
  let displayedQuestions: Question[] = [];
  if (activeTab === 'incorrect') {
    displayedQuestions = incorrectQuestions;
  } else if (activeTab === 'skipped') {
    displayedQuestions = skippedQuestions;
  } else if (activeTab === 'bookmarked') {
    displayedQuestions = effectiveQuestions.filter((_, index) => bookmarks.includes(index));
  } else {
    displayedQuestions = effectiveQuestions;
  }

  const chartData = [
    { name: 'Correct', value: correctCount },
    { name: 'Incorrect', value: incorrectQuestions.length },
    { name: 'Skipped', value: skippedQuestions.length }
  ].filter(d => d.value > 0);

  const COLORS = {
    Correct: '#10b981',
    Incorrect: '#ef4444',
    Skipped: '#94a3b8'
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Card */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
          <div className={`p-8 text-center ${hasPassed ? 'bg-gradient-to-b from-emerald-50 to-white' : 'bg-gradient-to-b from-red-50 to-white'}`}>
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-white shadow-md mb-4">
               {mode === QuizMode.STREAK ? (
                 <Zap className="w-12 h-12 text-orange-500" />
               ) : hasPassed ? (
                 <Award className="w-12 h-12 text-emerald-600" />
               ) : (
                 <AlertTriangle className="w-12 h-12 text-red-600" />
               )}
            </div>
            
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {mode === QuizMode.STREAK ? 'Streak Ended' : (hasPassed ? 'Test Passed!' : 'Test Failed')}
            </h1>
            
            <p className="text-slate-600 mb-6">
              {mode === QuizMode.STREAK 
                ? `You successfully answered ${correctCount} questions in a row.`
                : `You scored ${correctCount} out of ${effectiveQuestions.length} (${scorePercentage}%)`
              }
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-4 text-sm text-slate-600">
               {mode === QuizMode.TIMED && (
                 <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <span className="font-semibold text-slate-900">Time:</span> {formatTime(timeTaken)}
                 </div>
               )}
               {mode !== QuizMode.STREAK && (
                 <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <span className="font-semibold text-slate-900">Pass Mark:</span> {PASS_MARK_PERCENTAGE}%
                 </div>
               )}
               {skippedQuestions.length > 0 && (
                  <div className="px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm flex items-center gap-2">
                     <SkipForward className="w-4 h-4 text-slate-400" />
                     <span className="font-semibold text-slate-900">Skipped:</span> {skippedQuestions.length}
                  </div>
               )}
            </div>
          </div>

          <div className="p-8 border-t border-slate-100 grid md:grid-cols-2 gap-8 items-center">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Performance Summary</h3>
              <p className="text-slate-600 leading-relaxed">
                {mode === QuizMode.STREAK 
                  ? "Great effort! Survival mode is tough. Try again to beat your longest streak."
                  : hasPassed 
                    ? "Excellent work! You have demonstrated a solid understanding of Life in the UK. Review any incorrect or skipped answers below." 
                    : "Don't worry. The Life in the UK test is challenging. Focus on the recommended chapters below to improve your score."
                }
              </p>
              <Button onClick={onRetry} variant="secondary" className="w-full md:w-auto">
                <RotateCw className="w-4 h-4 mr-2" /> Take New Test
              </Button>
            </div>
          </div>
        </div>

        {/* Review Section */}
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BookOpen className="w-6 h-6 text-indigo-600" />
                <h2 className="text-2xl font-bold text-slate-900">Review & Analysis</h2>
              </div>

              <div className="flex flex-wrap p-1 bg-slate-100 rounded-xl gap-1">
                 <button 
                   onClick={() => setActiveTab('incorrect')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'incorrect' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                    <XCircle className={`w-3.5 h-3.5 ${activeTab === 'incorrect' ? 'text-red-500' : ''}`} />
                    Incorrect ({incorrectQuestions.length})
                 </button>
                 <button 
                   onClick={() => setActiveTab('skipped')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'skipped' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                    <SkipForward className={`w-3.5 h-3.5 ${activeTab === 'skipped' ? 'text-slate-600' : ''}`} />
                    Skipped ({skippedQuestions.length})
                 </button>
                 <button 
                   onClick={() => setActiveTab('bookmarked')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'bookmarked' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                    <Bookmark className="w-3.5 h-3.5" />
                    Bookmarked ({bookmarks.length})
                 </button>
                 <button 
                   onClick={() => setActiveTab('all')}
                   className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                 >
                    All
                 </button>
              </div>
            </div>
            
            {displayedQuestions.length > 0 ? (
              <div className="grid gap-4">
                {displayedQuestions.map((q) => {
                  const userAnswerIndex = userAnswers[q.id - 1];
                  const isCorrect = userAnswerIndex === q.correctIndex;
                  const isSkipped = userAnswerIndex === undefined;
                  const arrayIndex = q.id - 1;
                  
                  return (
                    <div key={q.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                      <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0 mt-1">
                          {isCorrect ? (
                             <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                          ) : isSkipped ? (
                             <SkipForward className="w-6 h-6 text-slate-400" />
                          ) : (
                             <XCircle className="w-6 h-6 text-red-500" />
                          )}
                        </div>
                        <div className="flex-1 space-y-3">
                          <div className="flex justify-between items-start gap-4">
                             <h3 className="font-semibold text-slate-900 text-lg">{q.text}</h3>
                             {bookmarks.includes(arrayIndex) && (
                               <Bookmark className="w-5 h-5 text-amber-500 fill-current flex-shrink-0" />
                             )}
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                             <div className={`p-3 rounded-lg border ${
                                isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 
                                isSkipped ? 'bg-slate-50 border-slate-200 text-slate-600' : 
                                'bg-red-50 border-red-100 text-red-900'
                             }`}>
                                <span className={`font-bold block mb-1 text-xs uppercase tracking-wider ${
                                    isCorrect ? 'text-emerald-700' : 
                                    isSkipped ? 'text-slate-500' : 
                                    'text-red-700'
                                }`}>Your Answer</span>
                                {isSkipped ? "Skipped (No Answer)" : q.options[userAnswerIndex]}
                             </div>
                             {!isCorrect && (
                               <div className="p-3 rounded-lg bg-slate-50 text-slate-900 border border-slate-100">
                                  <span className="font-bold block mb-1 text-xs uppercase tracking-wider text-slate-500">Correct Answer</span>
                                  {q.options[q.correctIndex]}
                               </div>
                             )}
                          </div>

                          <div className="pt-2">
                            <p className="text-slate-700 mb-2 leading-relaxed"><span className="font-semibold">Explanation:</span> {q.explanation}</p>
                            <p className="text-indigo-600 text-sm font-medium flex items-center gap-2 bg-indigo-50 w-fit px-3 py-1 rounded-full">
                               <BookOpen className="w-3 h-3" />
                               Read: {q.chapterReference}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
               <div className="bg-slate-50 rounded-2xl p-12 text-center border-2 border-dashed border-slate-200">
                  <Filter className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">No Questions Found</h3>
                  <p className="text-slate-500">
                    {activeTab === 'incorrect' ? "You answered everything correctly in this section!" : 
                     activeTab === 'skipped' ? "You didn't skip any questions." :
                     activeTab === 'bookmarked' ? "You didn't bookmark any questions during the test." : 
                     "No questions to display."}
                  </p>
               </div>
            )}
        </div>

      </div>
    </div>
  );
};