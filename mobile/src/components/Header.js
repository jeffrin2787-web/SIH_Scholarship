import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { useLanguage, LanguageSelector } from '../context/LanguageContext';

export default function Header({ title, subtitle, navigation, onNotificationPress, unreadCount = 0 }) {
  const { user, isOfficer } = useAuth();
  const { t } = useLanguage();

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.emblemContainer}>
          <View style={styles.emblemBadge}>
            <Text style={styles.emblemText}>🇮🇳 MoTA</Text>
          </View>
          <View>
            <Text style={styles.govtText}>{t('govtTitle', 'MINISTRY OF TRIBAL AFFAIRS')}</Text>
            <Text style={styles.subGovtText}>{t('subGovtTitle', 'Government of India')}</Text>
          </View>
        </View>

        {navigation && (
          <TouchableOpacity
            style={styles.notifButton}
            onPress={onNotificationPress || (() => navigation.navigate('Notifications'))}
          >
            <Text style={styles.notifIcon}>🔔</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.langRow}>
        <LanguageSelector variant="compact" />
      </View>

      <View style={styles.bottomRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.title}>{title || t('portalTitle', 'Unified Scholarship Portal')}</Text>
          {subtitle ? (
            <Text style={styles.subtitle}>{subtitle}</Text>
          ) : user ? (
            <Text style={styles.subtitle}>
              {isOfficer ? `${t('officerDesk', 'Officer Desk')}: ${user.name}` : `${t('otrPrefix', 'OTR')}: ${user.otrNumber} • ${user.name}`}
            </Text>
          ) : null}
        </View>

        {user && (
          <View style={[styles.roleBadge, isOfficer ? styles.officerBadge : styles.studentBadge]}>
            <Text style={[styles.roleText, isOfficer ? styles.officerRoleText : styles.studentRoleText]}>
              {user.role}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    paddingTop: 45,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  langRow: {
    marginBottom: 10
  },
  emblemContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  emblemBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8
  },
  emblemText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700'
  },
  govtText: {
    color: '#F1F5F9',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6
  },
  subGovtText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 9
  },
  notifButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  notifIcon: {
    fontSize: 16
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: colors.secondary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800'
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end'
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  studentBadge: {
    backgroundColor: 'rgba(255, 153, 51, 0.25)',
    borderWidth: 1,
    borderColor: colors.secondary
  },
  officerBadge: {
    backgroundColor: 'rgba(212, 175, 55, 0.25)',
    borderWidth: 1,
    borderColor: colors.gold
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700'
  },
  studentRoleText: {
    color: '#FFB86C'
  },
  officerRoleText: {
    color: '#FFE082'
  }
});
