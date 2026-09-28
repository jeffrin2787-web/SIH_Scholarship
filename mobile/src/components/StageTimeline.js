import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

const STAGES = [
  { key: 'SUBMITTED', label: 'Submitted' },
  { key: 'INSTITUTE_VERIFIED', label: 'Institute' },
  { key: 'DISTRICT_VERIFIED', label: 'District' },
  { key: 'STATE_SANCTIONED', label: 'Sanction' },
  { key: 'DISBURSED', label: 'DBT Credit' }
];

export default function StageTimeline({ currentStage, isFlagged = false }) {
  const getStageIndex = (stage) => {
    switch (stage) {
      case 'SUBMITTED': return 0;
      case 'INSTITUTE_VERIFIED': return 1;
      case 'DISTRICT_VERIFIED': return 2;
      case 'STATE_SANCTIONED': return 3;
      case 'DISBURSED': return 4;
      case 'FLAGGED_DEFICIENCY': return 2;
      default: return 0;
    }
  };

  const activeIndex = getStageIndex(currentStage);

  return (
    <View style={styles.container}>
      <View style={styles.stepsContainer}>
        {STAGES.map((stage, idx) => {
          const isCompleted = idx < activeIndex;
          const isCurrent = idx === activeIndex;
          const isFlaggedHere = isCurrent && isFlagged;

          let circleStyle = styles.circlePending;
          let textStyle = styles.textPending;
          let label = idx + 1;

          if (isCompleted) {
            circleStyle = styles.circleCompleted;
            textStyle = styles.textCompleted;
            label = '✓';
          } else if (isFlaggedHere) {
            circleStyle = styles.circleFlagged;
            textStyle = styles.textFlagged;
            label = '!';
          } else if (isCurrent) {
            circleStyle = styles.circleCurrent;
            textStyle = styles.textCurrent;
          }

          return (
            <React.Fragment key={stage.key}>
              <View style={styles.stepItem}>
                <View style={[styles.circle, circleStyle]}>
                  <Text style={[styles.circleText, textStyle]}>{label}</Text>
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    isCurrent && styles.stepLabelActive,
                    isCompleted && styles.stepLabelCompleted,
                    isFlaggedHere && styles.stepLabelFlagged
                  ]}
                  numberOfLines={1}
                >
                  {stage.label}
                </Text>
              </View>

              {idx < STAGES.length - 1 && (
                <View
                  style={[
                    styles.line,
                    idx < activeIndex ? styles.lineCompleted : styles.linePending
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    paddingHorizontal: 4
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  stepItem: {
    alignItems: 'center',
    width: 58
  },
  circle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 2
  },
  circleCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  circleCurrent: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary,
    borderWidth: 3
  },
  circleFlagged: {
    backgroundColor: colors.warning,
    borderColor: colors.warning
  },
  circlePending: {
    backgroundColor: colors.borderLight,
    borderColor: colors.border
  },
  circleText: {
    fontSize: 11,
    fontWeight: '700'
  },
  textCompleted: {
    color: '#FFF'
  },
  textCurrent: {
    color: colors.primary
  },
  textFlagged: {
    color: '#FFF'
  },
  textPending: {
    color: colors.textMuted
  },
  stepLabel: {
    fontSize: 9,
    color: colors.textMuted,
    textAlign: 'center',
    fontWeight: '500'
  },
  stepLabelActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  stepLabelCompleted: {
    color: colors.success,
    fontWeight: '600'
  },
  stepLabelFlagged: {
    color: colors.warning,
    fontWeight: '700'
  },
  line: {
    flex: 1,
    height: 2,
    marginTop: -16
  },
  lineCompleted: {
    backgroundColor: colors.success
  },
  linePending: {
    backgroundColor: colors.border
  }
});
