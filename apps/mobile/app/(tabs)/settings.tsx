import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useAuthContext } from '@/providers/AuthProvider'
import { useBiometric } from '@/hooks/useBiometric'
import { Colors } from '@/constants/theme'
import { IconSymbol } from '@/components/ui/icon-symbol'

export default function SettingsScreen() {
  const { user, logout, biometricEnabled } = useAuthContext()
  const { biometricInfo, getBiometricTypeText, getBiometricIcon } = useBiometric()

  const handleBiometricSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push('/settings/biometric')
  }

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout()
              router.replace('/auth/login')
            } catch (error) {
              console.error('Logout error:', error)
              Alert.alert('Error', 'Failed to sign out. Please try again.')
            }
          }
        }
      ]
    )
  }

  const SettingsItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    showChevron = true,
    rightElement 
  }: {
    icon: string
    title: string
    subtitle?: string | undefined
    onPress?: (() => void) | undefined
    showChevron?: boolean
    rightElement?: React.ReactNode
  }) => (
    <TouchableOpacity 
      style={styles.settingsItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsItemLeft}>
        <View style={styles.iconContainer}>
          <Text style={styles.itemIcon}>{icon}</Text>
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>{title}</Text>
          {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingsItemRight}>
        {rightElement}
        {showChevron && onPress && (
          <IconSymbol name="chevron.right" size={16} color={Colors.light.tabIconDefault} />
        )}
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* User Profile Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon="👤"
              title={user?.name || 'User'}
              subtitle={user?.email || undefined}
              showChevron={false}
            />
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon={getBiometricIcon()}
              title={`${getBiometricTypeText()} Authentication`}
              subtitle={
                biometricInfo.isAvailable
                  ? biometricEnabled 
                    ? 'Enabled' 
                    : 'Disabled'
                  : 'Not available on this device'
              }
              onPress={biometricInfo.isAvailable ? handleBiometricSettings : undefined}
              showChevron={biometricInfo.isAvailable}
              rightElement={
                biometricInfo.isAvailable ? (
                  <View style={[
                    styles.statusIndicator, 
                    { backgroundColor: biometricEnabled ? Colors.light.tint : Colors.light.tabIconDefault }
                  ]} />
                ) : null
              }
            />
            
            <SettingsItem
              icon="🔑"
              title="Change Password"
              subtitle="Update your account password"
              onPress={() => {
                // TODO: Implement change password
                Alert.alert('Coming Soon', 'Password change feature will be available soon.')
              }}
            />
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          <View style={styles.sectionContent}>
            <SettingsItem
              icon="🔔"
              title="Notifications"
              subtitle="Manage notification preferences"
              onPress={() => {
                // TODO: Implement notification settings
                Alert.alert('Coming Soon', 'Notification settings will be available soon.')
              }}
            />
            
            <SettingsItem
              icon="📱"
              title="About"
              subtitle="App version and information"
              onPress={() => {
                Alert.alert('Qub Drive', 'Version 1.0.0\n\nA secure file sharing and collaboration platform.')
              }}
            />
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
    marginHorizontal: 24,
  },
  sectionContent: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${Colors.light.tabIconDefault}20`,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: `${Colors.light.tabIconDefault}10`,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${Colors.light.tint}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemIcon: {
    fontSize: 20,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 14,
    color: Colors.light.tabIconDefault,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  logoutButton: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
  },
})