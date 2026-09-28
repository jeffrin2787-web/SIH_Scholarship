import React, { createContext, useContext, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LANGUAGES, translations } from '../locales/translations';
import { colors } from '../theme/colors';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const t = (key, fallback = '') => {
    const langDict = translations[language] || translations.en;
    if (langDict && langDict[key] !== undefined) {
      return langDict[key];
    }
    const enDict = translations.en;
    if (enDict && enDict[key] !== undefined) {
      return enDict[key];
    }
    return fallback || key;
  };

  const value = useMemo(() => ({
    language,
    setLanguage,
    t,
    languages: LANGUAGES,
    currentLangMeta: LANGUAGES.find((l) => l.code === language) || LANGUAGES[0]
  }), [language]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

/**
 * Reusable LanguageSelector component
 * Supports 'compact' (e.g. for Header) and 'full' (e.g. for Login or Profile)
 */
export function LanguageSelector({ variant = 'compact', style }) {
  const { language, setLanguage, languages } = useLanguage();

  if (variant === 'compact') {
    return (
      <View style={[styles.compactContainer, style]}>
        <Text style={styles.globeIcon}>🌐</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {languages.map((l) => {
            const isActive = l.code === language;
            return (
              <TouchableOpacity
                key={l.code}
                onPress={() => setLanguage(l.code)}
                style={[styles.compactChip, isActive && styles.compactChipActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.compactText, isActive && styles.compactTextActive]}>
                  {l.native}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.fullContainer, style]}>
      <View style={styles.fullHeader}>
        <Text style={styles.fullTitle}>🌐 Select Portal Language / भाषा चुनें</Text>
      </View>
      <View style={styles.fullGrid}>
        {languages.map((l) => {
          const isActive = l.code === language;
          return (
            <TouchableOpacity
              key={l.code}
              onPress={() => setLanguage(l.code)}
              style={[styles.fullChip, isActive && styles.fullChipActive]}
              activeOpacity={0.8}
            >
              <Text style={styles.chipFlag}>{l.flag}</Text>
              <Text style={[styles.chipNative, isActive && styles.chipNativeActive]}>
                {l.native}
              </Text>
              <Text style={[styles.chipLabel, isActive && styles.chipLabelActive]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    maxWidth: '100%'
  },
  scrollContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  globeIcon: {
    fontSize: 14,
    marginRight: 6
  },
  compactChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginHorizontal: 2
  },
  compactChipActive: {
    backgroundColor: colors.secondary,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2
  },
  compactText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600'
  },
  compactTextActive: {
    color: '#FFFFFF',
    fontWeight: '800'
  },

  fullContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6
  },
  fullHeader: {
    marginBottom: 10
  },
  fullTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary
  },
  fullGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  fullChip: {
    flexBasis: '31%',
    flexGrow: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0'
  },
  fullChipActive: {
    backgroundColor: '#FFF7ED',
    borderColor: colors.secondary,
    borderWidth: 1.5
  },
  chipFlag: {
    fontSize: 16,
    marginBottom: 2
  },
  chipNative: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155'
  },
  chipNativeActive: {
    color: colors.secondary
  },
  chipLabel: {
    fontSize: 10,
    color: '#64748B'
  },
  chipLabelActive: {
    color: colors.secondary
  }
});
