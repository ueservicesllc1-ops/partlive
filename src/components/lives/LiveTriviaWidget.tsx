import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { colors } from '../../theme';

interface TriviaQuestion {
  questionText: string;
  options: string[];
}

interface LiveTriviaWidgetProps {
  activityId: string;
  questionIndex: number;
  question: TriviaQuestion;
  onSubmitAnswer: (optionIndex: number) => Promise<{ correct: boolean; xpEarned: number }>;
  onClose?: () => void;
}

export const LiveTriviaWidget: React.FC<LiveTriviaWidgetProps> = ({
  question,
  onSubmitAnswer,
  onClose,
}) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; xpEarned: number } | null>(null);

  const handleSelect = async (index: number) => {
    if (selectedOption !== null || submitting) return;
    setSelectedOption(index);
    setSubmitting(true);
    try {
      const res = await onSubmitAnswer(index);
      setResult(res);
    } catch (err) {
      console.error('Error submitting trivia answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.badgeText}>🧠 TRIVIA EN VIVO</Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.questionText}>{question.questionText}</Text>

      <View style={styles.optionsCol}>
        {question.options.map((option, idx) => {
          const isSelected = selectedOption === idx;
          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.optionBtn,
                isSelected && styles.optionSelected,
                result && isSelected && (result.correct ? styles.optionCorrect : styles.optionWrong),
              ]}
              disabled={selectedOption !== null}
              onPress={() => handleSelect(idx)}
            >
              <Text style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</Text>
              <Text style={styles.optionText}>{option}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {submitting && <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 8 }} />}

      {result && (
        <View style={styles.resultBox}>
          <Text style={[styles.resultText, result.correct ? styles.correctText : styles.wrongText]}>
            {result.correct ? `🎉 ¡CORRECTO! +${result.xpEarned} XP` : `❌ Incorrecto (+${result.xpEarned} XP)`}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1E1B30',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.accent,
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.accent,
  },
  closeBtn: {
    padding: 2,
  },
  closeText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  questionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  optionsCol: {
    gap: 6,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141124',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#342D54',
  },
  optionSelected: {
    borderColor: colors.accent,
  },
  optionCorrect: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
    borderColor: '#00E676',
  },
  optionWrong: {
    backgroundColor: 'rgba(255, 45, 85, 0.2)',
    borderColor: '#FF2D55',
  },
  optionLetter: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.accent,
    marginRight: 10,
    width: 16,
  },
  optionText: {
    fontSize: 12,
    color: '#FFF',
    flex: 1,
  },
  resultBox: {
    marginTop: 10,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  correctText: {
    color: '#00E676',
  },
  wrongText: {
    color: '#FF2D55',
  },
});
