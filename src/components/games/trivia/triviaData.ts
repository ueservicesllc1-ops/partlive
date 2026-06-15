import { TriviaQuestion } from '../../../types/game';

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  // ── Cultura General ────────────────────────────────────────────────────────
  {
    id: 'tg1',
    question: '¿Cuál es el planeta más grande del sistema solar?',
    options: ['Saturno', 'Júpiter', 'Neptuno', 'Urano'],
    correctIndex: 1,
    category: 'Ciencia',
    difficulty: 'easy',
  },
  {
    id: 'tg2',
    question: '¿En qué año llegó el hombre a la Luna por primera vez?',
    options: ['1965', '1967', '1969', '1971'],
    correctIndex: 2,
    category: 'Historia',
    difficulty: 'easy',
  },
  {
    id: 'tg3',
    question: '¿Cuántos continentes tiene la Tierra?',
    options: ['5', '6', '7', '8'],
    correctIndex: 2,
    category: 'Geografía',
    difficulty: 'easy',
  },
  {
    id: 'tg4',
    question: '¿Cuál es el país más grande del mundo por superficie?',
    options: ['China', 'Estados Unidos', 'Canadá', 'Rusia'],
    correctIndex: 3,
    category: 'Geografía',
    difficulty: 'easy',
  },
  {
    id: 'tg5',
    question: '¿Qué elemento químico tiene el símbolo "O"?',
    options: ['Oro', 'Osmio', 'Oxígeno', 'Ósmosis'],
    correctIndex: 2,
    category: 'Ciencia',
    difficulty: 'easy',
  },
  // ── Entretenimiento ────────────────────────────────────────────────────────
  {
    id: 'te1',
    question: '¿En qué película de Disney aparece la canción "Let It Go"?',
    options: ['Moana', 'Tangled', 'Frozen', 'Brave'],
    correctIndex: 2,
    category: 'Entretenimiento',
    difficulty: 'easy',
  },
  {
    id: 'te2',
    question: '¿Cuántas películas tiene la saga principal de Star Wars (Skywalker)?',
    options: ['7', '8', '9', '10'],
    correctIndex: 2,
    category: 'Entretenimiento',
    difficulty: 'medium',
  },
  {
    id: 'te3',
    question: '¿Qué show de Netflix narra la historia de una familia disfuncional en Hawkins?',
    options: ['Dark', 'Stranger Things', 'The OA', 'Mindhunter'],
    correctIndex: 1,
    category: 'Entretenimiento',
    difficulty: 'easy',
  },
  {
    id: 'te4',
    question: '¿Quién compuso la banda sonora de "El Rey León" (1994)?',
    options: ['Hans Zimmer', 'John Williams', 'Alan Menken', 'Elton John'],
    correctIndex: 0,
    category: 'Entretenimiento',
    difficulty: 'medium',
  },
  {
    id: 'te5',
    question: '¿En cuál ciudad ocurre la historia de "Breaking Bad"?',
    options: ['Denver', 'Albuquerque', 'Phoenix', 'Las Vegas'],
    correctIndex: 1,
    category: 'Entretenimiento',
    difficulty: 'easy',
  },
  // ── Tecnología ────────────────────────────────────────────────────────────
  {
    id: 'tt1',
    question: '¿Quién fundó Apple junto a Steve Jobs?',
    options: ['Bill Gates', 'Steve Wozniak', 'Mark Zuckerberg', 'Elon Musk'],
    correctIndex: 1,
    category: 'Tecnología',
    difficulty: 'easy',
  },
  {
    id: 'tt2',
    question: '¿Cuántos bits tiene un byte?',
    options: ['4', '8', '16', '32'],
    correctIndex: 1,
    category: 'Tecnología',
    difficulty: 'easy',
  },
  {
    id: 'tt3',
    question: '¿Cuál lenguaje de programación es conocido por la serpiente?',
    options: ['Java', 'Ruby', 'Python', 'Swift'],
    correctIndex: 2,
    category: 'Tecnología',
    difficulty: 'easy',
  },
  {
    id: 'tt4',
    question: '¿Cuál empresa creó el sistema operativo Android?',
    options: ['Apple', 'Microsoft', 'Google', 'Samsung'],
    correctIndex: 2,
    category: 'Tecnología',
    difficulty: 'easy',
  },
  {
    id: 'tt5',
    question: '¿Qué significa HTTP?',
    options: [
      'HyperText Transfer Protocol',
      'High Transfer Text Protocol',
      'HyperText Technical Process',
      'Hosted Transfer Protocol',
    ],
    correctIndex: 0,
    category: 'Tecnología',
    difficulty: 'medium',
  },
  // ── Deportes ──────────────────────────────────────────────────────────────
  {
    id: 'td1',
    question: '¿En qué país se juega la Liga MX de fútbol?',
    options: ['Argentina', 'Colombia', 'México', 'España'],
    correctIndex: 2,
    category: 'Deportes',
    difficulty: 'easy',
  },
  {
    id: 'td2',
    question: '¿Cuántos jugadores hay en un equipo de baloncesto en cancha?',
    options: ['4', '5', '6', '7'],
    correctIndex: 1,
    category: 'Deportes',
    difficulty: 'easy',
  },
  {
    id: 'td3',
    question: '¿Cuántos sets se necesitan para ganar en tenis (Grand Slam masculino)?',
    options: ['2', '3', '4', '5'],
    correctIndex: 1,
    category: 'Deportes',
    difficulty: 'medium',
  },
  // ── Música ────────────────────────────────────────────────────────────────
  {
    id: 'tm1',
    question: '¿Cuántas cuerdas tiene una guitarra estándar?',
    options: ['4', '5', '6', '7'],
    correctIndex: 2,
    category: 'Música',
    difficulty: 'easy',
  },
  {
    id: 'tm2',
    question: '¿De qué país es originario el reggaetón?',
    options: ['Puerto Rico', 'Colombia', 'Jamaica', 'República Dominicana'],
    correctIndex: 0,
    category: 'Música',
    difficulty: 'easy',
  },
];

/** Devuelve N preguntas aleatorias sin repetición */
export const getRandomQuestions = (count = 5): TriviaQuestion[] => {
  const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};
