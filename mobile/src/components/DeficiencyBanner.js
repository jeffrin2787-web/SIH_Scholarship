import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

export default function DeficiencyBanner({ deficiency, onActionPress }) {
  const { t } = useLanguage();
  if (!deficiency) return null;

  return (
    <View style={styles.banner}>
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>{deficiency.title || t('deficiencyHeader', 'Action Required on Application')}</Text>
        </View>
        <View style={styles.severityBadge}>
          <Text style={styles.severityText}>{deficiency.severity || 'WARNING'}</Text>
        </View>
      </View>

      <Text style={styles.message}>{deficiency.message}</Text>

      <View style={styles.footer}>
        <Text style={styles.schemeTag}>{deficiency.scheme_name || 'Post-Matric ST'}</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={onActionPress}>
          <Text style={styles.actionBtnText}>{t('resolveNow', 'Resolve Now')} →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    borderRadius: 12,
    padding: 14,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8
  },
  icon: {
    fontSize: 16,
    marginRight: 6
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    flex: 1
  },
  severityBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  severityText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#B45309'
  },
  message: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 17,
    marginBottom: 10
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  schemeTag: {
    fontSize: 10,
    color: '#92400E',
    fontWeight: '600'
  },
  actionBtn: {
    backgroundColor: colors.warning,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  }
});
