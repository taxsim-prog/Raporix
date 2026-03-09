import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomAlert from '../components/CustomAlert';
import { useTheme } from '../theme/ThemeContext';

type AlertType = 'success' | 'error' | 'warning' | 'info';

type AlertConfig = {
  title: string;
  message: string;
  type: AlertType;
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

interface LoginScreenProps {
  navigation: any;
  onLogin: (email: string, password: string) => Promise<void>;
}

const LoginScreen = ({ navigation, onLogin }: LoginScreenProps) => {
  const { theme } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (config: AlertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  const handleAlertConfirm = () => {
    setAlertVisible(false);
    alertConfig.onConfirm?.();
  };

  const handleAlertCancel = () => {
    setAlertVisible(false);
    alertConfig.onCancel?.();
  };

  const handleLogin = async () => {
    if (loading) {
      console.log("[LoginScreen] Zaten bir giriş işlemi devam ediyor");
      return;
    }

    if (!email || !password) {
      showAlert({
        title: 'Hata',
        message: 'Lütfen tüm alanları doldurun',
        type: 'error',
      });
      return;
    }

    // Email formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert({
        title: 'Hata',
        message: 'Lütfen geçerli bir e-posta adresi girin',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    console.log("[LoginScreen] Giriş işlemi başlatılıyor...");

    try {
      await onLogin(email.trim().toLowerCase(), password);
      console.log("[LoginScreen] Giriş başarılı");
    } catch (error: any) {
      console.error("[LoginScreen] Giriş hatası:", error);
      
      let errorMessage = 'Giriş yapılırken bir hata oluştu. Lütfen tekrar deneyin.';
      
      if (error?.message) {
        if (error.message.includes('zaman aşımı') || error.message.includes('timeout')) {
          errorMessage = 'İstek zaman aşımına uğradı. İnternet bağlantınızı kontrol edip tekrar deneyin.';
        } else if (error.message.includes('bağlanılamadı') || error.message.includes('network')) {
          errorMessage = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'E-posta veya şifre hatalı. Lütfen kontrol edip tekrar deneyin.';
        } else {
          errorMessage = error.message;
        }
      }

      showAlert({
        title: 'Giriş Başarısız',
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
      console.log("[LoginScreen] Giriş işlemi tamamlandı");
    }
  };

  const navigateToRegister = () => {
    navigation.navigate('SimpleRegister');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Giriş Yap</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Welcome Card */}
          <View style={[styles.welcomeCard]}>
            <Image
              source={require('../assets/raptor_old.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.welcomeText, { color: theme.text }]}>Hoş Geldiniz</Text>
            <Text style={[styles.welcomeSubtext, { color: theme.textSecondary }]}>
              Hesabınıza giriş yapın
            </Text>
          </View>

          {/* Form Card */}
          <View style={[styles.formCard, { backgroundColor: theme.card }]}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>E-posta</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={email}
                onChangeText={setEmail}
                placeholder="ornek@email.com"
                placeholderTextColor={theme.inputPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Şifre</Text>
              <View style={[styles.passwordContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                <TextInput
                  style={[styles.passwordInput, { color: theme.inputText }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Şifrenizi girin"
                  placeholderTextColor={theme.inputPlaceholder}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={18} 
                    color={theme.textTertiary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: theme.primary }, loading && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="log-in" size={20} color="#FFFFFF" />
                <Text style={styles.loginButtonText}>Giriş Yap</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.registerLinkContainer}>
            <Text style={[styles.registerLinkText, { color: theme.textSecondary }]}>
              Hesabınız yok mu?{' '}
            </Text>
            <TouchableOpacity onPress={navigateToRegister}>
              <Text style={[styles.registerLink, { color: theme.primary }]}>Kayıt Olun</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onConfirm={handleAlertConfirm}
        onCancel={handleAlertCancel}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  logo: {
    width: 180,
    height: 60,
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  welcomeCard: {
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#DCDCDC',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  formCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 14,
    fontSize: 14,
  },
  eyeButton: {
    padding: 14,
  },
  loginButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  registerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  registerLinkText: {
    fontSize: 14,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;