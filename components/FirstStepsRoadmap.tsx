import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type FirstStepsRoadmapProps = {
  currentStep: 1 | 2 | 3;
  compact?: boolean;
};

const STEPS = [
  'Krok 1: podpisz kontrakt',
  'Krok 2: ustaw datę startu w liczniku',
  'Krok 3: ustaw zgody i preferencje w Ustawieniach',
] as const;

export function FirstStepsRoadmap({ currentStep, compact = false }: FirstStepsRoadmapProps) {
  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <Text style={[styles.title, compact && styles.titleCompact]}>Twoja droga startowa</Text>
      {STEPS.map((step, index) => {
        const stepNumber = (index + 1) as 1 | 2 | 3;
        const done = stepNumber < currentStep;
        const active = stepNumber === currentStep;
        return (
          <View key={step} style={[styles.row, compact && styles.rowCompact]}>
            <Text style={[styles.bullet, compact && styles.bulletCompact, done && styles.bulletDone, active && styles.bulletActive]}>
              {done ? '✓' : '•'}
            </Text>
            <Text
              style={[
                styles.stepText,
                compact && styles.stepTextCompact,
                done && styles.stepDone,
                active && styles.stepActive,
              ]}
            >
              {step}
            </Text>
          </View>
        );
      })}
      {!compact ? <Text style={styles.note}>Po kroku 3 odblokujesz pełny dostęp do wszystkich funkcji aplikacji.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    backgroundColor: 'rgba(12,38,62,0.78)',
    borderWidth: 1,
    borderColor: 'rgba(159,216,255,0.32)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  cardCompact: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  title: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
  },
  titleCompact: {
    fontSize: 14,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  rowCompact: {
    marginBottom: 2,
    gap: 6,
  },
  bullet: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 14,
    width: 14,
    textAlign: 'center',
  },
  bulletCompact: {
    fontSize: 12,
    width: 12,
  },
  bulletDone: {
    color: '#9EF3C7',
  },
  bulletActive: {
    color: '#9AC7FF',
  },
  stepText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
  stepTextCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  stepDone: {
    color: 'rgba(255,255,255,0.86)',
  },
  stepActive: {
    color: 'white',
    fontWeight: '700',
  },
  note: {
    marginTop: 4,
    color: 'rgba(232,245,255,0.84)',
    fontSize: 12,
    lineHeight: 17,
  },
});
