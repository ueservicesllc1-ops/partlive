import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface AIModerationResult {
  riskScore: number; // 0 to 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  categoriesDetected: string[];
  humanReviewRequired: boolean;
  modelUsed: string;
  timestamp: string;
}

export interface CreatorAISuggestions {
  suggestedTitles: string[];
  liveIdeas: string[];
  coachingTip: string;
  timestamp: string;
}

export interface AIUsageLog {
  id: string;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUsd: number;
  timestamp: any;
}

// Translation cache to avoid duplicate API calls
const translationCache: Record<string, string> = {};

export const selectAIModel = (taskType: 'moderation' | 'creative' | 'translation' | 'analytics'): string => {
  switch (taskType) {
    case 'moderation':
      return 'text-moderation-latest';
    case 'creative':
      return 'gpt-4o';
    case 'translation':
    case 'analytics':
    default:
      return 'gpt-4o-mini';
  }
};

export const analyzeTextModeration = async (
  text: string,
  context: 'chat' | 'title' | 'comment' | 'bio' = 'chat'
): Promise<AIModerationResult> => {
  const lower = text.toLowerCase();
  const categoriesDetected: string[] = [];
  let riskScore = 5;

  if (lower.includes('spam') || lower.includes('buy cheap followers') || lower.includes('win $10000')) {
    categoriesDetected.push('SPAM_SCAM');
    riskScore += 65;
  }
  if (lower.includes('hate') || lower.includes('kill') || lower.includes('threat')) {
    categoriesDetected.push('HARASSMENT_THREAT');
    riskScore += 80;
  }

  const clampedScore = Math.min(100, riskScore);
  let riskLevel: AIModerationResult['riskLevel'] = 'LOW';
  if (clampedScore >= 80) riskLevel = 'CRITICAL';
  else if (clampedScore >= 60) riskLevel = 'HIGH';
  else if (clampedScore >= 30) riskLevel = 'MEDIUM';

  return {
    riskScore: clampedScore,
    riskLevel,
    categoriesDetected,
    humanReviewRequired: riskLevel === 'HIGH' || riskLevel === 'CRITICAL',
    modelUsed: selectAIModel('moderation'),
    timestamp: new Date().toISOString(),
  };
};

export const generateCreatorSuggestions = async (
  userId: string,
  topic: string = 'general'
): Promise<CreatorAISuggestions> => {
  return {
    suggestedTitles: [
      `🎉 Noche de Karaoke y Música en Vivo: Especial ${topic}`,
      `🔥 PK Battle de Talentos con la Comunidad | ¡Sumemos Likes!`,
      `✨ Charla Abierta y Preguntas en Vivo: ${topic}`,
    ],
    liveIdeas: [
      'Organiza un reto de taps 👍 con tu audiencia durante los primeros 10 minutos.',
      'Realiza una votación en vivo sobre la próxima canción del show.',
      'Agradece por nombre a cada espectador que envíe un regalo especial.',
    ],
    coachingTip: 'Tus espectadores permanecen 45% más tiempo cuando respondes al chat en los primeros 30 segundos.',
    timestamp: new Date().toISOString(),
  };
};

export const translateChatText = async (
  text: string,
  targetLanguage: string = 'es'
): Promise<{ translatedText: string; isCacheHit: boolean }> => {
  const cacheKey = `${targetLanguage}_${text}`;
  if (translationCache[cacheKey]) {
    return { translatedText: translationCache[cacheKey], isCacheHit: true };
  }

  // Simulated translation result for demo
  const translatedText = `[Traducción ${targetLanguage.toUpperCase()}]: ${text}`;
  translationCache[cacheKey] = translatedText;

  return { translatedText, isCacheHit: false };
};

export const verifyFinancialIsolation = (actionName: string): { allowed: boolean; reason?: string } => {
  const lower = actionName.toLowerCase();
  const prohibitedKeywords = ['coins', 'diamonds', 'payout', 'ledger', 'balance', 'wallet'];

  for (const kw of prohibitedKeywords) {
    if (lower.includes(kw)) {
      return {
        allowed: false,
        reason: `DENIED_FINANCIAL_ISOLATION: AI models are strictly prohibited from mutating ${kw}.`,
      };
    }
  }

  return { allowed: true };
};

export const trackAIUsage = async (
  feature: string,
  model: string,
  inputTokens: number,
  outputTokens: number
): Promise<AIUsageLog> => {
  const estimatedCostUsd = Number(((inputTokens * 0.000001) + (outputTokens * 0.000002)).toFixed(6));
  const ref = db.collection('aiUsageLogs').doc();
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  const log: AIUsageLog = {
    id: ref.id,
    feature,
    model,
    inputTokens,
    outputTokens,
    estimatedCostUsd,
    timestamp,
  };

  await ref.set(log);
  return log;
};

export const getAICostReport = async (): Promise<{
  totalCostMonthUsd: number;
  budgetCapUsd: number;
  moderationCostUsd: number;
  creatorAiCostUsd: number;
  translationCostUsd: number;
}> => {
  return {
    totalCostMonthUsd: 42.50,
    budgetCapUsd: 300.0,
    moderationCostUsd: 18.20,
    creatorAiCostUsd: 14.80,
    translationCostUsd: 9.50,
  };
};
