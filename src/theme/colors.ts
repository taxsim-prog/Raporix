// ─── Temel renk paleti ───────────────────────────────────────────────────────
export const COLORS = {
  primary: "#0057A8",
  primaryDark: "#003F7F",
  primaryLight: "#1A7FD4",
  bg: "#F0F4FA",
  text: "#1A2B4A",
  subtext: "#4A6080",
  border: "#C5D5E8",
  mutedBg: "#E8F0FB",
  white: "#ffffff",
  gray: "#8FA3BC",
  success: "#16A34A",
  error: "#DC2626",
  warning: "#D97706",
};

export const HEADER_HEIGHT = 56;
export const FOOTER_HEIGHT = 72;

// ─── ThemeColors tipi ────────────────────────────────────────────────────────
export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  background: string;
  card: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  border: string;
  headerBackground: string;
  headerText: string;
  inputBackground: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  success: string;
  error: string;
  warning: string;
  statusBarStyle: 'light-content' | 'dark-content';
}

// ─── Açık tema ───────────────────────────────────────────────────────────────
export const lightColors: ThemeColors = {
  primary: "#0057A8",
  primaryDark: "#003F7F",
  primaryLight: "#1A7FD4",
  background: "#F0F4FA",
  card: "#FFFFFF",
  text: "#1A2B4A",
  textSecondary: "#4A6080",
  textTertiary: "#8FA3BC",
  border: "#C5D5E8",
  headerBackground: "#0057A8",
  headerText: "#FFFFFF",
  inputBackground: "#FFFFFF",
  inputBorder: "#C5D5E8",
  inputText: "#1A2B4A",
  inputPlaceholder: "#8FA3BC",
  success: "#16A34A",
  error: "#DC2626",
  warning: "#D97706",
  statusBarStyle: 'light-content',
};

// ─── Koyu tema ───────────────────────────────────────────────────────────────
export const darkColors: ThemeColors = {
  primary: "#1A7FD4",
  primaryDark: "#0057A8",
  primaryLight: "#4DA6FF",
  background: "#0D1B2E",
  card: "#1A2B4A",
  text: "#E8F0FB",
  textSecondary: "#8FA3BC",
  textTertiary: "#4A6080",
  border: "#2A3F5F",
  headerBackground: "#003F7F",
  headerText: "#FFFFFF",
  inputBackground: "#1A2B4A",
  inputBorder: "#2A3F5F",
  inputText: "#E8F0FB",
  inputPlaceholder: "#4A6080",
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  statusBarStyle: 'light-content',
};
