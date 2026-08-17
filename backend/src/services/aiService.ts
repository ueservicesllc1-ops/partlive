import { db } from '../config/firebase';
import * as admin from 'firebase-admin';

export interface PreLivePlan {
  suggestedTitles: string[];
  suggestedDescription: string;
  suggestedTopics: string[];
  suggestedQuestions: string[];
  suggestedActivity: string;
  suggestedGoalDiamonds: number;
}

export interface PostLiveSummary {
  peakViewers: number;
  averageViewers: number;
  newFollowers: number;
  totalDiamonds: number;
  whatWorked: string[];
  whatToImprove: string[];
}

export interface PotentialClipMoment {
  momentId: string;
  liveId: string;
  reason: string;
  suggestedTitles: string[];
  suggestedDescription: string;
  timestamp: string;
}

export const generatePreLivePlan = async (
  category: string = 'PARTY',
  topicKeywords: string = ''
): Promise<PreLivePlan> => {
  return {
    suggestedTitles: [
      `🔥 ${category} Night — ¡Conéctate en Vivo!`,
      `✨ Charla & Música con la Comunidad`,
      `🎙️ Transmisión Especial de Viernes`,
    ],
    suggestedDescription: `Únete a esta transmisión en vivo interactiva. Enviaremos regalos, jugaremos trivia y compartiremos con la comunidad.`,
    suggestedTopics: ['Música y Tendencias', 'Preguntas de la Audiencia', 'Novedades de la Semana'],
    suggestedQuestions: [
      '¿Qué canción marcó tu semana?',
      '¿De qué país nos estás viendo hoy?',
      '¿Cuál es tu lugar favorito para relajarte?',
    ],
    suggestedActivity: 'TRIVIA',
    suggestedGoalDiamonds: 15000,
  };
};

export const detectAudienceDrop = (viewerHistory: number[]): { isDropDetected: boolean; recommendation?: string } => {
  if (viewerHistory.length < 3) return { isDropDetected: false };

  const current = viewerHistory[viewerHistory.length - 1];
  const previous = viewerHistory[viewerHistory.length - 2];

  if (previous > 0 && (previous - current) / previous >= 0.25) {
    return {
      isDropDetected: true,
      recommendation: 'Se detectó una caída de audiencia. Considera iniciar una Trivia rápida o desafiar a un Host a una Batalla PK.',
    };
  }

  return { isDropDetected: false };
};

export const generatePostLiveSummary = async (
  peakViewers: number,
  averageViewers: number,
  newFollowers: number,
  totalDiamonds: number
): Promise<PostLiveSummary> => {
  return {
    peakViewers,
    averageViewers,
    newFollowers,
    totalDiamonds,
    whatWorked: [
      'La audiencia respondió activamente durante las Batallas PK.',
      'El envío de regalos aumentó significativamente al establecer la Meta del Live.',
    ],
    whatToImprove: [
      'La retención de espectadores disminuyó después de 60 minutos. Considera hacer descansos cortos o actividades participativas.',
    ],
  };
};

export const detectClipMoments = async (
  liveId: string,
  events: { type: 'GALAXY_GIFT' | 'PK_COMEBACK' | 'GOAL_COMPLETED'; timestamp: string }[]
): Promise<PotentialClipMoment[]> => {
  return events.map((evt, idx) => ({
    momentId: `clip_moment_${idx}_${Date.now()}`,
    liveId,
    reason: evt.type === 'GALAXY_GIFT' ? '👑 Regalo Galaxy Enviado' : evt.type === 'PK_COMEBACK' ? '⚔️ Remontada Épica en Batalla PK' : '🎯 Meta de Diamantes Alcanzada',
    suggestedTitles: [
      `¡NO VAS A CREER ESTE MOMENTO! 🔥`,
      `¡Reacción Épica en Vivo! 👑`,
      `El mejor momento del Live de hoy ✨`,
    ],
    suggestedDescription: `Momento destacado capturado durante el Live en PartyLive.`,
    timestamp: evt.timestamp,
  }));
};

export const classifyModerationContent = (text: string): { classification: 'LOW' | 'MEDIUM' | 'HIGH'; flagReason?: string } => {
  const lower = (text || '').toLowerCase();
  const prohibited = ['scam', 'password', 'hack', 'gratis coins'];

  for (const word of prohibited) {
    if (lower.includes(word)) {
      return { classification: 'HIGH', flagReason: `Palabra prohibida detectada: ${word}` };
    }
  }

  return { classification: 'LOW' };
};
