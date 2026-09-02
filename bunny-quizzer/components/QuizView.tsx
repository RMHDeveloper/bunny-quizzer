
import React, { useState } from 'react';
import { Question, UserAnswer } from '../types';

interface QuizViewProps {
  questions: Question[];
  onComplete: (answers: UserAnswer[]) => void;
}

const QuizView: React.FC<QuizViewProps> = ({ questions, onComplete }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const handleOptionSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedOption(option);
  };

  const handleNext = () => {
    if (selectedOption === null) return;

    const newAnswer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: selectedOption,
      isCorrect: selectedOption === currentQuestion.correctAnswer
    };

    const updatedAnswers = [...answers, newAnswer];
    
    if (currentIndex < questions.length - 1) {
      setAnswers(updatedAnswers);
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      onComplete(updatedAnswers);
    }
  };

  const revealAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswered(true);
  };

  return (
    <div className="w-full max-w-2xl bg-white p-5 sm:p-8 rounded-3xl bunny-shadow border-2 border-orange-100 mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-orange-600 font-bold text-xs sm:text-sm">Question {currentIndex + 1} of {questions.length}</span>
          <span className="text-orange-400 font-bold text-xs sm:text-sm">{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-3 bg-orange-50 rounded-full overflow-hidden border border-orange-100">
          <div 
            className="h-full carrot-gradient transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 leading-tight">
          {currentQuestion.question}
        </h3>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {currentQuestion.options.map((option, idx) => {
          let optionStyles = "w-full p-4 rounded-xl border-2 font-medium text-left transition-all flex items-center justify-between text-sm sm:text-base ";
          
          if (isAnswered) {
            if (option === currentQuestion.correctAnswer) {
              optionStyles += "bg-green-50 border-green-500 text-green-700 ";
            } else if (option === selectedOption) {
              optionStyles += "bg-red-50 border-red-500 text-red-700 ";
            } else {
              optionStyles += "bg-gray-50 border-gray-100 text-gray-400 opacity-60 ";
            }
          } else {
            if (selectedOption === option) {
              optionStyles += "bg-orange-50 border-orange-500 text-orange-700 ";
            } else {
              optionStyles += "bg-white border-orange-100 text-gray-600 hover:border-orange-300 hover:bg-orange-50 ";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleOptionSelect(option)}
              disabled={isAnswered}
              className={optionStyles}
            >
              <span>{option}</span>
              {isAnswered && option === currentQuestion.correctAnswer && (
                <span className="text-xl">✓</span>
              )}
              {isAnswered && option === selectedOption && option !== currentQuestion.correctAnswer && (
                <span className="text-xl">✗</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Reveal */}
      {isAnswered && (
        <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100 text-sm sm:text-base animate-fadeIn">
          <p className="text-orange-800">
            <span className="font-bold">Fact: </span>
            {currentQuestion.explanation}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        {!isAnswered ? (
          <button
            onClick={revealAnswer}
            disabled={selectedOption === null}
            className="w-full sm:w-auto px-8 py-3 carrot-gradient text-white font-bold rounded-xl disabled:opacity-50 transition-all text-base"
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="w-full sm:w-auto px-8 py-3 bg-orange-500 text-white font-bold rounded-xl transition-all hover:bg-orange-600 text-base"
          >
            {currentIndex === questions.length - 1 ? "Show Result" : "Next Question"}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizView;
