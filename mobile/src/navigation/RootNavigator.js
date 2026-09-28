import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';

// Student Screens
import DashboardScreen from '../screens/student/DashboardScreen';
import ApplicationDetailScreen from '../screens/student/ApplicationDetailScreen';
import ApplySchemeScreen from '../screens/student/ApplySchemeScreen';
import DocumentWalletScreen from '../screens/student/DocumentWalletScreen';
import JagoChatScreen from '../screens/student/JagoChatScreen';
import NotificationsScreen from '../screens/student/NotificationsScreen';
import ProfileScreen from '../screens/student/ProfileScreen';

// Officer Screens
import ReviewQueueScreen from '../screens/admin/ReviewQueueScreen';
import CoverageGapScreen from '../screens/admin/CoverageGapScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabBarIcon({ icon, label, focused }) {
  return (
    <View style={styles.tabIconBox}>
      <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

import { useLanguage } from '../context/LanguageContext';

// Student Bottom Tabs
function StudentTabs() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon icon="🏠" label={t('navHome', 'Home')} focused={focused} />
        }}
      />
      <Tab.Screen
        name="Apply"
        component={ApplySchemeScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon icon="📝" label={t('navApply', 'Apply')} focused={focused} />
        }}
      />
      <Tab.Screen
        name="Wallet"
        component={DocumentWalletScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon icon="📁" label={t('navWallet', 'Wallet')} focused={focused} />
        }}
      />
      <Tab.Screen
        name="JAGO"
        component={JagoChatScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon icon="🤖" label={t('navJago', 'JAGO AI')} focused={focused} />
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon icon="👤" label={t('navProfile', 'Profile')} focused={focused} />
        }}
      />
    </Tab.Navigator>
  );
}

// Officer Bottom Tabs
function OfficerTabs() {
  const { t } = useLanguage();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false
      }}
    >
      <Tab.Screen
        name="ReviewQueue"
        component={ReviewQueueScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon icon="📋" label={t('navReviewQueue', 'Review Queue')} focused={focused} />
        }}
      />
      <Tab.Screen
        name="CoverageGaps"
        component={CoverageGapScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon icon="📊" label={t('navCoverageGaps', 'Coverage Gaps')} focused={focused} />
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabBarIcon icon="👤" label={t('navProfile', 'Profile')} focused={focused} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { isAuthenticated, isOfficer, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingLogo}>🇮🇳 MoTA</Text>
        <Text style={styles.loadingText}>Initializing Unified ST Scholarship Platform...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          // Auth Stack
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : isOfficer ? (
          // Officer Stack
          <>
            <Stack.Screen name="OfficerHome" component={OfficerTabs} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        ) : (
          // Student Stack
          <>
            <Stack.Screen name="StudentHome" component={StudentTabs} />
            <Stack.Screen name="ApplicationDetail" component={ApplicationDetailScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingLogo: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8
  },
  loadingText: {
    color: '#A7F3D0',
    fontSize: 12
  },
  tabBar: {
    height: 60,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6
  },
  tabIconBox: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabEmoji: {
    fontSize: 18,
    opacity: 0.6
  },
  tabEmojiFocused: {
    opacity: 1,
    transform: [{ scale: 1.1 }]
  },
  tabLabel: {
    fontSize: 9,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: 2
  },
  tabLabelFocused: {
    color: colors.primary,
    fontWeight: '800'
  }
});
