
import React, { useState } from 'react';
import SetupForm from './components/SetupForm';
import QuizView from './components/QuizView';
import ReportCard from './components/ReportCard';
import BunnyLoader from './components/BunnyLoader';
import { QuizStatus, QuizSettings, Question, UserAnswer } from './types';
import { generateQuiz } from './services/geminiService';

const App: React.FC = () => {
  const [status, setStatus] = useState<QuizStatus>(QuizStatus.IDLE);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startQuiz = async (settings: QuizSettings) => {
    setStatus(QuizStatus.LOADING);
    setError(null);
    try {
      const generatedQuestions = await generateQuiz(settings);
      setQuestions(generatedQuestions);
      setStatus(QuizStatus.ACTIVE);
    } catch (err) {
      console.error(err);
      setError("Unable to generate quiz. Check your internet and try again.");
      setStatus(QuizStatus.IDLE);
    }
  };

  const completeQuiz = (answers: UserAnswer[]) => {
    setUserAnswers(answers);
    setStatus(QuizStatus.COMPLETED);
  };

  const restart = () => {
    setQuestions([]);
    setUserAnswers([]);
    setError(null);
    setStatus(QuizStatus.IDLE);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 md:p-10">
      {/* Header Section */}
      <header className="mb-8 sm:mb-12 flex items-center gap-4 sm:gap-6">
        <img 
          src="https://i.ibb.co/7Nyn9DLx/Mascot-quizzer.png" 
          alt="Bunny Quizzer Mascot" 
          className="w-20 h-20 sm:w-28 sm:h-28 object-contain drop-shadow-lg"
        />
        <div className="flex flex-col">
          <h1 className="text-3xl sm:text-5xl font-bold text-orange-600 tracking-tight leading-none">
            Bunny Quizzer
          </h1>
          <p className="text-orange-400 font-bold mt-1 text-xs sm:text-sm uppercase tracking-[0.2em]">
            Learn Anything Easily
          </p>
        </div>
      </header>

      <main className="w-full flex justify-center">
        {status === QuizStatus.IDLE && (
          <div className="flex flex-col items-center w-full">
            {error && (
              <div className="w-full max-w-lg mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium text-center text-sm">
                {error}
              </div>
            )}
            <SetupForm onStart={startQuiz} />
          </div>
        )}

        {status === QuizStatus.LOADING && (
          <div className="w-full flex justify-center">
            <BunnyLoader />
          </div>
        )}

        {status === QuizStatus.ACTIVE && (
          <QuizView 
            questions={questions} 
            onComplete={completeQuiz} 
          />
        )}

        {status === QuizStatus.COMPLETED && (
          <ReportCard 
            questions={questions} 
            answers={userAnswers} 
            onRestart={restart} 
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-8 text-orange-400 text-xs sm:text-sm text-center py-6 leading-relaxed px-4">
        Developed by <a href="https://rabbitmarketinghouse.in" target="_blank" rel="noopener noreferrer" className="font-bold underline hover:text-orange-600 transition-colors">Rabbit Marketing House</a> | Powered by Gemini Ai
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
