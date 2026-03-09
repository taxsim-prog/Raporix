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
import UsersApi from '../../api/users';
import CustomAlert from '../../components/CustomAlert';
import { useTheme } from '../../theme/ThemeContext';

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

interface ChangePasswordScreenProps {
  navigation: any;
}

const ChangePasswordScreen = ({ navigation }: ChangePasswordScreenProps) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
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

  const handleChangePassword = async () => {
    // Validasyon
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      showAlert({
        title: 'Uyarı',
        message: 'Lütfen tüm alanları doldurun.',
        type: 'warning',
      });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      showAlert({
        title: 'Hata',
        message: 'Yeni şifreler eşleşmiyor.',
        type: 'error',
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      showAlert({
        title: 'Uyarı',
        message: 'Şifre en az 6 karakter olmalıdır.',
        type: 'warning',
      });
      return;
    }

    // Mevcut şifre ile yeni şifre aynı olamaz
    if (formData.currentPassword === formData.newPassword) {
      showAlert({
        title: 'Uyarı',
        message: 'Yeni şifre mevcut şifre ile aynı olamaz.',
        type: 'warning',
      });
      return;
    }

    try {
      setLoading(true);
      
      await UsersApi.changePassword({
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
      });

      showAlert({
        title: 'Başarılı',
        message: 'Şifreniz başarıyla değiştirildi.',
        type: 'success',
        onConfirm: () => navigation.goBack(),
      });
    } catch (error: any) {
      console.error('[ChangePasswordScreen] Şifre değiştirme hatası:', error);
      
      let errorMessage = 'Şifre değiştirilirken bir hata oluştu.';
      
      if (error?.message) {
        if (error.message.includes('zaman aşımı') || error.message.includes('timeout')) {
          errorMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
        } else if (error.message.includes('bağlanılamadı') || error.message.includes('network')) {
          errorMessage = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
        } else if (error.message.includes('incorrect') || error.message.includes('wrong') || error.message.includes('yanlış') || error.message.includes('hatalı')) {
          errorMessage = 'Mevcut şifreniz yanlış.';
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
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Şifre Değiştir</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <Ionicons name="shield-checkmark" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Güvenliğiniz için güçlü bir şifre seçin. En az 6 karakter, büyük-küçük harf ve rakam içermelidir.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Mevcut Şifre *</Text>
            <View style={[styles.passwordContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.inputText }]}
                value={formData.currentPassword}
                onChangeText={(value) => updateFormData('currentPassword', value)}
                placeholder="Mevcut şifrenizi girin"
                placeholderTextColor={theme.inputPlaceholder}
                secureTextEntry={!showPasswords.current}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('current')}
              >
                <Ionicons 
                  name={showPasswords.current ? 'eye-off' : 'eye'} 
                  size={18} 
                  color={theme.textTertiary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Yeni Şifre *</Text>
            <View style={[styles.passwordContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.inputText }]}
                value={formData.newPassword}
                onChangeText={(value) => updateFormData('newPassword', value)}
                placeholder="Yeni şifrenizi girin"
                placeholderTextColor={theme.inputPlaceholder}
                secureTextEntry={!showPasswords.new}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('new')}
              >
                <Ionicons 
                  name={showPasswords.new ? 'eye-off' : 'eye'} 
                  size={18} 
                  color={theme.textTertiary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Yeni Şifre Tekrar *</Text>
            <View style={[styles.passwordContainer, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}>
              <TextInput
                style={[styles.passwordInput, { color: theme.inputText }]}
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                placeholder="Yeni şifrenizi tekrar girin"
                placeholderTextColor={theme.inputPlaceholder}
                secureTextEntry={!showPasswords.confirm}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => togglePasswordVisibility('confirm')}
              >
                <Ionicons 
                  name={showPasswords.confirm ? 'eye-off' : 'eye'} 
                  size={18} 
                  color={theme.textTertiary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.changeButton, { backgroundColor: theme.primary }, loading && styles.changeButtonDisabled]} 
            onPress={handleChangePassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.changeButtonText}>Şifreyi Değiştir</Text>
            )}
          </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 16,
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
    padding: 16,
  },
  infoCard: {
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    marginLeft: 10,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
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
  changeButton: {
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  changeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  changeButtonDisabled: {
    opacity: 0.6,
  },
});

export default ChangePasswordScreen;