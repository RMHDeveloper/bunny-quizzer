
import React, { useEffect, useRef, useState } from 'react';
import SetupForm from './components/SetupForm';
import QuizView from './components/QuizView';
import ReportCard from './components/ReportCard';
import BunnyLoader from './components/BunnyLoader';
import StatBar from './components/StatBar';
import {
  QuizStatus,
  QuizSettings,
  Question,
  UserAnswer,
  Difficulty,
  QuestionCount,
  PlayerStats,
} from './types';
import { streamQuiz } from './services/geminiService';
import { addXp, addHistory, getStats, getQotdBest, setQotdBest } from './services/storage';
import { getDailyTopic, todayKey } from './constants';
import { Challenge, readChallengeFromUrl, clearChallengeFromUrl } from './lib/challenge';

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  [Difficulty.EASY]: 1,
  [Difficulty.MEDIUM]: 1.5,
  [Difficulty.HARD]: 2,
};

const App: React.FC = () => {
  const [status, setStatus] = useState<QuizStatus>(QuizStatus.IDLE);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [generating, setGenerating] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<QuizSettings | null>(null);

  const [stats, setStats] = useState<PlayerStats>(() => getStats());
  const [xpEarned, setXpEarned] = useState(0);

  const [incomingChallenge, setIncomingChallenge] = useState<Challenge | null>(null);
  const [challengerScore, setChallengerScore] = useState<number | null>(null);
  const [isDaily, setIsDaily] = useState(false);

  const dailyTopic = getDailyTopic();
  const [dailyBest, setDailyBest] = useState<number | null>(null);

  const runIdRef = useRef(0);

  useEffect(() => {
    setStats(getStats());
    setDailyBest(getQotdBest(todayKey()));
    const challenge = readChallengeFromUrl();
    if (challenge) setIncomingChallenge(challenge);
  }, []);

  const runStream = async (quizSettings: QuizSettings) => {
    const runId = ++runIdRef.current;
    let produced = 0;
    try {
      for await (const question of streamQuiz(quizSettings)) {
        if (runIdRef.current !== runId) return;
        produced += 1;
        setQuestions((prev) => [...prev, question]);
        setStatus((prev) => (prev === QuizStatus.LOADING ? QuizStatus.ACTIVE : prev));
      }
      if (runIdRef.current !== runId) return;
      setGenerating(false);
      if (produced === 0) {
        setError('Could not generate the quiz. Please try a different topic.');
        setStatus(QuizStatus.IDLE);
      }
    } catch (err) {
      if (runIdRef.current !== runId) return;
      setGenerating(false);
      if (produced === 0) {
        console.error(err);
        setError(err instanceof Error && err.message ? err.message : 'Unable to generate quiz.');
        setStatus(QuizStatus.IDLE);
      }
    }
  };

  const startQuiz = (quizSettings: QuizSettings, daily = false) => {
    runIdRef.current += 1; // cancel any in-flight stream
    setSettings(quizSettings);
    setQuestions([]);
    setUserAnswers([]);
    setError(null);
    setXpEarned(0);
    setChallengerScore(null);
    setIsDaily(daily);
    setGenerating(true);
    setStatus(QuizStatus.LOADING);
    void runStream(quizSettings);
  };

  const acceptChallenge = (challenge: Challenge) => {
    runIdRef.current += 1;
    const challengeSettings: QuizSettings = {
      topic: challenge.t,
      difficulty: challenge.d,
      count: challenge.q.length as QuestionCount,
      language: challenge.l || 'English',
    };
    setSettings(challengeSettings);
    setQuestions(challenge.q);
    setUserAnswers([]);
    setError(null);
    setXpEarned(0);
    setChallengerScore(typeof challenge.s === 'number' ? challenge.s : null);
    setIsDaily(false);
    setGenerating(false);
    setStatus(QuizStatus.ACTIVE);
  };

  const completeQuiz = (answers: UserAnswer[]) => {
    if (!settings) return;
    const total = questions.length || 1;
    const correct = answers.filter((a) => a.isCorrect).length;
    const pct = Math.round((correct / total) * 100);

    const multiplier = DIFFICULTY_MULTIPLIER[settings.difficulty] ?? 1;
    let earned = Math.round(correct * 10 * multiplier) + 5;
    if (pct === 100) earned += 20;
    earned += correct * 3; // timed bonus (every quiz is timed)

    const nextStats = addXp(earned);
    addHistory({ topic: settings.topic, score: correct, total });
    if (isDaily) {
      setQotdBest(todayKey(), pct);
      setDailyBest(getQotdBest(todayKey()));
    }

    setXpEarned(earned);
    setStats(nextStats);
    setUserAnswers(answers);
    setStatus(QuizStatus.COMPLETED);
  };

  const restart = () => {
    runIdRef.current += 1;
    setQuestions([]);
    setUserAnswers([]);
    setError(null);
    setSettings(null);
    setGenerating(false);
    setChallengerScore(null);
    setIsDaily(false);
    setIncomingChallenge(null);
    clearChallengeFromUrl();
    setStats(getStats());
    setDailyBest(getQotdBest(todayKey()));
    setStatus(QuizStatus.IDLE);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start sm:justify-center p-4 sm:p-6 md:p-10">
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

      <main className="w-full flex flex-col items-center">
        {status === QuizStatus.IDLE && (
          <div className="flex flex-col items-center w-full">
            <StatBar stats={stats} />

            {error && (
              <div className="w-full max-w-lg mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl font-medium text-center text-sm">
                {error}
              </div>
            )}

            {incomingChallenge && (
              <div className="w-full max-w-lg mb-6 p-5 bg-orange-500 text-white rounded-2xl animate-fadeIn">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-orange-100">
                  ⚔️ You were challenged
                </p>
                <p className="text-lg font-bold mt-1">{incomingChallenge.t}</p>
                <p className="text-sm text-orange-100 mt-0.5">
                  {incomingChallenge.q.length} questions · beat {incomingChallenge.s}%
                </p>
                <button
                  onClick={() => acceptChallenge(incomingChallenge)}
                  className="mt-3 w-full bg-white text-orange-600 font-bold py-2.5 rounded-xl hover:bg-orange-50 transition-all"
                >
                  Accept Challenge
                </button>
              </div>
            )}

            <SetupForm
              onStart={(s) => startQuiz(s, s.topic.trim() === dailyTopic.trim())}
              dailyTopic={dailyTopic}
              dailyBest={dailyBest}
            />
          </div>
        )}

        {status === QuizStatus.LOADING && (
          <BunnyLoader ready={questions.length} total={settings?.count ?? 0} />
        )}

        {status === QuizStatus.ACTIVE && settings && (
          <QuizView
            questions={questions}
            expectedCount={settings.count}
            generating={generating}
            onComplete={completeQuiz}
          />
        )}

        {status === QuizStatus.COMPLETED && settings && (
          <ReportCard
            questions={questions}
            answers={userAnswers}
            settings={settings}
            xpEarned={xpEarned}
            stats={stats}
            challengerScore={challengerScore}
            onRestart={restart}
          />
        )}
      </main>

      <footer className="mt-8 text-orange-400 text-xs sm:text-sm text-center py-6 leading-relaxed px-4">
        Developed by{' '}
        <a
          href="https://rabbitmarketinghouse.in"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline hover:text-orange-600 transition-colors"
        >
          Rabbit Marketing House
        </a>{' '}
        | Powered by Google Gemini
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
