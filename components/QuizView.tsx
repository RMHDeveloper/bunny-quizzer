import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Question, UserAnswer } from '../types';

interface QuizViewProps {
  questions: Question[];
  expectedCount: number;
  generating: boolean;
  onComplete: (answers: UserAnswer[]) => void;
}

const TIME_PER_QUESTION = 20;

const QuizView: React.FC<QuizViewProps> = ({
  questions,
  expectedCount,
  generating,
  onComplete,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(() => Math.max(2, Math.floor(expectedCount / 2)));
  const [hiddenByQuestion, setHiddenByQuestion] = useState<Record<number, number[]>>({});
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [waitingForNext, setWaitingForNext] = useState(false);

  const currentQuestion: Question | undefined = questions[currentIndex];
  const totalToShow = generating ? Math.max(expectedCount, questions.length) : questions.length;
  const progress = totalToShow > 0 ? ((currentIndex + 1) / totalToShow) * 100 : 0;
  const hidden = hiddenByQuestion[currentIndex] ?? [];

  const resetPerQuestion = useCallback(() => {
    setSelectedIndex(null);
    setIsAnswered(false);
    setTimeLeft(TIME_PER_QUESTION);
  }, []);

  const finish = useCallback(
    (finalAnswers: UserAnswer[]) => {
      onComplete(finalAnswers);
    },
    [onComplete]
  );

  const advance = useCallback(() => {
    if (!currentQuestion) return;
    const chosen = selectedIndex != null ? currentQuestion.options[selectedIndex] : null;
    const answer: UserAnswer = {
      questionId: currentQuestion.id,
      selectedAnswer: chosen ? chosen.text : null,
      isCorrect: chosen ? chosen.correct : false,
    };
    const updated = [...answers, answer];

    if (currentIndex < questions.length - 1) {
      setAnswers(updated);
      setCurrentIndex((i) => i + 1);
      resetPerQuestion();
      return;
    }
    // on the last question we currently hold
    if (!generating) {
      finish(updated);
      return;
    }
    // more questions are still streaming in - hold here
    setAnswers(updated);
    setWaitingForNext(true);
  }, [answers, currentIndex, currentQuestion, finish, generating, questions.length, resetPerQuestion, selectedIndex]);

  // resume once the next streamed question arrives (or finish if none is coming)
  useEffect(() => {
    if (!waitingForNext) return;
    if (questions.length > currentIndex + 1) {
      setWaitingForNext(false);
      setCurrentIndex((i) => i + 1);
      resetPerQuestion();
    } else if (!generating) {
      setWaitingForNext(false);
      finish(answers);
    }
  }, [waitingForNext, questions.length, currentIndex, generating, answers, finish, resetPerQuestion]);

  // per-question countdown (always on)
  useEffect(() => {
    if (isAnswered || waitingForNext || !currentQuestion) return;
    if (timeLeft <= 0) {
      setIsAnswered(true);
      return;
    }
    const id = window.setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(id);
  }, [isAnswered, waitingForNext, currentQuestion, timeLeft]);

  const revealAnswer = () => {
    if (selectedIndex === null) return;
    setIsAnswered(true);
  };

  const useHint = () => {
    if (hintsLeft <= 0 || isAnswered || hidden.length > 0 || !currentQuestion) return;
    const wrongIndexes = currentQuestion.options
      .map((o, i) => (o.correct ? -1 : i))
      .filter((i) => i >= 0)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    setHiddenByQuestion((prev) => ({ ...prev, [currentIndex]: wrongIndexes }));
    setHintsLeft((h) => h - 1);
  };

  const correctIndex = useMemo(
    () => (currentQuestion ? currentQuestion.options.findIndex((o) => o.correct) : -1),
    [currentQuestion]
  );

  if (waitingForNext || !currentQuestion) {
    return (
      <div className="w-full max-w-2xl bg-white p-8 rounded-3xl bunny-shadow border-2 border-orange-100 mx-auto text-center">
        <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-orange-500 font-bold">Getting the next question ready...</p>
      </div>
    );
  }

  const isLastKnown = currentIndex === questions.length - 1;
  const timeLow = !isAnswered && timeLeft <= 5;

  return (
    <div className="w-full max-w-2xl bg-white p-5 sm:p-8 rounded-3xl bunny-shadow border-2 border-orange-100 mx-auto">
      {/* Progress + timer */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-orange-600 font-bold text-xs sm:text-sm">
            Question {currentIndex + 1} of {totalToShow}
          </span>
          <div className="flex items-center gap-3">
            <span
              className={`font-black text-xs sm:text-sm px-2 py-0.5 rounded-full border ${
                timeLow
                  ? 'text-red-600 border-red-200 bg-red-50 animate-pulse'
                  : 'text-orange-500 border-orange-200 bg-orange-50'
              }`}
            >
              ⏱️ {isAnswered ? 'Done' : `${timeLeft}s`}
            </span>
            <span className="text-orange-400 font-bold text-xs sm:text-sm">
              {Math.round(progress)}% Complete
            </span>
          </div>
        </div>
        <div className="h-3 bg-orange-50 rounded-full overflow-hidden border border-orange-100">
          <div
            className="h-full carrot-gradient transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Question */}
      <div className="mb-4">
        <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 leading-tight">
          {currentQuestion.question}
        </h3>
      </div>

      {/* Hint */}
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={useHint}
          disabled={hintsLeft <= 0 || isAnswered || hidden.length > 0}
          className="text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          💡 50:50 Hint ({hintsLeft} left)
        </button>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {currentQuestion.options.map((option, idx) => {
          const isHidden = hidden.includes(idx);
          let optionStyles =
            'w-full p-4 rounded-xl border-2 font-medium text-left transition-all text-sm sm:text-base ';

          if (isHidden) {
            optionStyles += 'bg-gray-50 border-gray-100 text-gray-300 line-through cursor-not-allowed ';
          } else if (isAnswered) {
            if (option.correct) {
              optionStyles += 'bg-green-50 border-green-500 text-green-700 ';
            } else if (idx === selectedIndex) {
              optionStyles += 'bg-red-50 border-red-500 text-red-700 ';
            } else {
              optionStyles += 'bg-gray-50 border-gray-200 text-gray-500 ';
            }
          } else if (selectedIndex === idx) {
            optionStyles += 'bg-orange-50 border-orange-500 text-orange-700 ';
          } else {
            optionStyles += 'bg-white border-orange-100 text-gray-600 hover:border-orange-300 hover:bg-orange-50 ';
          }

          return (
            <button
              key={idx}
              onClick={() => !isAnswered && !isHidden && setSelectedIndex(idx)}
              disabled={isAnswered || isHidden}
              className={optionStyles}
            >
              <span className="flex items-center justify-between">
                <span>{option.text}</span>
                {isAnswered && option.correct && <span className="text-xl">✓</span>}
                {isAnswered && idx === selectedIndex && !option.correct && (
                  <span className="text-xl">✗</span>
                )}
              </span>
              {isAnswered && !isHidden && option.reason && (
                <span
                  className={`block mt-2 text-xs font-normal leading-snug ${
                    option.correct
                      ? 'text-green-600'
                      : idx === selectedIndex
                        ? 'text-red-500'
                        : 'text-gray-500'
                  }`}
                >
                  {option.correct ? 'Why this is right: ' : 'Why this is wrong: '}
                  {option.reason}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation */}
      {isAnswered && (
        <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-100 text-sm sm:text-base animate-fadeIn">
          {selectedIndex === null && (
            <p className="text-red-600 font-bold mb-1">Time up! No answer selected.</p>
          )}
          <p className="text-orange-800">
            <span className="font-bold">Fact: </span>
            {currentQuestion.explanation ||
              (correctIndex >= 0
                ? `The correct answer is "${currentQuestion.options[correctIndex].text}".`
                : '')}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end">
        {!isAnswered ? (
          <button
            onClick={revealAnswer}
            disabled={selectedIndex === null}
            className="w-full sm:w-auto px-8 py-3 carrot-gradient text-white font-bold rounded-xl disabled:opacity-50 transition-all text-base"
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={advance}
            className="w-full sm:w-auto px-8 py-3 bg-orange-500 text-white font-bold rounded-xl transition-all hover:bg-orange-600 text-base"
          >
            {isLastKnown && !generating ? 'Show Result' : 'Next Question'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizView;
