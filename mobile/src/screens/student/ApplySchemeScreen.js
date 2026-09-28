import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert
} from 'react-native';
import { colors } from '../../theme/colors';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/client';
import Header from '../../components/Header';

export default function ApplySchemeScreen({ navigation }) {
  const { t } = useLanguage();
  const [schemes, setSchemes] = useState([]);
  const [activeApp, setActiveApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [schemesRes, appsRes] = await Promise.all([
        api.get('/schemes'),
        api.get('/applications/my-applications')
      ]);

      setSchemes(schemesRes.data.schemes || []);
      const active = (appsRes.data.applications || []).find(
        (a) => a.currentStage !== 'DISBURSED'
      );
      setActiveApp(active || null);
    } catch (err) {
      console.warn('Apply screen load error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (scheme) => {
    if (activeApp) {
      Alert.alert(
        t('activeWarningTitle', 'One Scheme Restriction (MoTA Rule)'),
        `${t('activeWarningText', 'Ministry guidelines prohibit holding multiple active scholarship applications concurrently.')}\n\n• ${activeApp.schemeName}\n• ${t('currentStage', 'Current Stage')}: ${activeApp.currentStage.replace(/_/g, ' ')}`,
        [{ text: t('back', 'Return') }]
      );
      return;
    }

    Alert.alert(
      `${t('applyForScheme', 'Apply for')} ${scheme.name}?`,
      `Your verified documents from DigiLocker will be automatically attached and verified.\n\nProceed with submission?`,
      [
        { text: t('cancel', 'Cancel'), style: 'cancel' },
        {
          text: t('applyForScheme', 'Submit Application'),
          onPress: async () => {
            setSubmitting(true);
            try {
              const res = await api.post('/applications/apply', {
                schemeId: scheme.id,
                academicYear: '2025-2026'
              });

              Alert.alert(
                'Application Submitted! 🎉',
                `Application Reference: ${res.data.applicationNumber}\n\nConfidence Score: ${res.data.verification.overallConfidence}%\nStatus: ${res.data.verification.isAutoVerified ? 'Auto-Verified' : 'Routed to Nodal Scrutiny'}`,
                [{ text: 'Go to Dashboard', onPress: () => navigation.navigate('Dashboard') }]
              );
            } catch (err) {
              const msg = err.response?.data?.message || err.message || 'Application failed';
              Alert.alert('Notice', msg);
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <Header title={t('schemesTitle', 'Apply for Scholarships')} subtitle={t('schemesSubtitle', 'Choose from 5 MoTA ST Schemes')} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* ONE-SCHEME RESTRICTION ADVISORY */}
        {activeApp && (
          <View style={styles.restrictionBanner}>
            <Text style={styles.restrictionIcon}>ℹ️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.restrictionTitle}>{t('activeWarningTitle', 'Active Application in Progress')}</Text>
              <Text style={styles.restrictionText}>
                {t('activeWarningText', 'Under MoTA rules, ST students can only avail one scholarship per academic term.')}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.heading}>{t('schemesTitle', 'Available Scholarship Schemes (5 Portals Unified)')}</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          schemes.map((scheme) => {
            const isCurrentScheme = activeApp?.schemeId === scheme.id;

            return (
              <View
                key={scheme.id}
                style={[styles.schemeCard, isCurrentScheme && styles.schemeCardActive]}
              >
                <View style={styles.schemeHeader}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.portalBadge}>{scheme.source_portal} Gateway</Text>
                    {isCurrentScheme && (
                      <Text style={styles.activeTag}>● {t('alreadyActive', 'Currently Active')}</Text>
                    )}
                  </View>
                  <Text style={styles.schemeName}>{scheme.name}</Text>
                  <Text style={styles.audience}>Target: {scheme.target_audience}</Text>
                </View>

                <Text style={styles.desc}>{scheme.description}</Text>

                <View style={styles.infoBox}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t('incomeLimit', 'Income Ceiling')}:</Text>
                    <Text style={styles.infoVal}>
                      {scheme.income_ceiling
                        ? `₹${scheme.income_ceiling.toLocaleString('en-IN')}/year`
                        : t('noIncomeLimit', 'No Family Income Ceiling')}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Key Benefits:</Text>
                    <Text style={styles.infoVal}>{scheme.benefits_summary}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Document Reusability:</Text>
                    <Text style={[styles.infoVal, { color: colors.success }]}>
                      {t('reusableBadge', '✓ 100% Reused from DigiLocker Wallet')}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.applyBtn,
                    (activeApp || submitting) && styles.applyBtnDisabled
                  ]}
                  disabled={submitting}
                  onPress={() => handleApply(scheme)}
                >
                  <Text style={styles.applyBtnText}>
                    {isCurrentScheme
                      ? `${t('alreadyActive', 'Already Applied')} (Dashboard)`
                      : activeApp
                      ? `${t('alreadyActive', 'Unavailable (Active Scheme Exists)')}`
                      : `${t('applyForScheme', 'Apply with 1-Click OTR')} →`}
                  </Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 16,
    paddingBottom: 40
  },
  restrictionBanner: {
    backgroundColor: '#EFF6FF',
    borderColor: '#93C5FD',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  restrictionIcon: {
    fontSize: 18,
    marginRight: 8,
    marginTop: 2
  },
  restrictionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF'
  },
  restrictionText: {
    fontSize: 11,
    color: '#1E3A8A',
    lineHeight: 16,
    marginTop: 2
  },
  heading: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12
  },
  schemeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2
  },
  schemeCardActive: {
    borderColor: colors.primary,
    borderWidth: 2
  },
  schemeHeader: {
    marginBottom: 8
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  portalBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.secondaryDark,
    backgroundColor: colors.secondaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  activeTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.success
  },
  schemeName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text
  },
  audience: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  desc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
    marginBottom: 10
  },
  infoBox: {
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3
  },
  infoLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  infoVal: {
    fontSize: 10,
    color: colors.text,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
    marginLeft: 8
  },
  applyBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  applyBtnDisabled: {
    backgroundColor: colors.textMuted
  },
  applyBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700'
  }
});
