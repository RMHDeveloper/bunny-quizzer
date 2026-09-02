import React, { useEffect, useState } from 'react';
import { PlayerStats, Question, QuizSettings, UserAnswer } from '../types';
import { generateStudySummary } from '../services/geminiService';
import { challengeUrl } from '../lib/challenge';

interface ReportCardProps {
  questions: Question[];
  answers: UserAnswer[];
  settings: QuizSettings;
  xpEarned: number;
  stats: PlayerStats;
  challengerScore: number | null;
  onRestart: () => void;
}

const ReportCard: React.FC<ReportCardProps> = ({
  questions,
  answers,
  settings,
  xpEarned,
  stats,
  challengerScore,
  onRestart,
}) => {
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const percentage = Math.round((correctCount / questions.length) * 100);

  const [summary, setSummary] = useState<string>('');
  const [summaryState, setSummaryState] = useState<'loading' | 'done' | 'error'>('loading');

  const [shareUrl, setShareUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let ignore = false;
    setSummaryState('loading');
    generateStudySummary(settings, questions, answers)
      .then((text) => {
        if (ignore) return;
        setSummary(text);
        setSummaryState('done');
      })
      .catch(() => {
        if (!ignore) setSummaryState('error');
      });
    return () => {
      ignore = true;
    };
  }, [settings, questions, answers]);

  let grade = '';
  let feedback = '';
  let emoji = '';
  if (percentage >= 90) {
    grade = 'Excellent';
    feedback = 'You have very good knowledge of this topic. Well done!';
    emoji = '🏆';
  } else if (percentage >= 75) {
    grade = 'Good';
    feedback = 'Good job. You know most of the answers correctly.';
    emoji = '⭐';
  } else if (percentage >= 50) {
    grade = 'Average';
    feedback = 'You passed, but you can learn more to improve your score.';
    emoji = '👍';
  } else {
    grade = 'Needs Improvement';
    feedback = 'Please study this topic again and try the quiz later.';
    emoji = '📚';
  }

  const buildShareUrl = () => {
    const url = challengeUrl({
      t: settings.topic,
      d: settings.difficulty,
      l: settings.language,
      s: percentage,
      q: questions,
    });
    setShareUrl(url);
    return url;
  };

  const handleChallenge = async () => {
    const url = shareUrl || buildShareUrl();
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Bunny Quizzer Challenge',
          text: `I scored ${percentage}% on "${settings.topic}". Can you beat me?`,
          url,
        });
        return;
      }
    } catch {
      /* user cancelled share - fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked - the input below lets them copy manually */
    }
  };

  let challengeVerdict: string | null = null;
  if (challengerScore !== null) {
    if (percentage > challengerScore) challengeVerdict = `You win! ${percentage}% vs ${challengerScore}%`;
    else if (percentage < challengerScore) challengeVerdict = `You lose. ${percentage}% vs ${challengerScore}%`;
    else challengeVerdict = `It's a tie at ${percentage}%`;
  }

  return (
    <div className="w-full max-w-2xl bg-white p-6 sm:p-10 rounded-3xl border-2 border-orange-100 mx-auto">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">{emoji}</div>
        <h2 className="text-3xl font-bold text-orange-700 mb-1">Your Result</h2>
        <div className="h-1 w-20 bg-orange-400 mx-auto rounded-full"></div>
      </div>

      {challengeVerdict && (
        <div className="mb-6 p-4 rounded-2xl bg-orange-500 text-white text-center font-bold animate-fadeIn">
          ⚔️ {challengeVerdict}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-orange-50 p-4 rounded-2xl text-center border border-orange-100">
          <p className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">Percentage</p>
          <p className="text-3xl sm:text-4xl font-black text-orange-600">{percentage}%</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-2xl text-center border border-orange-100">
          <p className="text-orange-400 font-bold text-xs uppercase tracking-wider mb-1">Correct</p>
          <p className="text-3xl sm:text-4xl font-black text-orange-600">
            {correctCount}/{questions.length}
          </p>
        </div>
      </div>

      {/* XP / level */}
      <div className="mb-6 p-4 rounded-2xl border-2 border-orange-100 flex items-center gap-3">
        <div className="w-11 h-11 rounded-full carrot-gradient flex items-center justify-center text-white font-black">
          {stats.level}
        </div>
        <div className="flex-1">
          <p className="font-bold text-orange-700">
            +{xpEarned} XP earned <span className="text-orange-400 font-normal">· {stats.title}</span>
          </p>
          <div className="h-2 bg-orange-50 rounded-full overflow-hidden border border-orange-100 mt-1">
            <div
              className="h-full carrot-gradient transition-all duration-700"
              style={{ width: `${Math.min(100, Math.round((stats.levelXp / stats.levelNeed) * 100))}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border-2 border-orange-50 mb-6">
        <div className="mb-4">
          <p className="text-orange-400 font-bold text-xs uppercase mb-1">Rating</p>
          <p className="text-xl font-bold text-orange-800">{grade}</p>
        </div>
        <div>
          <p className="text-orange-400 font-bold text-xs uppercase mb-1">Feedback</p>
          <p className="text-base text-gray-700 leading-relaxed">{feedback}</p>
        </div>
      </div>

      {/* AI study summary */}
      <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 mb-6">
        <p className="text-orange-500 font-bold text-sm mb-2">🐰 Bunny's Study Notes</p>
        {summaryState === 'loading' && (
          <p className="text-sm text-orange-400">Writing your study notes...</p>
        )}
        {summaryState === 'error' && (
          <p className="text-sm text-orange-400">Study notes are not available right now.</p>
        )}
        {summaryState === 'done' && (
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{summary}</p>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <h4 className="text-lg font-bold text-gray-800">Check Your Answers:</h4>
        <div className="max-h-72 overflow-y-auto pr-2 space-y-2">
          {questions.map((q, idx) => {
            const userAns = answers.find((a) => a.questionId === q.id);
            const ok = userAns?.isCorrect;
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${ok ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-base">{ok ? '✅' : '❌'}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-gray-800 leading-tight mb-2">{q.question}</p>
                    <ul className="space-y-1.5">
                      {q.options.map((o, oi) => {
                        const chosen = o.text === userAns?.selectedAnswer;
                        const tone = o.correct
                          ? 'text-green-700'
                          : chosen
                            ? 'text-red-600'
                            : 'text-gray-500';
                        const mark = o.correct ? '✓ ' : chosen ? '✗ ' : '• ';
                        return (
                          <li key={oi} className="text-xs leading-snug">
                            <span className={`font-bold ${tone}`}>
                              {mark}
                              {o.text}
                              {chosen && !o.correct ? ' (your answer)' : ''}
                            </span>
                            {o.reason && <span className="text-gray-500"> — {o.reason}</span>}
                          </li>
                        );
                      })}
                    </ul>
                    {!ok && userAns && userAns.selectedAnswer === null && (
                      <p className="text-xs text-red-600 font-bold mt-1">No answer — time ran out.</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Challenge a friend */}
      <div className="bg-white p-5 rounded-2xl border-2 border-orange-100 mb-6">
        <p className="text-orange-500 font-bold text-sm mb-1">⚔️ Challenge a Friend</p>
        <p className="text-xs text-orange-400 mb-3">
          Send this exact quiz to a friend. They try to beat your {percentage}%.
        </p>
        <button
          onClick={handleChallenge}
          className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl hover:bg-orange-600 transition-all mb-3"
        >
          {copied ? 'Link copied!' : 'Create Challenge Link'}
        </button>
        {shareUrl && (
          <input
            readOnly
            value={shareUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full text-xs px-3 py-2 bg-orange-50 border border-orange-100 rounded-lg text-gray-600"
          />
        )}
      </div>

      <button
        onClick={onRestart}
        className="w-full carrot-gradient py-4 rounded-xl text-white font-bold text-lg hover:opacity-90 transition-all shadow-md"
      >
        Try Another Quiz
      </button>
    </div>
  );
};

export default ReportCard;
