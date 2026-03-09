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
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CompaniesApi from '../../api/companies';
import CustomAlert from '../../components/CustomAlert';
import { useTheme } from '../../theme/ThemeContext';
import FormsApi from '../../api/forms';

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

interface EditCompanyScreenProps {
  navigation: any;
  route: {
    params: {
      companyId: string;
    };
  };
}

const EditCompanyScreen = ({ navigation, route }: EditCompanyScreenProps) => {
  const { theme } = useTheme();
  const { companyId } = route.params;

  const [formData, setFormData] = useState({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    website: '',
    sgkNumber: '',
    taxNumber: '',
    taxOffice: '',
  });
  const [branches, setBranches] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
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
    loadCompanyData();
  }, [companyId]);

  const loadCompanyData = async () => {
    try {
      setLoadingData(true);
      
      // Şirket bilgilerini yükle
      const company = await CompaniesApi.get(companyId);
      console.log('[EditCompanyScreen] Company data received:', company);
      console.log('[EditCompanyScreen] Company name:', company.name);
      console.log('[EditCompanyScreen] Company address:', company.address);
      console.log('[EditCompanyScreen] Company phone:', company.phone);
      
      setFormData({
        companyName: company.name || '',
        companyAddress: company.address || '',
        companyPhone: company.phone || '',
        website: '',
        sgkNumber: '',
        taxNumber: '',
        taxOffice: '',
      });

      // Ek bilgileri form'dan yükle (varsa)
      try {
        const forms = await FormsApi.list({ form_name: 'company_additional_info' });
        if (forms && forms.length > 0) {
          const additionalInfo = forms[0].data;
          setFormData(prev => ({
            ...prev,
            website: additionalInfo.website || '',
            sgkNumber: additionalInfo.sgkNumber || '',
            taxNumber: additionalInfo.taxNumber || '',
            taxOffice: additionalInfo.taxOffice || '',
          }));
          setBranches(additionalInfo.branches && additionalInfo.branches.length > 0 ? additionalInfo.branches : ['']);
        }
      } catch (e) {
        console.log('[EditCompanyScreen] Ek bilgiler yüklenemedi:', e);
      }
    } catch (error: any) {
      console.error('[EditCompanyScreen] Yükleme hatası:', error);
      showAlert({
        title: 'Hata',
        message: error?.message || 'Şirket bilgileri yüklenemedi.',
        type: 'error',
        onConfirm: () => navigation.goBack(),
      });
    } finally {
      setLoadingData(false);
    }
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

  const handleUpdateCompanyInfo = async () => {
    // Validasyon
    if (!formData.companyName || !formData.companyAddress || !formData.companyPhone) {
      showAlert({
        title: 'Uyarı',
        message: 'Lütfen zorunlu alanları doldurun (Şirket Adı, Adres, Telefon).',
        type: 'warning',
      });
      return;
    }

    try {
      setLoading(true);
      
      // Şirket bilgilerini güncelle
      await CompaniesApi.update(companyId, {
        name: formData.companyName,
        address: formData.companyAddress,
        phone: formData.companyPhone,
      });

      // Ek bilgileri form olarak güncelle
      try {
        const forms = await FormsApi.list({ form_name: 'company_additional_info' });
        const additionalData = {
          website: formData.website,
          sgkNumber: formData.sgkNumber,
          taxNumber: formData.taxNumber,
          taxOffice: formData.taxOffice,
          branches: branches.filter(b => b.trim() !== ''),
        };

        if (forms && forms.length > 0) {
          // Güncelle
          await FormsApi.update(forms[0].id, {
            form_name: 'company_additional_info',
            data: additionalData,
          });
        } else {
          // Oluştur
          await FormsApi.create({
            form_name: 'company_additional_info',
            data: additionalData,
          });
        }
      } catch (e) {
        console.log('[EditCompanyScreen] Ek bilgiler güncellenemedi:', e);
      }

      showAlert({
        title: 'Başarılı',
        message: 'Şirket bilgileri başarıyla güncellendi.',
        type: 'success',
        onConfirm: () => navigation.goBack(),
      });
    } catch (error: any) {
      console.error('[EditCompanyScreen] Güncelleme hatası:', error);
      
      let errorMessage = 'Şirket bilgileri güncellenirken bir hata oluştu.';
      
      if (error?.message) {
        if (error.message.includes('zaman aşımı') || error.message.includes('timeout')) {
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

  if (loadingData) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />
        <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color={theme.headerText} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.headerText }]}>Şirket Bilgilerini Düzenle</Text>
          <View style={styles.placeholder} />
        </View>
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
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Şirket Bilgilerini Düzenle</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Şirket bilgilerinizi güncelleyin.
            </Text>
          </View>

          {/* Şirket Bilgileri */}
          <View style={[styles.formCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Şirket Bilgileri</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Şirket Tam Adı *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formData.companyName}
                onChangeText={(value) => updateFormData('companyName', value)}
                placeholder="ABC Periyodik Kontrol Ltd. Şti."
                placeholderTextColor={theme.inputPlaceholder}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Şirket Açık Adres *</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formData.companyAddress}
                onChangeText={(value) => updateFormData('companyAddress', value)}
                placeholder="Tam adres bilgisi"
                placeholderTextColor={theme.inputPlaceholder}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Şube Adresleri */}
            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: theme.text }]}>Şube Adresleri</Text>
                <TouchableOpacity style={[styles.addButton, { backgroundColor: theme.primary }]} onPress={addBranch}>
                  <Text style={styles.addButtonText}>+ Şube Ekle</Text>
                </TouchableOpacity>
              </View>
              
              {branches.map((branch, index) => (
                <View key={index} style={styles.branchContainer}>
                  <TextInput
                    style={[styles.input, styles.branchInput, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                    value={branch}
                    onChangeText={(value) => updateBranch(index, value)}
                    placeholder={`${index + 1}. Şube Adresi`}
                    placeholderTextColor={theme.inputPlaceholder}
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
              <Text style={[styles.label, { color: theme.text }]}>Şirket Telefon *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formData.companyPhone}
                onChangeText={(value) => updateFormData('companyPhone', value)}
                placeholder="0212 XXX XX XX"
                placeholderTextColor={theme.inputPlaceholder}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Şirket Website</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formData.website}
                onChangeText={(value) => updateFormData('website', value)}
                placeholder="www.sirket.com"
                placeholderTextColor={theme.inputPlaceholder}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Yasal Bilgiler */}
          <View style={[styles.formCard, { backgroundColor: theme.card }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Yasal Bilgiler</Text>
            
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>SGK Sicil No</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formData.sgkNumber}
                onChangeText={(value) => updateFormData('sgkNumber', value)}
                placeholder="SGK sicil numarası"
                placeholderTextColor={theme.inputPlaceholder}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Vergi Numarası</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formData.taxNumber}
                onChangeText={(value) => updateFormData('taxNumber', value)}
                placeholder="Vergi numarası"
                placeholderTextColor={theme.inputPlaceholder}
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Vergi Dairesi</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formData.taxOffice}
                onChangeText={(value) => updateFormData('taxOffice', value)}
                placeholder="Vergi dairesi adı"
                placeholderTextColor={theme.inputPlaceholder}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: theme.primary }, loading && styles.submitButtonDisabled]} 
            onPress={handleUpdateCompanyInfo}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Değişiklikleri Kaydet</Text>
              </>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
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
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    marginRight: 8,
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
});

export default EditCompanyScreen;
