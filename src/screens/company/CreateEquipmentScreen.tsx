import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeContext';
import CustomAlert from '../../components/CustomAlert';
import EquipmentApi from '../../api/equipment';
import CompaniesApi from '../../api/companies';
import DateTimePicker from '@react-native-community/datetimepicker';
import { pick, types } from '@react-native-documents/picker';

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

interface CreateEquipmentScreenProps {
  navigation: any;
}

const EQUIPMENT_TYPES = [
  { id: 'Topraklama Megeri', label: 'Topraklama Megeri', icon: 'flash' },
  { id: 'Termal Kamera', label: 'Termal Kamera', icon: 'thermometer' },
];

const CreateEquipmentScreen = ({ navigation }: CreateEquipmentScreenProps) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    equipmentName: '',
    equipmentType: '',
    serialNumber: '',
    calibrationNumber: '',
  });
  const [calibrationDate, setCalibrationDate] = useState<Date | null>(null);
  const [calibrationExpiryDate, setCalibrationExpiryDate] = useState<Date | null>(null);
  const [certificateFile, setCertificateFile] = useState<any>(null);
  const [showTypePicker, setShowTypePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
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

  const handlePickDocument = async () => {
    try {
      const result = await pick({
        type: [types.pdf],
      });

      if (result && result.length > 0) {
        const [file] = result;
        setCertificateFile({
          uri: file.uri,
          name: file.name,
          type: file.type,
        });
      }
    } catch (error: any) {
      // User cancelled the picker
      if (error && error.message && error.message.includes('cancel')) {
        return;
      }
      console.error('Dosya seçme hatası:', error);
      showAlert({
        title: 'Hata',
        message: 'Dosya seçilirken bir hata oluştu.',
        type: 'error',
      });
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setCalibrationDate(selectedDate);
    }
  };

  const handleExpiryDateChange = (event: any, selectedDate?: Date) => {
    setShowExpiryDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setCalibrationExpiryDate(selectedDate);
    }
  };

  const handleSave = async () => {
    // Validasyon
    if (!formData.equipmentName.trim()) {
      showAlert({
        title: 'Uyarı',
        message: 'Lütfen ekipman adı girin.',
        type: 'warning',
      });
      return;
    }

    if (!formData.equipmentType) {
      showAlert({
        title: 'Uyarı',
        message: 'Lütfen ekipman tipi seçin.',
        type: 'warning',
      });
      return;
    }

    if (!formData.serialNumber.trim()) {
      showAlert({
        title: 'Uyarı',
        message: 'Lütfen seri numarası girin.',
        type: 'warning',
      });
      return;
    }

    if (!calibrationExpiryDate) {
      showAlert({
        title: 'Uyarı',
        message: 'Lütfen kalibrasyon geçerlilik tarihi seçin.',
        type: 'warning',
      });
      return;
    }

    setLoading(true);
    try {
      // Şirket ID'sini al
      const companies = await CompaniesApi.list({ q: '', limit: 1, offset: 0 });
      if (!companies || companies.length === 0) {
        throw new Error('Şirket bulunamadı');
      }
      const companyId = parseInt(companies[0].id);

      // Ekipmanı oluştur
      const equipment = await EquipmentApi.create({
        equipment_name: formData.equipmentName,
        equipment_type: formData.equipmentType,
        serial_number: formData.serialNumber,
        calibration_date: calibrationDate?.toISOString(),
        calibration_expiry_date: calibrationExpiryDate?.toISOString(),
        calibration_number: formData.calibrationNumber || undefined,
        company_id: companyId,
      });

      // PDF varsa yükle
      if (certificateFile) {
        try {
          await EquipmentApi.uploadCertificate(equipment.id, {
            uri: certificateFile.uri,
            name: certificateFile.name,
            type: certificateFile.type || 'application/pdf',
          });
        } catch (uploadError) {
          console.error('Belge yükleme hatası:', uploadError);
        }
      }

      showAlert({
        title: 'Başarılı',
        message: 'Ekipman başarıyla eklendi.',
        type: 'success',
        onConfirm: () => {
          navigation.goBack();
        },
      });
    } catch (error: any) {
      console.error('[CreateEquipmentScreen] Kaydetme hatası:', error);
      
      let errorMessage = 'Ekipman eklenirken bir hata oluştu.';
      
      if (error?.message) {
        if (error.message.includes('zaten kullanılıyor')) {
          errorMessage = 'Bu seri numarası zaten kullanılıyor.';
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

  const getSelectedTypeLabel = () => {
    const type = EQUIPMENT_TYPES.find(t => t.id === formData.equipmentType);
    return type ? type.label : 'Seçiniz';
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
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Ekipman Ekle</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formContainer}>
          {/* Info Card */}
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Yeni ekipman eklemek için aşağıdaki bilgileri doldurun. Kalibrasyon belgesi opsiyoneldir.
            </Text>
          </View>

          {/* Form Fields */}
          <View style={[styles.formCard, { backgroundColor: theme.card }]}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Ekipman Adı *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formData.equipmentName}
                onChangeText={(value) => updateFormData('equipmentName', value)}
                placeholder="Örn: Topraklama Megeri 1"
                placeholderTextColor={theme.inputPlaceholder}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Ekipman Tipi *</Text>
              <TouchableOpacity
                style={[styles.pickerButton, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
                onPress={() => setShowTypePicker(true)}
              >
                <Text style={[styles.pickerButtonText, { color: formData.equipmentType ? theme.inputText : theme.inputPlaceholder }]}>
                  {getSelectedTypeLabel()}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Seri No *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formData.serialNumber}
                onChangeText={(value) => updateFormData('serialNumber', value)}
                placeholder="Örn: SN123456789"
                placeholderTextColor={theme.inputPlaceholder}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Kalibrasyon Tarihi</Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                <Text style={[styles.dateButtonText, { color: calibrationDate ? theme.inputText : theme.inputPlaceholder }]}>
                  {calibrationDate ? calibrationDate.toLocaleDateString('tr-TR') : 'Tarih Seçiniz'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Kalibrasyon Geçerlilik Tarihi *</Text>
              <TouchableOpacity
                style={[styles.dateButton, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
                onPress={() => setShowExpiryDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                <Text style={[styles.dateButtonText, { color: calibrationExpiryDate ? theme.inputText : theme.inputPlaceholder }]}>
                  {calibrationExpiryDate ? calibrationExpiryDate.toLocaleDateString('tr-TR') : 'Tarih Seçiniz'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Kalibrasyon Numarası</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formData.calibrationNumber}
                onChangeText={(value) => updateFormData('calibrationNumber', value)}
                placeholder="Örn: KAL-2025-001"
                placeholderTextColor={theme.inputPlaceholder}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Kalibrasyon Belgesi (PDF)</Text>
              <TouchableOpacity
                style={[styles.fileButton, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
                onPress={handlePickDocument}
              >
                <Ionicons name="document-attach-outline" size={20} color={theme.primary} />
                <Text style={[styles.fileButtonText, { color: certificateFile ? theme.inputText : theme.inputPlaceholder }]}>
                  {certificateFile ? certificateFile.name : 'PDF Dosyası Seç'}
                </Text>
                {certificateFile && (
                  <TouchableOpacity onPress={() => setCertificateFile(null)}>
                    <Ionicons name="close-circle" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
              {certificateFile && (
                <View style={styles.fileInfo}>
                  <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  <Text style={[styles.fileInfoText, { color: theme.textSecondary }]}>
                    Dosya seçildi
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Kaydet</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Type Picker Modal */}
      <Modal
        visible={showTypePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.pickerModal, { backgroundColor: theme.card }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.pickerTitle, { color: theme.text }]}>Ekipman Tipi Seç</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.pickerBody}>
              {EQUIPMENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.pickerOption,
                    { backgroundColor: theme.background, borderColor: theme.border },
                    formData.equipmentType === type.id && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }
                  ]}
                  onPress={() => {
                    updateFormData('equipmentType', type.id);
                    setShowTypePicker(false);
                  }}
                >
                  <Ionicons 
                    name={type.icon} 
                    size={24} 
                    color={formData.equipmentType === type.id ? theme.primary : theme.textSecondary} 
                  />
                  <Text style={[
                    styles.pickerOptionText, 
                    { color: formData.equipmentType === type.id ? theme.primary : theme.text }
                  ]}>
                    {type.label}
                  </Text>
                  {formData.equipmentType === type.id && (
                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker - Kalibrasyon Tarihi */}
      {showDatePicker && (
        <DateTimePicker
          value={calibrationDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
        />
      )}

      {/* Date Picker - Kalibrasyon Geçerlilik Tarihi */}
      {showExpiryDatePicker && (
        <DateTimePicker
          value={calibrationExpiryDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleExpiryDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={handleAlertConfirm}
        onCancel={handleAlertCancel}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
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
    fontWeight: '700',
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
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  formCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerButtonText: {
    fontSize: 16,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
  },
  fileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  fileButtonText: {
    flex: 1,
    fontSize: 16,
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 6,
  },
  fileInfoText: {
    fontSize: 14,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 16,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  pickerBody: {
    padding: 16,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    gap: 12,
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});

export default CreateEquipmentScreen;
