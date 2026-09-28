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
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    aadhaarNumber: '',
    casteCategory: 'ST',
    subTribe: '',
    isPvtg: 0,
    annualIncome: '',
    institutionName: '',
    courseName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleRegister = async () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('Please fill in all required fields (Name, Email, Phone, Password).');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await register(formData);
      Alert.alert(
        'OTR Generated Successfully! 🎉',
        `Your 14-Digit One Time Registration number is:\n\n${res.user.otrNumber}\n\nThis ID links your records across all 5 MoTA scholarship schemes.`,
        [{ text: 'Continue to Dashboard' }]
      );
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>← Back to Login</Text>
        </TouchableOpacity>
        <Text style={styles.title}>ST Student OTR Registration</Text>
        <Text style={styles.subtitle}>
          Creates your unified 14-digit academic identity for all 5 MoTA scholarships
        </Text>
      </View>

      <View style={styles.formCard}>
        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>⚠ {error}</Text>
          </View>
        ) : null}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name (as per Aadhaar) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Birsa Soren"
            value={formData.name}
            onChangeText={(t) => handleChange('name', t)}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Email Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="name@example.com"
              value={formData.email}
              onChangeText={(t) => handleChange('email', t)}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Mobile Number *</Text>
            <TextInput
              style={styles.input}
              placeholder="9876543210"
              value={formData.phone}
              onChangeText={(t) => handleChange('phone', t)}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Aadhaar Number (Last 4 Digits or Virtual ID)</Text>
          <TextInput
            style={styles.input}
            placeholder="XXXX XXXX 1234"
            value={formData.aadhaarNumber}
            onChangeText={(t) => handleChange('aadhaarNumber', t)}
            keyboardType="number-pad"
            maxLength={12}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password *</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a secure password"
            value={formData.password}
            onChangeText={(t) => handleChange('password', t)}
            secureTextEntry
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Sub-Tribe / Community</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Santhal, Munda, Gond"
              value={formData.subTribe}
              onChangeText={(t) => handleChange('subTribe', t)}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Annual Income (₹)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 150000"
              value={formData.annualIncome}
              onChangeText={(t) => handleChange('annualIncome', t)}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Educational Institution Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Ranchi University / EMRS School"
            value={formData.institutionName}
            onChangeText={(t) => handleChange('institutionName', t)}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Course / Class Enrolled</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Class XI or B.Tech or Ph.D."
            value={formData.courseName}
            onChangeText={(t) => handleChange('courseName', t)}
          />
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Generate 14-Digit OTR & Register →</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 45,
    backgroundColor: colors.background
  },
  header: {
    marginBottom: 20
  },
  backBtn: {
    marginBottom: 12
  },
  backBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700'
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 2
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    padding: 10,
    borderRadius: 8,
    marginBottom: 14
  },
  errorText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '600'
  },
  inputGroup: {
    marginBottom: 14
  },
  row: {
    flexDirection: 'row'
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6
  },
  input: {
    backgroundColor: colors.borderLight,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    borderWidth: 1,
    borderColor: colors.border
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
