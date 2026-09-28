import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { colors } from '../theme/colors';

export default function DocumentCard({ document, onActionPress }) {
  const isVerified = !!document.is_digilocker_verified;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconContainer}>
          <Text style={styles.fileIcon}>📄</Text>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{document.title}</Text>
          <Text style={styles.issuer}>{document.issuer}</Text>
        </View>

        {isVerified ? (
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ DigiLocker Verified</Text>
          </View>
        ) : (
          <View style={styles.uploadedBadge}>
            <Text style={styles.uploadedText}>📤 Self-Uploaded (Pending Scrutiny)</Text>
          </View>
        )}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Issued: {document.issue_date || 'N/A'}</Text>
        <View style={styles.reusableBadge}>
          <Text style={styles.reusableText}>♻ Reusable for 5 Schemes</Text>
        </View>
      </View>

      {document.digital_signature_hash && (
        <View style={styles.signatureBox}>
          <Text style={styles.sigLabel}>Digital Signature Hash:</Text>
          <Text style={styles.sigValue} numberOfLines={1}>
            {document.digital_signature_hash}
          </Text>
        </View>
      )}

      {onActionPress && (
        <TouchableOpacity style={styles.btn} onPress={onActionPress}>
          <Text style={styles.btnText}>Use in Scholarship Application</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.primaryLighter,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  fileIcon: {
    fontSize: 18
  },
  titleContainer: {
    flex: 1
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text
  },
  issuer: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2
  },
  verifiedBadge: {
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  verifiedText: {
    color: '#065F46',
    fontSize: 9,
    fontWeight: '700'
  },
  uploadedBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  uploadedText: {
    color: '#1D4ED8',
    fontSize: 9,
    fontWeight: '700'
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4
  },
  metaText: {
    fontSize: 10,
    color: colors.textSecondary
  },
  reusableBadge: {
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  reusableText: {
    fontSize: 9,
    color: colors.primary,
    fontWeight: '700'
  },
  signatureBox: {
    backgroundColor: colors.borderLight,
    padding: 6,
    borderRadius: 6,
    marginTop: 6
  },
  sigLabel: {
    fontSize: 8,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  sigValue: {
    fontSize: 8,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: colors.textSecondary
  },
  btn: {
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  }
});
