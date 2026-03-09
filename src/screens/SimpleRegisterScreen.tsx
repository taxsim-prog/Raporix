import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AuthApi from '../api/auth';
import CustomAlert from '../components/CustomAlert';
import { useTheme } from '../theme/ThemeContext';
import StorageService from '../utils/StorageService';

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

interface SimpleRegisterScreenProps {
  navigation: any;
}

const SimpleRegisterScreen = ({ navigation }: SimpleRegisterScreenProps) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    password: false,
    confirmPassword: false,
  });
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

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleRegister = async () => {
    // Validasyon
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      showAlert({
        title: 'Uyarı',
        message: 'Lütfen tüm alanları doldurun.',
        type: 'warning',
      });
      return;
    }

    // Email formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showAlert({
        title: 'Uyarı',
        message: 'Geçerli bir e-posta adresi girin.',
        type: 'warning',
      });
      return;
    }

    // Şifre eşleşme kontrolü
    if (formData.password !== formData.confirmPassword) {
      showAlert({
        title: 'Hata',
        message: 'Şifreler eşleşmiyor.',
        type: 'error',
      });
      return;
    }

    // Şifre uzunluk kontrolü
    if (formData.password.length < 6) {
      showAlert({
        title: 'Uyarı',
        message: 'Şifre en az 6 karakter olmalıdır.',
        type: 'warning',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Kullanıcı kaydı - şirket bilgisi olmadan
      const response = await AuthApi.registerUser({
        email: formData.email.toLowerCase().trim(),
        full_name: formData.fullName.trim(),
        password: formData.password,
        role: 'admin', // İlk kayıt olan admin olur
      });

      // Token ve kullanıcı bilgilerini kaydet
      if (response.access_token) {
        await StorageService.setItem('authToken', response.access_token);
        await StorageService.setItem('currentUser', response.user);
      }

      showAlert({
        title: 'Başarılı',
        message: 'Kayıt başarıyla tamamlandı. Şirket bilgilerini ekleyerek özellikleri kullanmaya başlayabilirsiniz.',
        type: 'success',
        onConfirm: () => {
          // Ana sayfaya yönlendir
          navigation.navigate('Login');
        },
      });
    } catch (error: any) {
      console.error('[SimpleRegisterScreen] Kayıt hatası:', error);
      
      let errorMessage = 'Kayıt sırasında bir hata oluştu.';
      
      if (error?.message) {
        if (error.message.includes('409') || error.message.includes('zaten kayıtlı')) {
          errorMessage = 'Bu e-posta adresi zaten kayıtlı.';
        } else if (error.message.includes('zaman aşımı') || error.message.includes('timeout')) {
          errorMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
        } else if (error.message.includes('bağlanılamadı') || error.message.includes('network')) {
          errorMessage = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
        } else {
          errorMessage = error.message;
        }
      }

      showAlert({
        title: 'Hata',
        message: errorMessage,
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color={theme.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Kayıt Ol</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Hızlı kayıt olun. Şirket bilgilerini daha sonra ekleyebilirsiniz.
            </Text>
          </View>

          {/* Form Fields */}
          <View style={[styles.formCard, { backgroundColor: theme.card }]}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Ad Soyad *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formData.fullName}
                onChangeText={(value) => updateFormData('fullName', value)}
                placeholder="Örn: Ahmet Yılmaz"
                placeholderTextColor={theme.inputPlaceholder}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>E-posta *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                placeholder="ornek@email.com"
                placeholderTextColor={theme.inputPlaceholder}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Şifre *</Text>
              <View style={[styles.passwordContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                <TextInput
                  style={[styles.passwordInput, { color: theme.inputText }]}
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  placeholder="En az 6 karakter"
                  placeholderTextColor={theme.inputPlaceholder}
                  secureTextEntry={!showPasswords.password}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => togglePasswordVisibility('password')}
                >
                  <Ionicons 
                    name={showPasswords.password ? 'eye-off' : 'eye'} 
                    size={18} 
                    color={theme.textTertiary} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Şifre Tekrar *</Text>
              <View style={[styles.passwordContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
                <TextInput
                  style={[styles.passwordInput, { color: theme.inputText }]}
                  value={formData.confirmPassword}
                  onChangeText={(value) => updateFormData('confirmPassword', value)}
                  placeholder="Şifreyi tekrar girin"
                  placeholderTextColor={theme.inputPlaceholder}
                  secureTextEntry={!showPasswords.confirmPassword}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => togglePasswordVisibility('confirmPassword')}
                >
                  <Ionicons 
                    name={showPasswords.confirmPassword ? 'eye-off' : 'eye'} 
                    size={18} 
                    color={theme.textTertiary} 
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: theme.primary }, loading && styles.submitButtonDisabled]} 
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Kayıt Ol</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginLinkContainer}>
            <Text style={[styles.loginLinkText, { color: theme.textSecondary }]}>
              Zaten hesabınız var mı?{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: theme.primary }]}>Giriş Yap</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    padding: 20,
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
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
  submitButton: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  loginLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SimpleRegisterScreen;
