import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function DbtCard({
  dbtStatus,
  sanctionedAmount = 0,
  disbursedAmount = 0,
  bankName,
  accountNumber,
  utrNumber,
  aadhaarSeeded = 1
}) {
  const isDisbursed = dbtStatus === 'CREDITED_TO_ACCOUNT' || disbursedAmount > 0;
  const isPending = !isDisbursed;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.icon}>🏦</Text>
          <View>
            <Text style={styles.title}>Direct Benefit Transfer (DBT)</Text>
            <Text style={styles.subtitle}>PFMS Electronic Payment Gateway</Text>
          </View>
        </View>

        <View style={[styles.badge, isDisbursed ? styles.badgeSuccess : styles.badgePending]}>
          <Text style={[styles.badgeText, isDisbursed ? styles.textSuccess : styles.textPending]}>
            {isDisbursed ? 'CREDITED' : 'IN PROCESS'}
          </Text>
        </View>
      </View>

      <View style={styles.amountsRow}>
        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>Sanctioned Amount</Text>
          <Text style={styles.amountValue}>₹{Number(sanctionedAmount).toLocaleString('en-IN')}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.amountBlock}>
          <Text style={styles.amountLabel}>Disbursed Amount</Text>
          <Text style={[styles.amountValue, isDisbursed && styles.amountDisbursed]}>
            ₹{Number(disbursedAmount).toLocaleString('en-IN')}
          </Text>
        </View>
      </View>

      <View style={styles.detailsBox}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Beneficiary Bank:</Text>
          <Text style={styles.detailValue}>{bankName || 'State Bank of India'}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Account Number:</Text>
          <Text style={styles.detailValue}>
            {accountNumber ? `•••• •••• ${accountNumber.slice(-4)}` : '•••• 9481'}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Aadhaar Seeding:</Text>
          <Text style={[styles.detailValue, aadhaarSeeded ? styles.seeded : styles.notSeeded]}>
            {aadhaarSeeded ? '✓ Active & NPCI Mapped' : '⚠ Link at Bank Branch'}
          </Text>
        </View>

        {utrNumber && (
          <View style={styles.utrRow}>
            <Text style={styles.utrLabel}>PFMS Bank UTR:</Text>
            <Text style={styles.utrValue}>{utrNumber}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  icon: {
    fontSize: 24,
    marginRight: 10
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text
  },
  subtitle: {
    fontSize: 11,
    color: colors.textSecondary
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8
  },
  badgeSuccess: {
    backgroundColor: colors.successLight
  },
  badgePending: {
    backgroundColor: colors.warningLight
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  textSuccess: {
    color: colors.success
  },
  textPending: {
    color: colors.warning
  },
  amountsRow: {
    flexDirection: 'row',
    backgroundColor: colors.borderLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  amountBlock: {
    flex: 1,
    alignItems: 'center'
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border
  },
  amountLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginBottom: 2
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  amountDisbursed: {
    color: colors.success
  },
  detailsBox: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: 8
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3
  },
  detailLabel: {
    fontSize: 11,
    color: colors.textSecondary
  },
  detailValue: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text
  },
  seeded: {
    color: colors.success
  },
  notSeeded: {
    color: colors.danger
  },
  utrRow: {
    backgroundColor: colors.goldLight,
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  utrLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A6D3B'
  },
  utrValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A6D3B'
  }
});
