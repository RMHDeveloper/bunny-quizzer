import React, { useState } from 'react';
import { Difficulty, QuestionCount, QuizSettings } from '../types';
import { LANGUAGES, TOPIC_SUGGESTIONS } from '../constants';

const TIME_PER_QUESTION = 20;

interface SetupFormProps {
  onStart: (settings: QuizSettings) => void;
  dailyTopic: string;
  dailyBest: number | null;
}

const SetupForm: React.FC<SetupFormProps> = ({ onStart, dailyTopic, dailyBest }) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [count, setCount] = useState<QuestionCount>(5);
  const [language, setLanguage] = useState<string>('English');

  const buildSettings = (overrideTopic?: string): QuizSettings => ({
    topic: (overrideTopic ?? topic).trim(),
    difficulty,
    count,
    language,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    onStart(buildSettings());
  };

  const surpriseMe = () => {
    const pick = TOPIC_SUGGESTIONS[Math.floor(Math.random() * TOPIC_SUGGESTIONS.length)];
    setTopic(pick);
  };

  return (
    <div className="w-full max-w-lg">
      {/* Quiz of the Day */}
      <button
        type="button"
        onClick={() => onStart(buildSettings(dailyTopic))}
        className="w-full mb-5 text-left bg-white border-2 border-orange-200 rounded-2xl p-4 hover:border-orange-400 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.15em] text-orange-400">
              🥕 Quiz of the Day
            </p>
            <p className="text-lg font-bold text-orange-700 leading-tight mt-0.5">{dailyTopic}</p>
            <p className="text-xs text-orange-400 mt-1">
              {dailyBest === null ? 'Not attempted yet today' : `Your best today: ${dailyBest}%`}
            </p>
          </div>
          <span className="text-orange-500 font-bold text-sm group-hover:translate-x-1 transition-transform">
            Play →
          </span>
        </div>
      </button>

      <form onSubmit={handleSubmit} className="w-full bg-white p-6 sm:p-8 rounded-3xl bunny-shadow border-2 border-orange-100">
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
            <div className="mt-3">
              <button
                type="button"
                onClick={surpriseMe}
                className="text-xs font-bold px-3 py-1.5 rounded-full border border-orange-200 text-white carrot-gradient hover:opacity-90 transition-all"
              >
                🎲 Surprise me
              </button>
            </div>
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

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Quiz Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 bg-orange-50 border border-orange-100 rounded-xl focus:outline-none focus:border-orange-400 text-gray-700 text-base appearance-none"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-orange-100 bg-orange-50 text-orange-600 font-bold text-sm">
            <span>⏱️</span>
            <span>Every question is timed — {TIME_PER_QUESTION} seconds each</span>
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
    </div>
  );
};

export default SetupForm;
