
import React from 'react';
import { Question, UserAnswer } from '../types';

interface ReportCardProps {
  questions: Question[];
  answers: UserAnswer[];
  onRestart: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({ questions, answers, onRestart }) => {
  const correctCount = answers.filter(a => a.isCorrect).length;
  const percentage = Math.round((correctCount / questions.length) * 100);

  let grade = "";
  let feedback = "";
  let emoji = "";

  if (percentage >= 90) {
    grade = "Excellent";
    feedback = "You have very good knowledge of this topic. Well done!";
    emoji = "🏆";
  } else if (percentage >= 75) {
    grade = "Good";
    feedback = "Good job. You know most of the answers correctly.";
    emoji = "⭐";
  } else if (percentage >= 50) {
    grade = "Average";
    feedback = "You passed, but you can learn more to improve your score.";
    emoji = "👍";
  } else {
    grade = "Needs Improvement";
    feedback = "Please study this topic again and try the quiz later.";
    emoji = "📚";
  }

  return (
    <div className="w-full max-w-2xl bg-white p-6 sm:p-10 rounded-3xl border-2 border-orange-100 mx-auto">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">{emoji}</div>
        <h2 className="text-3xl font-bold text-orange-700 mb-1">Your Result</h2>
        <div className="h-1 w-20 bg-orange-400 mx-auto rounded-full"></div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-orange-50 p-4 rounded-2xl text-center border border-orange-100">
          <p className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">Percentage</p>
          <p className="text-3xl sm:text-4xl font-black text-orange-600">{percentage}%</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-2xl text-center border border-orange-100">
          <p className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">Correct</p>
          <p className="text-3xl sm:text-4xl font-black text-orange-600">{correctCount}/{questions.length}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-orange-50 mb-8">
        <div className="mb-4">
          <p className="text-orange-400 font-bold text-xs uppercase mb-1">Rating</p>
          <p className="text-xl font-bold text-orange-800">{grade}</p>
        </div>
        <div>
          <p className="text-orange-400 font-bold text-xs uppercase mb-1">Feedback</p>
          <p className="text-base text-gray-700 leading-relaxed">{feedback}</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <h4 className="text-lg font-bold text-gray-800">Check Your Answers:</h4>
        <div className="max-h-60 overflow-y-auto pr-2 space-y-2">
          {questions.map((q, idx) => {
            const userAns = answers.find(a => a.questionId === q.id);
            return (
              <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 ${userAns?.isCorrect ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                <span className="text-base">{userAns?.isCorrect ? '✅' : '❌'}</span>
                <div>
                  <p className="text-sm font-bold text-gray-800 leading-tight mb-1">{q.question}</p>
                  <p className="text-xs text-gray-500">Correct: <span className="font-bold text-green-700">{q.correctAnswer}</span></p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        onClick={onRestart}
        className="w-full carrot-gradient py-4 rounded-xl text-white font-bold text-lg hover:opacity-90 transition-all shadow-md"
      >
        Try Again
      </button>
    </div>
  );
};

export default ReportCard;
