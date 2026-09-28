import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { colors } from '../../theme/colors';
import { useAuth, DEMO_ACCOUNTS } from '../../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (idToUse, pwToUse) => {
    const id = idToUse || identifier;
    const pw = pwToUse || password;

    if (!id || !pw) {
      setError('Please enter your OTR Number/Email and Password.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await login(id, pw);
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (accountKey) => {
    const acc = DEMO_ACCOUNTS[accountKey];
    setIdentifier(acc.identifier);
    setPassword(acc.password);
    handleLogin(acc.identifier, acc.password);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerBox}>
        <View style={styles.emblemBadge}>
          <Text style={styles.emblemText}>🇮🇳 MoTA</Text>
        </View>
        <Text style={styles.title}>Ministry of Tribal Affairs</Text>
        <Text style={styles.subtitle}>Unified ST Scholarship & Fellowships Platform</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Student & Official Login</Text>
        <Text style={styles.cardSubtitle}>
          Sign in with your 14-digit OTR (One Time Registration) or Registered Email
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>OTR Number / Email / Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 20268839201941 or email"
            value={identifier}
            onChangeText={(t) => { setIdentifier(t); setError(''); }}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={(t) => { setPassword(t); setError(''); }}
            secureTextEntry
          />
        </View>

        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => handleLogin()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.loginBtnText}>Secure Sign In →</Text>
          )}
        </TouchableOpacity>

        <View style={styles.registerRow}>
          <Text style={styles.registerPrompt}>New ST Student without OTR? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Register for 14-Digit OTR</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* QUICK DEMO SWITCHER FOR EVALUATION */}
      <View style={styles.demoSection}>
        <Text style={styles.demoSectionTitle}>⚡ Quick Demo Switcher (Instant Evaluation)</Text>
        <Text style={styles.demoSectionSubtitle}>
          Tap any persona below to authenticate instantly with pre-seeded data:
        </Text>

        <TouchableOpacity
          style={styles.demoBtn}
          onPress={() => selectDemoAccount('SUNITA')}
        >
          <View style={styles.demoBtnHeader}>
            <Text style={styles.demoBtnTitle}>1. Sunita Soren (Active Post-Matric)</Text>
            <Text style={styles.demoBadge}>Student</Text>
          </View>
          <Text style={styles.demoBtnDesc}>{DEMO_ACCOUNTS.SUNITA.desc}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoBtn}
          onPress={() => selectDemoAccount('RAJESH')}
        >
          <View style={styles.demoBtnHeader}>
            <Text style={styles.demoBtnTitle}>2. Rajesh Munda (Disbursed Pre-Matric)</Text>
            <Text style={styles.demoBadge}>Student</Text>
          </View>
          <Text style={styles.demoBtnDesc}>{DEMO_ACCOUNTS.RAJESH.desc}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.demoBtn}
          onPress={() => selectDemoAccount('ANJALI')}
        >
          <View style={styles.demoBtnHeader}>
            <Text style={styles.demoBtnTitle}>3. Anjali Kerketta (NFST Fellowship)</Text>
            <Text style={styles.demoBadge}>Student</Text>
          </View>
          <Text style={styles.demoBtnDesc}>{DEMO_ACCOUNTS.ANJALI.desc}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.demoBtn, styles.demoOfficerBtn]}
          onPress={() => selectDemoAccount('OFFICER')}
        >
          <View style={styles.demoBtnHeader}>
            <Text style={[styles.demoBtnTitle, styles.demoOfficerTitle]}>
              4. Dr. R. C. Meena (Nodal Officer)
            </Text>
            <Text style={styles.officerBadge}>Officer Desk</Text>
          </View>
          <Text style={styles.demoBtnDesc}>{DEMO_ACCOUNTS.OFFICER.desc}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 50,
    backgroundColor: colors.background,
    minHeight: '100%'
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 24
  },
  emblemBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8
  },
  emblemText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800'
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text
  },
  cardSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 16
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600'
  },
  inputGroup: {
    marginBottom: 14
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6
  },
  input: {
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.border
  },
  loginBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16
  },
  registerPrompt: {
    fontSize: 12,
    color: colors.textSecondary
  },
  registerLink: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  demoSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  demoSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text
  },
  demoSectionSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 12
  },
  demoBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  demoOfficerBtn: {
    backgroundColor: colors.goldLight,
    borderColor: colors.gold
  },
  demoBtnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  demoBtnTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text
  },
  demoOfficerTitle: {
    color: '#8A6D3B'
  },
  demoBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: colors.primaryLighter,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  officerBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8A6D3B',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  demoBtnDesc: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 4
  }
});
