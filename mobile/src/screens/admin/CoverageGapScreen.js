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
import Header from '../../components/Header';

export default function CoverageGapScreen() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    fetchCoverageGaps();
  }, []);

  const fetchCoverageGaps = async () => {
    try {
      const res = await api.get('/admin/coverage-gaps');
      setData(res.data);
    } catch (err) {
      console.warn('Coverage gap error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = async () => {
    setBroadcasting(true);
    try {
      const res = await api.post('/admin/outreach-broadcast');
      Alert.alert(
        'Outreach Broadcast Dispatched! 📢',
        `Proactive SMS and JAGO Chatbot notifications dispatched to ${res.data.broadcastCount} unreached eligible ST students across Jharkhand, Chhattisgarh, and MP.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to dispatch outreach broadcast.');
    } finally {
      setBroadcasting(false);
    }
  };

  const metrics = data?.metrics;
  const districtList = data?.districtBreakdown || [];
  const unreachedList = data?.unreachedStudents || [];

  return (
    <View style={styles.screen}>
      <Header
        title="Coverage Gap Analytics"
        subtitle="UDISE+ & AISHE vs Active Scholarship Claims"
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* KPI SUMMARY CARDS */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <Text style={styles.kpiNum}>{metrics?.totalEnrolledST ?? 0}</Text>
            <Text style={styles.kpiLabel}>Enrolled ST Students</Text>
            <Text style={styles.kpiSub}>UDISE+ & AISHE Records</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: colors.success }]}>
            <Text style={[styles.kpiNum, { color: colors.success }]}>
              {metrics?.availingScholarship ?? 0}
            </Text>
            <Text style={styles.kpiLabel}>Availing Scholarship</Text>
            <Text style={styles.kpiSub}>Active OTR Claims</Text>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          <View style={[styles.kpiCard, { borderColor: colors.warning }]}>
            <Text style={[styles.kpiNum, { color: colors.warning }]}>
              {metrics?.unreachedEligibleST ?? 0}
            </Text>
            <Text style={styles.kpiLabel}>Unreached Beneficiaries</Text>
            <Text style={styles.kpiSub}>Eligible Non-Applicants</Text>
          </View>

          <View style={[styles.kpiCard, { borderColor: colors.primary }]}>
            <Text style={[styles.kpiNum, { color: colors.primary }]}>
              {metrics?.coveragePercentage ?? '0%'}
            </Text>
            <Text style={styles.kpiLabel}>Current Coverage</Text>
            <Text style={styles.kpiSub}>Ministry Saturation Rate</Text>
          </View>
        </View>

        {/* PROACTIVE BROADCAST ACTION */}
        <View style={styles.actionCard}>
          <Text style={styles.actionTitle}>Proactive Beneficiary Outreach</Text>
          <Text style={styles.actionDesc}>
            Auto-generate and dispatch personalized SMS and JAGO nudges with 1-click OTR application links to all {metrics?.unreachedEligibleST ?? 0} unreached ST students.
          </Text>

          <TouchableOpacity
            style={styles.broadcastBtn}
            onPress={handleBroadcast}
            disabled={broadcasting}
          >
            {broadcasting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.broadcastBtnText}>
                📢 Trigger Multi-Channel Outreach Broadcast
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* DISTRICT BREAKDOWN */}
        <Text style={styles.sectionTitle}>District-Wise Saturation Gap</Text>
        {districtList.map((d, idx) => (
          <View key={idx} style={styles.districtCard}>
            <View style={styles.districtRow}>
              <Text style={styles.districtName}>{d.district}, {d.state}</Text>
              <Text style={styles.gapCount}>{d.unreached_count} Unreached</Text>
            </View>
            <Text style={styles.districtSchemes}>
              Eligible Schemes: {d.eligible_schemes?.replace(/,/g, ', ')}
            </Text>
          </View>
        ))}

        {/* UNREACHED ROSTER */}
        <Text style={[styles.sectionTitle, { marginTop: 16 }]}>
          Sample Unreached ST Students Roster
        </Text>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 20 }} />
        ) : (
          unreachedList.map((s) => (
            <View key={s.id} style={styles.studentCard}>
              <View style={styles.studentRow}>
                <Text style={styles.studentName}>{s.student_name}</Text>
                <Text style={styles.apaarBadge}>APAAR: {s.apaar_id}</Text>
              </View>
              <Text style={styles.studentInst}>{s.institution_name}</Text>
              <View style={styles.studentFooter}>
                <Text style={styles.studentLocation}>{s.district} • {s.caste_category}</Text>
                <Text style={styles.targetScheme}>Eligible for: {s.eligible_scheme}</Text>
              </View>
            </View>
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
  kpiGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2
  },
  kpiNum: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.text,
    marginTop: 2
  },
  kpiSub: {
    fontSize: 8,
    color: colors.textMuted
  },
  actionCard: {
    backgroundColor: '#0F2C24',
    borderRadius: 14,
    padding: 16,
    marginVertical: 12
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  actionDesc: {
    fontSize: 11,
    color: '#A7F3D0',
    lineHeight: 16,
    marginVertical: 8
  },
  broadcastBtn: {
    backgroundColor: colors.secondary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4
  },
  broadcastBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800'
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8
  },
  districtCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  districtRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  districtName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text
  },
  gapCount: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.warning
  },
  districtSchemes: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border
  },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  studentName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text
  },
  apaarBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  studentInst: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  studentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 4
  },
  studentLocation: {
    fontSize: 9,
    color: colors.textMuted
  },
  targetScheme: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondaryDark
  }
});
