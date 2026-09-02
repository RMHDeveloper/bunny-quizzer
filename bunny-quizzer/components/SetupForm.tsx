
import React, { useState } from 'react';
import { Difficulty, QuestionCount, QuizSettings } from '../types';

interface SetupFormProps {
  onStart: (settings: QuizSettings) => void;
}

const SetupForm: React.FC<SetupFormProps> = ({ onStart }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [count, setCount] = useState<QuestionCount>(5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onStart({ topic, difficulty, count });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white p-6 sm:p-8 rounded-3xl bunny-shadow border-2 border-orange-100">
      <div className="mb-6 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-orange-600 mb-1">Create Quiz</h2>
        <p className="text-orange-400 text-sm sm:text-base">Fill the details below to start</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">Topic Name</label>
          <input
            type="text"
            required
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Science, India History, Animals..."
            className="w-full px-4 py-3 bg-orange-50 border border-orange-100 rounded-xl focus:outline-none focus:border-orange-400 text-gray-700 text-base"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">Difficulty Level</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.values(Difficulty).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`py-2 px-1 rounded-xl border-2 text-sm sm:text-base font-bold transition-all ${
                  difficulty === d
                    ? 'bg-orange-500 text-white border-orange-600'
                    : 'bg-white text-orange-400 border-orange-100 hover:border-orange-200'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-3">Number of Questions</label>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 15].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCount(c as QuestionCount)}
                className={`py-2 px-1 rounded-xl border-2 text-sm sm:text-base font-bold transition-all ${
                  count === c
                    ? 'bg-orange-500 text-white border-orange-600'
                    : 'bg-white text-orange-400 border-orange-100 hover:border-orange-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!topic.trim()}
          className="w-full carrot-gradient py-4 rounded-xl text-white font-bold text-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          Start Quiz
        </button>
      </div>
    </form>
  );
};

export default SetupForm;
