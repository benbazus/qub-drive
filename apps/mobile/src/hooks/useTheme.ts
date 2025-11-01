import { useColorScheme } from './use-color-scheme'

export interface ThemeColors {
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
  textSecondary: string
  border: string
  success: string
  warning: string
  error: string
  info: string
}

const lightColors: ThemeColors = {
  primary: '#0a7ea4',
  secondary: '#6c757d',
  background: '#ffffff',
  surface: '#f8f9fa',
  text: '#11181C',
  textSecondary: '#687076',
  border: '#e9ecef',
  success: '#28a745',
  warning: '#ffc107',
  error: '#dc3545',
  info: '#17a2b8',
}

const darkColors: ThemeColors = {
  primary: '#4dabf7',
  secondary: '#adb5bd',
  background: '#151718',
  surface: '#212529',
  text: '#ECEDEE',
  textSecondary: '#9BA1A6',
  border: '#343a40',
  success: '#40c057',
  warning: '#fab005',
  error: '#fa5252',
  info: '#339af0',
}

export const useTheme = () => {
  const colorScheme = useColorScheme()
  const isDark = colorScheme === 'dark'
  
  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
    colorScheme: colorScheme || 'light',
  }
}

export default useTheme