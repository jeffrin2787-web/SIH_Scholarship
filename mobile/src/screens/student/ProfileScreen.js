import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform
} from 'react-native';
import { colors } from '../../theme/colors';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, LanguageSelector } from '../../context/LanguageContext';
import Header from '../../components/Header';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const handleLogout = () => {
    const confirmMsg = t('signOutConfirm', 'Are you sure you want to sign out?');
    if (Platform.OS === 'web') {
      const confirmed = typeof window !== 'undefined' ? window.confirm(confirmMsg) : true;
      if (confirmed) {
        logout();
      }
    } else {
      Alert.alert(t('signOut', 'Sign Out'), confirmMsg, [
        { text: t('cancel', 'Cancel'), style: 'cancel' },
        { text: t('signOut', 'Sign Out'), style: 'destructive', onPress: logout }
      ]);
    }
  };

  return (
    <View style={styles.screen}>
      <Header title={t('profileTitle', 'Student Profile')} subtitle={t('profileSubtitle', 'Universal Academic Identity')} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* OTR IDENTITY CARD */}
        <View style={styles.idCard}>
          <View style={styles.idHeader}>
            <View style={styles.emblemBadge}>
              <Text style={styles.emblemText}>🇮🇳 MoTA</Text>
            </View>
            <Text style={styles.cardHeaderTitle}>{t('otrCardHeader', 'ONE-TIME REGISTRATION (OTR)')}</Text>
          </View>

          <Text style={styles.studentName}>{user?.name || 'ST Student'}</Text>
          <Text style={styles.otrNum}>{t('otrPrefix', 'OTR')}: {user?.otrNumber || '20268839201941'}</Text>

          <View style={styles.idGrid}>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t('categoryLabel', 'Category')}:</Text>
              <Text style={styles.gridVal}>
                {user?.casteCategory || 'ST'} ({user?.subTribe || 'Santhal'})
              </Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t('pvtgLabel', 'PVTG Status')}:</Text>
              <Text style={styles.gridVal}>{user?.pvtgStatus ? 'Yes (Birhor)' : 'No'}</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t('aadhaarLabel', 'Aadhaar ID')}:</Text>
              <Text style={styles.gridVal}>•••• •••• 9021</Text>
            </View>
            <View style={styles.gridItem}>
              <Text style={styles.gridLabel}>{t('annualIncomeLabel', 'Annual Income')}:</Text>
              <Text style={styles.gridVal}>
                ₹{Number(user?.annualIncome || 140000).toLocaleString('en-IN')}
              </Text>
            </View>
          </View>
        </View>

        {/* INSTITUTION DETAILS */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('academicDetails', 'Academic Enrollment Details')}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>{t('institutionLabel', 'Institution')}:</Text>
            <Text style={styles.val}>{user?.institutionName || 'Ranchi University'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>{t('courseLabel', 'Course / Degree')}:</Text>
            <Text style={styles.val}>{user?.courseName || 'Higher Education'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>{t('registryStatusLabel', 'Registry Status')}:</Text>
            <Text style={[styles.val, { color: colors.success }]}>{t('verifiedAishe', '✓ Active & Verified (AISHE)')}</Text>
          </View>
        </View>

        {/* DBT BANK REPOSITORY */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('dbtRepoTitle', 'Direct Benefit Transfer (DBT) Bank Account')}</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>{t('dbtBank', 'Beneficiary Bank')}:</Text>
            <Text style={styles.val}>{user?.bankName || 'State Bank of India'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>{t('dbtAccNo', 'Account Number')}:</Text>
            <Text style={styles.val}>
              {user?.accountNumber ? `•••• •••• ${user.accountNumber.slice(-4)}` : '•••• 9481'}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Aadhaar NPCI Seeding:</Text>
            <Text style={[styles.val, { color: colors.success }]}>
              {user?.aadhaarSeeded ? `✓ ${t('dbtAadhaarLinked', 'Mapped for Direct DBT Credit')}` : '⚠ Link at Bank'}
            </Text>
          </View>
        </View>

        {/* LANGUAGE PREFERENCE SELECTOR CARD */}
        <LanguageSelector variant="full" />

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>{t('signOut', 'Sign Out')}</Text>
        </TouchableOpacity>
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
  idCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 3
  },
  idHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  emblemBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8
  },
  emblemText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800'
  },
  cardHeaderTitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  studentName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  otrNum: {
    fontSize: 13,
    color: '#FFB86C',
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 14
  },
  idGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingTop: 10
  },
  gridItem: {
    width: '50%',
    marginVertical: 4
  },
  gridLabel: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)'
  },
  gridVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 1
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight
  },
  label: {
    fontSize: 11,
    color: colors.textSecondary
  },
  val: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text
  },
  logoutBtn: {
    backgroundColor: colors.dangerLight,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FECACA'
  },
  logoutBtnText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700'
  }
});
