export const LANGUAGES: { label: string; value: string }[] = [
  { label: 'English', value: 'English' },
  { label: 'हिन्दी', value: 'Hindi' },
  { label: 'தமிழ்', value: 'Tamil' },
  { label: 'తెలుగు', value: 'Telugu' },
  { label: 'বাংলা', value: 'Bengali' },
  { label: 'मराठी', value: 'Marathi' },
  { label: 'ગુજરાતી', value: 'Gujarati' },
  { label: 'ಕನ್ನಡ', value: 'Kannada' },
];

export const TOPIC_SUGGESTIONS: string[] = [
  'Indian History',
  'Human Body',
  'World Capitals',
  'Solar System',
  'Cricket',
  'Famous Scientists',
  'Indian Constitution',
  'Wild Animals',
  'Geography of India',
  'Computer Basics',
  'Environment and Climate',
  'Ancient Civilizations',
];

/** Deterministic per-day pool for "Quiz of the Day". */
export const DAILY_TOPICS: string[] = [
  'General Knowledge',
  'Science Facts',
  'Indian History',
  'World Geography',
  'The Human Body',
  'Space and Planets',
  'Famous Inventions',
  'Rivers and Mountains',
  'Sports Around the World',
  'Books and Authors',
  'Animals and Nature',
  'Indian Freedom Struggle',
  'Basic Mathematics',
  'World Leaders',
  'Food and Nutrition',
  'Music and Art',
  'Technology Today',
  'Weather and Climate',
  'Money and Banking Basics',
  'Landmarks of the World',
];

export function getDailyTopic(date: Date = new Date()): string {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86400000);
  return DAILY_TOPICS[dayOfYear % DAILY_TOPICS.length];
}

export function todayKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}
