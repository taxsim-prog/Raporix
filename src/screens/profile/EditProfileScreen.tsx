import React, { useState, useEffect } from 'react';
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
import Ionicons from 'react-native-vector-icons/Ionicons';
import UsersApi from '../../api/users';
import StorageService from '../../utils/StorageService';
import CustomAlert from '../../components/CustomAlert';
import { SafeAreaView } from "react-native-safe-area-context"
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

interface EditProfileScreenProps {
  navigation: any;
}

const EditProfileScreen = ({ navigation }: EditProfileScreenProps) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    position: '',
    department: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const currentUser = await StorageService.getItem<{ id: string; email: string; full_name?: string; role: string }>('currentUser');
      
      if (!currentUser || !currentUser.id) {
        throw new Error('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
      }

      const userData = await UsersApi.me(currentUser.id);
      setFormData({
        name: userData.full_name || '',
        email: userData.email || '',
        phone_number: userData.phone_number || '',
        position: userData.position || '',
        department: userData.department || '',
      });
    } catch (error: any) {
      console.error('[EditProfileScreen] Kullanıcı bilgileri yüklenirken hata:', error);
      showAlert({
        title: 'Hata',
        message: error?.message || 'Profil bilgileri yüklenemedi.',
        type: 'error',
        onConfirm: () => navigation.goBack(),
      });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validasyon
    if (!formData.name.trim()) {
      showAlert({
        title: 'Uyarı',
        message: 'Ad Soyad alanı zorunludur.',
        type: 'warning',
      });
      return;
    }

    if (!formData.email.trim()) {
      showAlert({
        title: 'Uyarı',
        message: 'E-posta alanı zorunludur.',
        type: 'warning',
      });
      return;
    }

    // Email formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showAlert({
        title: 'Uyarı',
        message: 'Geçerli bir e-posta adresi giriniz.',
        type: 'warning',
      });
      return;
    }

    try {
      setSaving(true);
      
      // API'ye güncelleme isteği gönder
      await UsersApi.updateMe({
        full_name: formData.name.trim(),
        email: formData.email.trim(),
        phone_number: formData.phone_number.trim(),
        position: formData.position.trim(),
        department: formData.department.trim(),
      });

      // Storage'daki currentUser'ı güncelle
      const currentUser = await StorageService.getItem<{ id: string; email: string; full_name?: string; role: string, phone_number?: string, position?: string, department?: string }>('currentUser');
      if (currentUser) {
        await StorageService.setItem('currentUser', {
          ...currentUser,
          full_name: formData.name.trim(),
          email: formData.email.trim(),
          department: formData.department.trim(),
          position: formData.position.trim(),
          phone_number: formData.phone_number.trim(),
        });
      }

      showAlert({
        title: 'Başarılı',
        message: 'Profil bilgileriniz başarıyla güncellendi.',
        type: 'success',
        onConfirm: () => navigation.goBack(),
      });
    } catch (error: any) {
      console.error('[EditProfileScreen] Profil güncellenirken hata:', error);
      
      let errorMessage = 'Profil güncellenirken bir hata oluştu.';
      
      if (error?.message) {
        if (error.message.includes('zaman aşımı') || error.message.includes('timeout')) {
          errorMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
        } else if (error.message.includes('bağlanılamadı') || error.message.includes('network')) {
          errorMessage = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
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
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Profil Düzenle</Text>
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={[styles.saveButtonText, { color: theme.headerText }]}>Kaydet</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Avatar Section */}
        <View style={[styles.avatarSection, { backgroundColor: theme.card }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <Text style={styles.avatarText}>
              {formData.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          {/* İlerleyen zamanlarda eklenebilir. Fotoğraf. 
          <TouchableOpacity style={styles.changePhotoButton}>
            <Ionicons name="camera" size={14} color="#059669" />
            <Text style={styles.changePhotoText}>Fotoğraf Değiştir</Text>
          </TouchableOpacity>
          */}
        </View>

        {/* Form */}
        <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Ad Soyad *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
              value={formData.name}
              onChangeText={(value) => updateFormData('name', value)}
              placeholder="Ad Soyad"
              placeholderTextColor={theme.inputPlaceholder}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>E-posta *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
              value={formData.email}
              onChangeText={(value) => updateFormData('email', value)}
              placeholder="E-posta adresi"
              placeholderTextColor={theme.inputPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Departman *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
              value={formData.department}
              onChangeText={(value) => updateFormData('department', value)}
              placeholder="Departman"
              placeholderTextColor={theme.inputPlaceholder}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Pozisyon *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
              value={formData.position}
              onChangeText={(value) => updateFormData('position', value)}
              placeholder="Pozisyon"
              placeholderTextColor={theme.inputPlaceholder}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Telefon Numarası *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
              value={formData.phone_number} 
              onChangeText={(value) => updateFormData('phone_number', value)}
              placeholder="Telefon Numarası"
              placeholderTextColor={theme.inputPlaceholder}
            />
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
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    width: 60,
    alignItems: 'flex-end',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
});

export default EditProfileScreen;