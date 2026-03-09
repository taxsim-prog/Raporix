// Tema renk tanımlamaları
export const lightColors = {
  // Arka plan renkleri
  background: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceVariant: '#F9FAFB',
  
  // Metin renkleri
  text: '#1F2937',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  
  // Primary renk
  primary: '#059669',
  primaryLight: '#10B981',
  primaryDark: '#047857',
  
  // Durum renkleri
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // Border ve divider
  border: '#E5E7EB',
  divider: '#F3F4F6',
  
  // Diğer
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',
  disabled: '#D1D5DB',
  
  // Kart ve container
  card: '#FFFFFF',
  cardBorder: '#E5E7EB',
  
  // Input
  inputBackground: '#F9FAFB',
  inputBorder: '#E5E7EB',
  inputText: '#1F2937',
  inputPlaceholder: '#9CA3AF',
  
  // Header
  headerBackground: '#059669',
  headerText: '#FFFFFF',

  // Admin Homepage
  adminHomepageHeaderText : '#000000',
  
  // Status bar
  statusBarStyle: 'light-content' as const,
};

export const darkColors = {
  // Arka plan renkleri
  background: '#111827',
  surface: '#1F2937',
  surfaceVariant: '#374151',
  
  // Metin renkleri
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textTertiary: '#9CA3AF',
  
  // Primary renk
  primary: '#10B981',
  primaryLight: '#34D399',
  primaryDark: '#059669',
  
  // Durum renkleri
  success: '#10B981',
  error: '#F87171',
  warning: '#FBBF24',
  info: '#60A5FA',
  
  // Border ve divider
  border: '#374151',
  divider: '#1F2937',
  
  // Diğer
  shadow: '#000000',
  overlay: 'rgba(0, 0, 0, 0.7)',
  disabled: '#4B5563',
  
  // Kart ve container
  card: '#1F2937',
  cardBorder: '#374151',
  
  // Input
  inputBackground: '#374151',
  inputBorder: '#4B5563',
  inputText: '#F9FAFB',
  inputPlaceholder: '#9CA3AF',
  
  // Header
  headerBackground: '#059669',
  headerText: '#FFFFFF',

  // Admin Homepage
  adminHomepageHeaderText : '#FFFFFF',
  
  // Status bar
  statusBarStyle: 'light-content' as const,
};

export type ThemeColors = typeof lightColors;
