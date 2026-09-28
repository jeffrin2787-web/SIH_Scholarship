import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator
} from 'react-native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import api from '../../api/client';
import Header from '../../components/Header';
import StageTimeline from '../../components/StageTimeline';
import DbtCard from '../../components/DbtCard';
import DeficiencyBanner from '../../components/DeficiencyBanner';

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      const [appsRes, notifsRes] = await Promise.all([
        api.get('/applications/my-applications'),
        api.get('/notifications')
      ]);

      setApplications(appsRes.data.applications || []);
      setSummary(appsRes.data.summary || null);
      setNotifications(notifsRes.data.notifications || []);
    } catch (err) {
      console.warn('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const unreadNotifs = notifications.filter(n => !n.is_read).length;

  // Extract any unresolved deficiencies
  const allDeficiencies = applications.flatMap(a => a.deficiencies || []);
  const activeDeficiency = allDeficiencies.find(d => !d.is_resolved);

  return (
    <View style={styles.screen}>
      <Header
        title={t('dashTitle', 'Unified ST Dashboard')}
        subtitle={`${t('otrPrefix', 'OTR')}: ${user?.otrNumber || '20268839201941'}`}
        navigation={navigation}
        unreadCount={unreadNotifs}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* DEFICIENCY BANNER IF ACTIVE */}
        {activeDeficiency && (
          <DeficiencyBanner
            deficiency={activeDeficiency}
            onActionPress={() => navigation.navigate('Wallet')}
          />
        )}

        {/* METRICS ROW */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>{t('totalSanctioned', 'Total Sanctioned')}</Text>
            <Text style={styles.metricValue}>
              ₹{Number(summary?.totalSanctionedAmount || 0).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.metricSub}>{t('acrossSchemes', 'Across all 5 schemes')}</Text>
          </View>

          <View style={[styles.metricCard, styles.metricCardGreen]}>
            <Text style={styles.metricLabel}>{t('totalDisbursed', 'Total DBT Disbursed')}</Text>
            <Text style={[styles.metricValue, { color: colors.success }]}>
              ₹{Number(summary?.totalDisbursedAmount || 0).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.metricSub}>{t('directToBank', 'Direct to bank account')}</Text>
          </View>
        </View>

        {/* QUICK ACCESS ACTIONS */}
        <View style={styles.actionsBar}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Apply')}
          >
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionText}>{t('applyScheme', 'Apply Scheme')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Text style={styles.actionIcon}>📁</Text>
            <Text style={styles.actionText}>{t('walletBtn', 'DigiLocker Wallet')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.jagoActionBtn]}
            onPress={() => navigation.navigate('JAGO')}
          >
            <Text style={styles.actionIcon}>🤖</Text>
            <Text style={[styles.actionText, { color: '#FFF' }]}>{t('askJago', 'Ask JAGO AI')}</Text>
          </TouchableOpacity>
        </View>

        {/* APPLICATIONS SECTION */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t('trackApps', 'Track Applications (Unified 5 Schemes)')}</Text>
          <Text style={styles.sectionBadge}>
            {applications.length} {t('activeRecords', 'Active Record(s)')}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 30 }} />
        ) : applications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📂</Text>
            <Text style={styles.emptyTitle}>{t('noAppsFound', 'No Scholarship Applications Found')}</Text>
            <Text style={styles.emptyText}>
              {t('noAppsSub', "You have not submitted an application for this academic session yet.")}
            </Text>
            <TouchableOpacity
              style={styles.emptyApplyBtn}
              onPress={() => navigation.navigate('Apply')}
            >
              <Text style={styles.emptyApplyBtnText}>{t('applyNowBtn', 'Apply for Scholarship Now')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          applications.map((app) => (
            <TouchableOpacity
              key={app.id}
              style={styles.appCard}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('ApplicationDetail', { applicationId: app.id })}
            >
              <View style={styles.appHeader}>
                <View style={styles.schemeTagBox}>
                  <Text style={styles.portalTag}>{app.sourcePortal} Portal</Text>
                  <Text style={styles.schemeTitle}>{app.schemeName}</Text>
                  <Text style={styles.appNum}>Ref #{app.applicationNumber}</Text>
                </View>

                <View style={styles.amountBox}>
                  <Text style={styles.amountTag}>{t('sanctionedTag', 'Sanctioned')}</Text>
                  <Text style={styles.sanctionAmt}>
                    ₹{Number(app.sanctionedAmount).toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* 5-STAGE CHRONOLOGICAL TIMELINE */}
              <StageTimeline
                currentStage={app.currentStage}
                isFlagged={app.currentStage === 'FLAGGED_DEFICIENCY'}
              />

              {/* DBT DISBURSEMENT SUMMARY */}
              <DbtCard
                dbtStatus={app.dbtStatus}
                sanctionedAmount={app.sanctionedAmount}
                disbursedAmount={app.disbursedAmount}
                bankName={user?.bankName}
                accountNumber={user?.accountNumber}
                utrNumber={app.utrNumber}
                aadhaarSeeded={user?.aadhaarSeeded}
              />

              <View style={styles.cardFooter}>
                <Text style={styles.footerStageText}>
                  {t('currentStage', 'Current Stage')}: <Text style={styles.footerStageBold}>{app.currentStage.replace(/_/g, ' ')}</Text>
                </Text>
                <Text style={styles.viewTimelineText}>{t('viewTimeline', 'View Detailed Timeline →')}</Text>
              </View>
            </TouchableOpacity>
          ))
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
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2
  },
  metricCardGreen: {
    marginRight: 0,
    marginLeft: 8
  },
  metricLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 4
  },
  metricSub: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2
  },
  actionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 1
  },
  jagoActionBtn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  actionIcon: {
    fontSize: 18,
    marginBottom: 2
  },
  actionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text
  },
  sectionBadge: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
    backgroundColor: colors.borderLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6
  },
  appCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  },
  appHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  schemeTagBox: {
    flex: 1,
    paddingRight: 8
  },
  portalTag: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.secondaryDark,
    backgroundColor: colors.secondaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4
  },
  schemeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text
  },
  appNum: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2
  },
  amountBox: {
    alignItems: 'flex-end'
  },
  amountTag: {
    fontSize: 9,
    color: colors.textSecondary
  },
  sanctionAmt: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.primary
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 10,
    marginTop: 8
  },
  footerStageText: {
    fontSize: 11,
    color: colors.textSecondary
  },
  footerStageBold: {
    fontWeight: '700',
    color: colors.primary
  },
  viewTimelineText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 10
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text
  },
  emptyText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginVertical: 8
  },
  emptyApplyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 6
  },
  emptyApplyBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700'
  }
});
