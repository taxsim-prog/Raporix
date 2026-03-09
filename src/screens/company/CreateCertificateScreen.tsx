"use client"

import React, { useState } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StatusBar, Platform } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import Ionicons from "react-native-vector-icons/Ionicons"
import { useTheme } from "../../theme/ThemeContext"
import CertificatesApi from "../../api/certificates"
import CustomAlert from "../../components/CustomAlert"
import DateTimePicker from '@react-native-community/datetimepicker'
import { pick, types } from '@react-native-documents/picker'

interface CreateCertificateScreenProps {
  navigation: any;
  route: {
    params: {
      employeeId: string;
      employeeName: string;
      companyId: number;
    };
  };
}

const CreateCertificateScreen = ({ navigation, route }: CreateCertificateScreenProps) => {
  const { theme } = useTheme();
  const { employeeId, employeeName, companyId } = route.params;
  
  const [certificateName, setCertificateName] = useState("")
  const [certificateType, setCertificateType] = useState("")
  const [expiryDate, setExpiryDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [pdfFile, setPdfFile] = useState<{ uri: string; name: string; type: string } | null>(null)
  const [saving, setSaving] = useState(false)
  
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    showCancel?: boolean;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  }>({
    title: '',
    message: '',
    type: 'info',
  })

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config)
    setAlertVisible(true)
  }

  const handleAlertConfirm = () => {
    setAlertVisible(false)
    alertConfig.onConfirm?.()
  }

  const handleAlertCancel = () => {
    setAlertVisible(false)
  }

  const handlePickPdf = async () => {
    try {
      const result = await pick({
        type: [types.pdf],
      });

      if (result && result.length > 0) {
        const [file] = result;
        setPdfFile({
          uri: file.uri,
          name: file.name || 'document.pdf',
          type: file.type || 'application/pdf',
        });
      }
    } catch (error: any) {
      if (error && error.message && error.message.includes('cancel')) {
        return;
      }
      console.error('PDF seçme hatası:', error);
      showAlert({
        title: 'Hata',
        message: 'PDF seçilirken bir hata oluştu.',
        type: 'error',
      });
    }
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setExpiryDate(selectedDate);
    }
  }

  const validateForm = () => {
    if (!certificateName.trim()) {
      showAlert({
        title: 'Uyarı',
        message: 'Lütfen belge adı girin.',
        type: 'warning',
      });
      return false;
    }

    if (!expiryDate) {
      showAlert({
        title: 'Uyarı',
        message: 'Lütfen geçerlilik tarihi seçin.',
        type: 'warning',
      });
      return false;
    }

    if (!pdfFile) {
      showAlert({
        title: 'Uyarı',
        message: 'Lütfen PDF belgesi seçin.',
        type: 'warning',
      });
      return false;
    }

    return true;
  }

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Önce belgeyi oluştur
      const certificate = await CertificatesApi.create({
        user_id: parseInt(employeeId),
        company_id: companyId,
        certificate_name: certificateName,
        certificate_type: certificateType || undefined,
        expiry_date: expiryDate!.toISOString(),
      });

      // PDF'i yükle
      if (pdfFile) {
        await CertificatesApi.uploadPdf(certificate.id, pdfFile);
      }

      showAlert({
        title: 'Başarılı',
        message: 'Belge başarıyla eklendi',
        type: 'success',
        onConfirm: () => navigation.goBack(),
      });
    } catch (e: any) {
      console.error('[CreateCertificateScreen] Hata:', e);
      showAlert({
        title: 'Hata',
        message: e?.message || 'Belge eklenirken bir hata oluştu',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yeni Belge Ekle</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Employee Info */}
        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <Ionicons name="person" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.text }]}>
              {employeeName} için belge ekliyorsunuz
            </Text>
          </View>
        </View>

        {/* Form */}
        <View style={styles.formSection}>
          <View style={[styles.formCard, { backgroundColor: theme.card }]}>
            {/* Certificate Name */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                Belge Adı <Text style={styles.required}>*</Text>
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                <Ionicons name="document-text-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={certificateName}
                  onChangeText={setCertificateName}
                  placeholder="Örn: İş Güvenliği Uzmanlık Belgesi"
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            {/* Certificate Type (Optional) */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                Belge Tipi
              </Text>
              <View style={[styles.inputWrapper, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
                <Ionicons name="pricetag-outline" size={20} color={theme.textSecondary} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={certificateType}
                  onChangeText={setCertificateType}
                  placeholder="Örn: Güvenlik, Kalite, vb."
                  placeholderTextColor={theme.textSecondary}
                />
              </View>
            </View>

            {/* Expiry Date */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                Geçerlilik Tarihi <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.inputWrapper, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
                <Text style={[styles.dateText, { color: expiryDate ? theme.text : theme.textSecondary }]}>
                  {expiryDate ? formatDate(expiryDate) : 'Tarih seçin'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* PDF File */}
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>
                PDF Belgesi <Text style={styles.required}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.fileButton, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}
                onPress={handlePickPdf}
              >
                <Ionicons name="document-attach-outline" size={24} color={theme.primary} />
                <View style={styles.fileInfo}>
                  <Text style={[styles.fileButtonText, { color: theme.text }]}>
                    {pdfFile ? pdfFile.name : 'PDF Seç'}
                  </Text>
                  {pdfFile && (
                    <Text style={[styles.fileSize, { color: theme.textSecondary }]}>
                      PDF seçildi
                    </Text>
                  )}
                </View>
                <Ionicons name="cloud-upload-outline" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Belgeyi Kaydet</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={expiryDate || new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={new Date()}
        />
      )}

      {/* Custom Alert */}
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
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  formSection: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  formCard: {
    borderRadius: 12,
    padding: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
  },
  fileButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  fileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  buttonSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    paddingVertical: 14,
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
})

export default CreateCertificateScreen
