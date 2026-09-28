import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { colors } from '../../theme/colors';
import api from '../../api/client';
import Header from '../../components/Header';

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.warn('Fetch notifs error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.warn('Mark read error:', err.message);
    }
  };

  return (
    <View style={styles.screen}>
      <Header title="Alerts & Milestones" subtitle="Application Updates & MoTA Notices" />

      <View style={styles.topBar}>
        <Text style={styles.title}>Recent Activity</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markRead}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 30 }} />
        ) : notifications.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No notifications at this time.</Text>
          </View>
        ) : (
          notifications.map((n) => (
            <View
              key={n.id}
              style={[styles.card, !n.is_read && styles.cardUnread]}
            >
              <View style={styles.row}>
                <Text style={styles.icon}>
                  {n.type === 'DISBURSEMENT' ? '💰' : n.type === 'DEFICIENCY' ? '⚠️' : '📢'}
                </Text>
                <View style={styles.textBox}>
                  <Text style={styles.cardTitle}>{n.title}</Text>
                  <Text style={styles.cardMsg}>{n.message}</Text>
                  <Text style={styles.date}>{n.created_at}</Text>
                </View>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center'
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text
  },
  markRead: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700'
  },
  content: {
    padding: 16,
    paddingTop: 0
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border
  },
  cardUnread: {
    borderColor: colors.secondary,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondary
  },
  row: {
    flexDirection: 'row'
  },
  icon: {
    fontSize: 22,
    marginRight: 12
  },
  textBox: {
    flex: 1
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text
  },
  cardMsg: {
    fontSize: 11,
    color: colors.textSecondary,
    marginVertical: 4,
    lineHeight: 16
  },
  date: {
    fontSize: 9,
    color: colors.textMuted
  },
  empty: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    color: colors.textSecondary
  }
});
