import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import FormsApi from '../api/forms';
import AuthApi from '../api/auth';
import CustomAlert from '../components/CustomAlert';
import { SafeAreaView } from "react-native-safe-area-context"

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
console.log("RegisterScreen")
const RegisterScreen = ({ navigation }: { navigation: any }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    authorizedPerson: '',
    companyPhone: '',
    website: '',
    sgkNumber: '',
    taxNumber: '',
    taxOffice: '',
    authorizedPhone: '',
    authorizedEmail: '',
    password: '',
    position : '',
    department : '',
  });

  const [branches, setBranches] = useState(['']);
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

  const addBranch = () => {
    setBranches(prev => [...prev, '']);
  };

  const updateBranch = (index: number, value: string) => {
    setBranches(prev => {
      const newBranches = [...prev];
      newBranches[index] = value;
      return newBranches;
    });
  };

  const removeBranch = (index: number) => {
    if (branches.length > 1) {
      setBranches(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleRegister = async () => {
    if (loading) {
      console.log("[RegisterScreen] Zaten bir kayıt işlemi devam ediyor");
      return; // Zaten işlem yapılıyorsa çık
    }
    
    // Form validasyonu
    const requiredFields: (keyof typeof formData)[] = [
      'companyName', 'companyAddress', 'authorizedPerson', 
      'companyPhone', 'taxNumber', 'taxOffice', 
      'authorizedPhone', 'authorizedEmail', 'password',
      'position', 'department'
    ];

    for (let field of requiredFields) {
      if (!formData[field]) {
        showAlert({
          title: 'Hata',
          message: 'Lütfen tüm zorunlu alanları doldurun',
          type: 'error',
        });
        return;
      }
    }

    // Email formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.authorizedEmail)) {
      showAlert({
        title: 'Hata',
        message: 'Lütfen geçerli bir e-posta adresi girin',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    console.log("[RegisterScreen] Kayıt işlemi başlatılıyor...");
    
    const payload = {
      companyName : formData.companyName,
      companyAddress : formData.companyAddress,
      authorizedPerson : formData.authorizedPerson,
      companyPhone : formData.companyPhone,
      website : formData.website,
      sgkNumber : formData.sgkNumber,
      taxNumber : formData.taxNumber,
      taxOffice : formData.taxOffice,
      authorizedPhone : formData.authorizedPhone,
      authorizedEmail : formData.authorizedEmail.trim().toLowerCase(),
      password : formData.password,
      branches : branches.filter(b => b.trim() !== ''), // Boş branch'leri filtrele
      position : formData.position,
      department : formData.department,
    };
    
    try {
      console.log("[RegisterScreen] API isteği gönderiliyor...");
      const response = await AuthApi.register(payload);
      console.log("[RegisterScreen] Başarılı yanıt alındı:", response);

      showAlert({
        title: 'Başarılı',
        message: 'Şirket kaydınız başarıyla tamamlandı. Giriş yapabilirsiniz.',
        type: 'success',
        onConfirm: () => navigation.navigate('Login'),
      });
    } catch (error: any) {
      console.error("[RegisterScreen] Hata:", error);
      
      let errorMessage = 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.';
      
      // Hata mesajını daha açıklayıcı hale getir
      if (error?.message) {
        if (error.message.includes('zaten kayıtlı') || error.message.includes('already')) {
          errorMessage = 'Bu e-posta adresi zaten kayıtlı. Lütfen giriş yapın veya farklı bir e-posta kullanın.';
        } else if (error.message.includes('zaman aşımı') || error.message.includes('timeout')) {
          errorMessage = 'İstek zaman aşımına uğradı. İnternet bağlantınızı kontrol edip tekrar deneyin.';
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
      console.log("[RegisterScreen] Kayıt işlemi tamamlandı");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Geri</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Şirket Kaydı</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.formContainer}>
            
            {/* Şirket Bilgileri */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Şirket Bilgileri</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Şirket Tam Adı *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.companyName}
                  onChangeText={(value) => updateFormData('companyName', value)}
                  placeholder="ABC Periyodik Kontrol Ltd. Şti."
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Şirket Açık Adres *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.companyAddress}
                  onChangeText={(value) => updateFormData('companyAddress', value)}
                  placeholder="Tam adres bilgisi"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Şube Adresleri */}
              <View style={styles.inputContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Şube Adresleri</Text>
                  <TouchableOpacity style={styles.addButton} onPress={addBranch}>
                    <Text style={styles.addButtonText}>+ Şube Ekle</Text>
                  </TouchableOpacity>
                </View>
                
                {branches.map((branch, index) => (
                  <View key={index} style={styles.branchContainer}>
                    <TextInput
                      style={[styles.input, styles.branchInput]}
                      value={branch}
                      onChangeText={(value) => updateBranch(index, value)}
                      placeholder={`${index + 1}. Şube Adresi`}
                      placeholderTextColor="#9CA3AF"
                      multiline
                      numberOfLines={2}
                    />
                    {branches.length > 1 && (
                      <TouchableOpacity 
                        style={styles.removeButton}
                        onPress={() => removeBranch(index)}
                      >
                        <Text style={styles.removeButtonText}>×</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Şirket Telefon *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.companyPhone}
                  onChangeText={(value) => updateFormData('companyPhone', value)}
                  placeholder="0212 XXX XX XX"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Şirket Website</Text>
                <TextInput
                  style={styles.input}
                  value={formData.website}
                  onChangeText={(value) => updateFormData('website', value)}
                  placeholder="www.sirket.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Yasal Bilgiler */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Yasal Bilgiler</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>SGK Sicil No</Text>
                <TextInput
                  style={styles.input}
                  value={formData.sgkNumber}
                  onChangeText={(value) => updateFormData('sgkNumber', value)}
                  placeholder="SGK sicil numarası"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vergi Numarası *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.taxNumber}
                  onChangeText={(value) => updateFormData('taxNumber', value)}
                  placeholder="Vergi numarası"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Vergi Dairesi *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.taxOffice}
                  onChangeText={(value) => updateFormData('taxOffice', value)}
                  placeholder="Vergi dairesi adı"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            {/* Yetkili Kişi Bilgileri */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Yetkili Kişi Bilgileri</Text>
              
                <View style={styles.inputContainer}>
                <Text style={styles.label}>Şirket Kullanıcı Yetkilisi *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.authorizedPerson}
                  onChangeText={(value) => updateFormData('authorizedPerson', value)}
                  placeholder="Ad Soyad"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Departman *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.department}
                  onChangeText={(value) => updateFormData('department', value)}
                  placeholder="Departman"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Pozisyon *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.position}
                  onChangeText={(value) => updateFormData('position', value)}
                  placeholder="Pozisyon"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Yetkili Telefon *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.authorizedPhone}
                  onChangeText={(value) => updateFormData('authorizedPhone', value)}
                  placeholder="0532 XXX XX XX"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Yetkili Mail Adresi *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.authorizedEmail}
                  onChangeText={(value) => updateFormData('authorizedEmail', value)}
                  placeholder="yetkili@sirket.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Yetkili Şifre *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.password}
                  onChangeText={(value) => updateFormData('password', value)}
                  placeholder="Güçlü bir şifre oluşturun"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[styles.registerButton, loading && styles.registerButtonDisabled]} 
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: '#059669',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
    marginTop: 25,
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: '100%',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#059669',
    paddingBottom: 6,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
    backgroundColor: '#F9FAFB',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  addButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  branchContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  branchInput: {
    flex: 1,
    marginRight: 6,
  },
  removeButton: {
    backgroundColor: '#EF4444',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  registerButton: {
    backgroundColor: '#059669',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  registerButtonDisabled: {
    backgroundColor: '#9CA3AF',
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default RegisterScreen;