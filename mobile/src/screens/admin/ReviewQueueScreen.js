import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput
} from 'react-native';
import { colors } from '../../theme/colors';
import api from '../../api/client';
import Header from '../../components/Header';

export default function ReviewQueueScreen({ navigation }) {
  const [queue, setQueue] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await api.get('/admin/review-queue');
      setQueue(res.data.queue || []);
      setMetrics(res.data.metrics || null);
    } catch (err) {
      console.warn('Queue fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async (decision) => {
    if (!selectedItem) return;
    setActionLoading(true);

    try {
      await api.post(`/admin/review-queue/${selectedItem.id}/decision`, {
        decision,
        remarks: remarks || (decision === 'APPROVE' ? 'Discrepancy approved upon officer scrutiny.' : 'Clarification requested.')
      });

      Alert.alert(
        decision === 'APPROVE' ? 'Exception Approved! ✓' : 'Clarification Requested ⚠️',
        decision === 'APPROVE'
          ? `Application for ${selectedItem.student_name} has cleared verification and advanced to Sanction stage.`
          : `Deficiency request dispatched to ${selectedItem.student_name}.`
      );

      setSelectedItem(null);
      setRemarks('');
      fetchQueue();
    } catch (err) {
      Alert.alert('Error', 'Failed to record officer decision.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Header
        title="Officer Review Queue"
        subtitle="Exceptions & Data Mismatch Verification"
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* METRICS */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricNum}>{metrics?.pendingReview ?? 0}</Text>
            <Text style={styles.metricLabel}>Pending Scrutiny</Text>
          </View>
          <View style={[styles.metricCard, { borderColor: colors.success }]}>
            <Text style={[styles.metricNum, { color: colors.success }]}>
              {metrics?.resolvedReview ?? 0}
            </Text>
            <Text style={styles.metricLabel}>Approved Exceptions</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricNum}>90%</Text>
            <Text style={styles.metricLabel}>Auto-Verify Cutoff</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>
          Flagged Applications (Exceptions Routed for Human Review)
        </Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
        ) : queue.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyText}>Zero pending verification exceptions!</Text>
          </View>
        ) : (
          queue.map((item) => {
            const isPending = item.status === 'PENDING_MANUAL_REVIEW';

            return (
              <View
                key={item.id}
                style={[styles.card, !isPending && styles.cardResolved]}
              >
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.studentName}>{item.student_name}</Text>
                    <Text style={styles.otrText}>OTR: {item.otr_number}</Text>
                  </View>
                  <View
                    style={[
                      styles.scoreBadge,
                      item.overall_confidence >= 80 ? styles.scoreYellow : styles.scoreRed
                    ]}
                  >
                    <Text style={styles.scoreText}>
                      Match: {item.overall_confidence}%
                    </Text>
                  </View>
                </View>

                <View style={styles.schemeRow}>
                  <Text style={styles.schemeTag}>{item.scheme_name}</Text>
                  <Text style={styles.appRef}>Ref #{item.application_number}</Text>
                </View>

                {/* SIDE-BY-SIDE MISMATCH DIFF BOX */}
                <View style={styles.diffBox}>
                  <Text style={styles.diffFieldTitle}>
                    Discrepancy: {item.discrepancy_field}
                  </Text>
                  <Text style={styles.sourceTag}>Registry Source: {item.registry_source}</Text>

                  <View style={styles.diffRow}>
                    <View style={styles.diffColSubmitted}>
                      <Text style={styles.diffLabel}>Application Value:</Text>
                      <Text style={styles.diffValueSub}>{item.submitted_value}</Text>
                    </View>
                    <View style={styles.diffColRegistry}>
                      <Text style={styles.diffLabel}>Government Registry Value:</Text>
                      <Text style={styles.diffValueReg}>{item.registry_value}</Text>
                    </View>
                  </View>
                </View>

                {item.officer_remarks ? (
                  <Text style={styles.resolvedRemarks}>
                    Decision Remarks: {item.officer_remarks}
                  </Text>
                ) : null}

                {isPending && (
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => setSelectedItem(item)}
                  >
                    <Text style={styles.reviewBtnText}>Take Scrutiny Action →</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* OFFICER SCRUTINY DECISION MODAL */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Officer Scrutiny Determination</Text>
            <Text style={styles.modalSub}>
              Student: {selectedItem?.student_name} ({selectedItem?.scheme_name})
            </Text>

            <View style={styles.modalDiffBox}>
              <Text style={styles.modalDiffTitle}>
                Detected Variance: {selectedItem?.discrepancy_field}
              </Text>
              <Text style={styles.modalDiffSub}>
                Application: "{selectedItem?.submitted_value}" vs Registry: "{selectedItem?.registry_value}"
              </Text>
            </View>

            <Text style={styles.inputLabel}>Official Remarks / Endorsement Note:</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Identity confirmed via Aadhaar hash and college hall ticket."
              value={remarks}
              onChangeText={setRemarks}
              multiline
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={[styles.btn, styles.rejectBtn]}
                onPress={() => handleDecision('REQUEST_CLARIFICATION')}
                disabled={actionLoading}
              >
                <Text style={styles.rejectBtnText}>⚠ Request Clarification</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.approveBtn]}
                onPress={() => handleDecision('APPROVE')}
                disabled={actionLoading}
              >
                <Text style={styles.approveBtnText}>✓ Approve Exception</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setSelectedItem(null)}
            >
              <Text style={styles.cancelBtnText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    marginBottom: 16
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border
  },
  metricNum: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary
  },
  metricLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 2
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2
  },
  cardResolved: {
    opacity: 0.75,
    backgroundColor: '#F8FAFC'
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6
  },
  studentName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text
  },
  otrText: {
    fontSize: 11,
    color: colors.textSecondary
  },
  scoreBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  scoreYellow: {
    backgroundColor: colors.warningLight
  },
  scoreRed: {
    backgroundColor: colors.dangerLight
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.text
  },
  schemeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4
  },
  schemeTag: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700'
  },
  appRef: {
    fontSize: 10,
    color: colors.textMuted
  },
  diffBox: {
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    padding: 12,
    marginVertical: 10
  },
  diffFieldTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E'
  },
  sourceTag: {
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: 8
  },
  diffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  diffColSubmitted: {
    flex: 1,
    paddingRight: 6
  },
  diffColRegistry: {
    flex: 1,
    paddingLeft: 6,
    borderLeftWidth: 1,
    borderLeftColor: colors.border
  },
  diffLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    marginBottom: 2
  },
  diffValueSub: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text
  },
  diffValueReg: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  resolvedRemarks: {
    fontSize: 11,
    color: colors.success,
    fontStyle: 'italic',
    marginTop: 4
  },
  reviewBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8
  },
  reviewBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700'
  },
  empty: {
    padding: 30,
    alignItems: 'center'
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 12
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text
  },
  modalSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 12
  },
  modalDiffBox: {
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.warning,
    marginBottom: 12
  },
  modalDiffTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E'
  },
  modalDiffSub: {
    fontSize: 10,
    color: '#78350F',
    marginTop: 2
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4
  },
  input: {
    backgroundColor: colors.borderLight,
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    height: 70,
    textAlignVertical: 'top',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  rejectBtn: {
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warning,
    marginRight: 6
  },
  rejectBtnText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '700'
  },
  approveBtn: {
    backgroundColor: colors.success,
    marginLeft: 6
  },
  approveBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700'
  },
  cancelBtn: {
    alignItems: 'center',
    marginTop: 12
  },
  cancelBtnText: {
    fontSize: 11,
    color: colors.textMuted
  }
});
