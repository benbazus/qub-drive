import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { QueryProvider, AuthProvider } from '@/providers';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { NotificationManager } from '@/components/notifications';
import { useAuthStore } from '@/stores/auth';

export const unstable_settings = {
  anchor: '(tabs)',
};

function AppContent() {
  const colorScheme = useColorScheme();
  const checkAuthStatus = useAuthStore(state => state.checkAuthStatus);

  useEffect(() => {
    // Check authentication status on app start
    checkAuthStatus();
  }, [checkAuthStatus]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        
        {/* Authentication Screens */}
        <Stack.Screen name="auth/login" options={{ headerShown: false }} />
        <Stack.Screen name="auth/register" options={{ headerShown: false }} />
        <Stack.Screen name="auth/verify-email" options={{ headerShown: false }} />
        <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="auth/biometric-setup" options={{ headerShown: false }} />
        
        {/* Settings Screens */}
        <Stack.Screen name="settings/biometric" options={{ headerShown: false }} />
        
        {/* File Management Screens */}
        <Stack.Screen 
          name="folder/[id]" 
          options={{ 
            title: 'Folder',
            headerBackTitle: 'Back',
            presentation: 'card'
          }} 
        />
        <Stack.Screen 
          name="file/[id]" 
          options={{ 
            title: 'File Details',
            headerBackTitle: 'Back',
            presentation: 'card'
          }} 
        />
        
        {/* Document Editors */}
        <Stack.Screen 
          name="document/[id]" 
          options={{ 
            presentation: 'modal', 
            title: 'Document',
            headerBackTitle: 'Close'
          }} 
        />
        <Stack.Screen 
          name="spreadsheet/[id]" 
          options={{ 
            presentation: 'modal', 
            title: 'Spreadsheet',
            headerBackTitle: 'Close'
          }} 
        />
        <Stack.Screen 
          name="form/[id]" 
          options={{ 
            presentation: 'modal', 
            title: 'Form',
            headerBackTitle: 'Close'
          }} 
        />
        
        {/* Upload and Share Screens */}
        <Stack.Screen 
          name="upload" 
          options={{ 
            presentation: 'modal', 
            title: 'Upload Files',
            headerBackTitle: 'Cancel'
          }} 
        />
        <Stack.Screen 
          name="share/[id]" 
          options={{ 
            presentation: 'modal', 
            title: 'Share',
            headerBackTitle: 'Cancel'
          }} 
        />
        
        {/* Notifications */}
        <Stack.Screen 
          name="notifications" 
          options={{ 
            title: 'Notifications',
            headerBackTitle: 'Back',
            presentation: 'card'
          }} 
        />
        
        {/* General Modal */}
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
      
      {/* Notification Manager for real-time notifications */}
      <NotificationManager />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppContent />
        </NotificationProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
