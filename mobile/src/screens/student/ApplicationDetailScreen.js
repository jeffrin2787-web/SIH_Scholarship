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
import api from '../../api/client';
import StageTimeline from '../../components/StageTimeline';
import DbtCard from '../../components/DbtCard';

export default function ApplicationDetailScreen({ route, navigation }) {
  const { applicationId } = route.params;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [applicationId]);

  const fetchDetail = async () => {
    try {
      const res = await api.get(`/applications/${applicationId}`);
      setData(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load application details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!data?.application) {
    return (
      <View style={styles.center}>
        <Text>Application record not found.</Text>
      </View>
    );
  }

  const { application: app, stages = [], deficiencies = [] } = data;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backText}>← Back to Dashboard</Text>
      </TouchableOpacity>

      <View style={styles.topCard}>
        <View style={styles.portalTag}>
          <Text style={styles.portalTagText}>{app.source_portal} Gateway</Text>
        </View>
        <Text style={styles.schemeName}>{app.scheme_name}</Text>
        <Text style={styles.appNo}>Application #{app.application_number}</Text>
        <Text style={styles.appliedDate}>Academic Session: {app.academic_year}</Text>
      </View>

      {/* STAGE TIMELINE */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Application Lifecycle Progress</Text>
        <StageTimeline
          currentStage={app.current_stage}
          isFlagged={app.current_stage === 'FLAGGED_DEFICIENCY'}
        />
      </View>

      {/* DETAILED CHRONOLOGICAL STAGE AUDIT TRAIL */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Detailed Verification Stages</Text>
        {stages.map((stage, idx) => {
          const isCompleted = stage.status === 'COMPLETED';
          const isCurrent = stage.status === 'CURRENT';
          const isFlagged = stage.status === 'FLAGGED';

          return (
            <View key={stage.id || idx} style={styles.stageItem}>
              <View style={styles.stageLeft}>
                <View
                  style={[
                    styles.stageDot,
                    isCompleted && styles.dotCompleted,
                    isCurrent && styles.dotCurrent,
                    isFlagged && styles.dotFlagged
                  ]}
                >
                  <Text style={styles.dotText}>
                    {isCompleted ? '✓' : isFlagged ? '!' : idx + 1}
                  </Text>
                </View>
                {idx < stages.length - 1 && <View style={styles.stageLine} />}
              </View>

              <View style={styles.stageRight}>
                <View style={styles.stageHeader}>
                  <Text style={styles.stageLabel}>{stage.stage_label}</Text>
                  <Text
                    style={[
                      styles.stageStatusBadge,
                      isCompleted && styles.statusCompleted,
                      isCurrent && styles.statusCurrent,
                      isFlagged && styles.statusFlagged
                    ]}
                  >
                    {stage.status}
                  </Text>
                </View>
                {stage.remarks && <Text style={styles.stageRemarks}>{stage.remarks}</Text>}
                {stage.officer_name && (
                  <Text style={styles.stageOfficer}>Official: {stage.officer_name}</Text>
                )}
                {stage.completed_at && (
                  <Text style={styles.stageDate}>Completed: {stage.completed_at}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* DEFICIENCIES SECTION IF ANY */}
      {deficiencies.length > 0 && (
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.warning }]}>
            Flagged Items & Deficiencies
          </Text>
          {deficiencies.map((def) => (
            <View key={def.id} style={styles.deficiencyBox}>
              <Text style={styles.defTitle}>{def.title}</Text>
              <Text style={styles.defMessage}>{def.message}</Text>
              <Text style={styles.defStatus}>
                Status: {def.is_resolved ? '✓ Resolved' : '⚠ Action Pending'}
              </Text>
              {!def.is_resolved && (
                <TouchableOpacity
                  style={styles.resolveBtn}
                  onPress={() => navigation.navigate('Wallet')}
                >
                  <Text style={styles.resolveBtnText}>Update via Document Wallet →</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* DBT PAYMENT CARD */}
      <DbtCard
        dbtStatus={app.dbt_status}
        sanctionedAmount={app.sanctioned_amount}
        disbursedAmount={app.disbursed_amount}
        bankName={app.bank_name}
        accountNumber={app.account_number}
        utrNumber={app.utr_number}
        aadhaarSeeded={app.aadhaar_seeded}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    padding: 16,
    paddingTop: 45,
    paddingBottom: 40
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backBtn: {
    marginBottom: 12
  },
  backText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700'
  },
  topCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14
  },
  portalTag: {
    backgroundColor: 'rgba(255, 153, 51, 0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6
  },
  portalTagText: {
    color: '#FFB86C',
    fontSize: 10,
    fontWeight: '800'
  },
  schemeName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  appNo: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 4
  },
  appliedDate: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12
  },
  stageItem: {
    flexDirection: 'row',
    marginBottom: 14
  },
  stageLeft: {
    alignItems: 'center',
    marginRight: 12,
    width: 28
  },
  stageDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border
  },
  dotCompleted: {
    backgroundColor: colors.success,
    borderColor: colors.success
  },
  dotCurrent: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary
  },
  dotFlagged: {
    backgroundColor: colors.warning,
    borderColor: colors.warning
  },
  dotText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF'
  },
  stageLine: {
    width: 2,
    flex: 1,
    backgroundColor: colors.border,
    marginVertical: 4
  },
  stageRight: {
    flex: 1,
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    padding: 10
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  stageLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    flex: 1
  },
  stageStatusBadge: {
    fontSize: 9,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  statusCompleted: {
    backgroundColor: colors.successLight,
    color: colors.success
  },
  statusCurrent: {
    backgroundColor: colors.infoLight,
    color: colors.info
  },
  statusFlagged: {
    backgroundColor: colors.warningLight,
    color: colors.warning
  },
  stageRemarks: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 4
  },
  stageOfficer: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '600'
  },
  stageDate: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2
  },
  deficiencyBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    marginBottom: 10
  },
  defTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E'
  },
  defMessage: {
    fontSize: 11,
    color: '#78350F',
    marginVertical: 4
  },
  defStatus: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B45309'
  },
  resolveBtn: {
    backgroundColor: colors.warning,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6
  },
  resolveBtnText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700'
  }
});
