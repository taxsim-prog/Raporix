"use client"

import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Platform } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "../../theme/ThemeContext"
import CustomAlert from "../../components/CustomAlert"
import EquipmentApi, { EquipmentOut } from "../../api/equipment"
import DateTimePicker from '@react-native-community/datetimepicker'
import { pick, types } from '@react-native-documents/picker'

interface EditEquipmentScreenProps {
  navigation: any
  route: {
    params: {
      equipmentId: string
    }
  }
}

const EQUIPMENT_TYPES = [
  { id: 'topraklama', label: 'Topraklama Megeri', icon: 'flash' },
  { id: 'termal', label: 'Termal Kamera', icon: 'thermometer' },
]

const EditEquipmentScreen = ({ navigation, route }: EditEquipmentScreenProps) => {
  const { theme } = useTheme()
  const { equipmentId } = route.params
  const [loading, setLoading] = useState(true)
  const [equipment, setEquipment] = useState<EquipmentOut | null>(null)
  const [equipmentName, setEquipmentName] = useState("")
  const [equipmentType, setEquipmentType] = useState("")
  const [serialNumber, setSerialNumber] = useState("")
  const [calibrationDate, setCalibrationDate] = useState<Date | null>(null)
  const [calibrationExpiryDate, setCalibrationExpiryDate] = useState<Date | null>(null)
  const [calibrationNumber, setCalibrationNumber] = useState("")
  const [certificateFile, setCertificateFile] = useState<any>(null)
  const [showTypePicker, setShowTypePicker] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false)
  const [saving, setSaving] = useState(false)
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{
    title: string
    message: string
    type: 'success' | 'error' | 'warning' | 'info'
    onConfirm?: () => void
    showCancel?: boolean
    confirmText?: string
    cancelText?: string
  }>({
    title: '',
    message: '',
    type: 'info',
  })

  useEffect(() => {
    loadEquipment()
  }, [equipmentId])

  const loadEquipment = async () => {
    setLoading(true)
    try {
      const data = await EquipmentApi.get(equipmentId)
      setEquipment(data)
      setEquipmentName(data.equipment_name)
      setEquipmentType(data.equipment_type)
      setSerialNumber(data.serial_number)
      if (data.calibration_date) {
        setCalibrationDate(new Date(data.calibration_date))
      }
      if (data.calibration_expiry_date) {
        setCalibrationExpiryDate(new Date(data.calibration_expiry_date))
      }
      if (data.calibration_number) {
        setCalibrationNumber(data.calibration_number)
      }
    } catch (error: any) {
      console.error('[EditEquipmentScreen] Yükleme hatası:', error)
      showAlert({
        title: 'Hata',
        message: error?.message || 'Ekipman yüklenirken bir hata oluştu.',
        type: 'error',
        onConfirm: () => navigation.goBack(),
      })
    } finally {
      setLoading(false)
    }
  }

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config)
    setAlertVisible(true)
  }

  const handleAlertConfirm = () => {
    setAlertVisible(false)
    alertConfig.onConfirm?.()
  }

  const handlePickDocument = async () => {
    try {
      const result = await pick({
        type: [types.pdf],
      })

      if (result && result.length > 0) {
        const [file] = result
        setCertificateFile({
          uri: file.uri,
          name: file.name,
          type: file.type,
        })
      }
    } catch (error: any) {
      // User cancelled the picker
      if (error && error.message && error.message.includes('cancel')) {
        return
      }
      console.error('Dosya seçme hatası:', error)
      showAlert({
        title: 'Hata',
        message: 'Dosya seçilirken bir hata oluştu.',
        type: 'error',
      })
    }
  }

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setCalibrationDate(selectedDate)
    }
  }

  const handleExpiryDateChange = (event: any, selectedDate?: Date) => {
    setShowExpiryDatePicker(Platform.OS === 'ios')
    if (selectedDate) {
      setCalibrationExpiryDate(selectedDate)
    }
  }

  const validateForm = () => {
    if (!equipmentName.trim()) {
      showAlert({
        title: 'Uyarı',
        message: 'Lütfen ekipman adı girin.',
        type: 'warning',
      })
      return false
    }

    if (!equipmentType) {
      showAlert({
        title: 'Uyarı',
        message: 'Lütfen ekipman tipi seçin.',
        type: 'warning',
      })
      return false
    }

    if (!serialNumber.trim()) {
      showAlert({
        title: 'Uyarı',
        message: 'Lütfen seri numarası girin.',
        type: 'warning',
      })
      return false
    }

    if (!calibrationExpiryDate) {
      showAlert({
        title: 'Uyarı',
        message: 'Lütfen kalibrasyon geçerlilik tarihi seçin.',
        type: 'warning',
      })
      return false
    }

    return true
  }

  const handleSave = async () => {
    if (!validateForm()) return

    setSaving(true)
    try {
      // Ekipmanı güncelle
      await EquipmentApi.update(equipmentId, {
        equipment_name: equipmentName,
        equipment_type: equipmentType,
        serial_number: serialNumber,
        calibration_date: calibrationDate?.toISOString(),
        calibration_expiry_date: calibrationExpiryDate?.toISOString(),
        calibration_number: calibrationNumber || undefined,
      })

      // PDF varsa yükle
      if (certificateFile) {
        try {
          await EquipmentApi.uploadCertificate(equipmentId, {
            uri: certificateFile.uri,
            name: certificateFile.name,
            type: certificateFile.mimeType || 'application/pdf',
          })
        } catch (uploadError) {
          console.error('Belge yükleme hatası:', uploadError)
        }
      }

      showAlert({
        title: 'Başarılı',
        message: 'Ekipman başarıyla güncellendi.',
        type: 'success',
        onConfirm: () => {
          navigation.goBack()
        },
      })
    } catch (error: any) {
      console.error('[EditEquipmentScreen] Kaydetme hatası:', error)
      showAlert({
        title: 'Hata',
        message: error?.message || 'Ekipman güncellenirken bir hata oluştu.',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  const getSelectedTypeLabel = () => {
    const type = EQUIPMENT_TYPES.find(t => t.id === equipmentType)
    return type ? type.label : 'Seçiniz'
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={theme.primary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ekipman Düzenle</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.formSection}>
          {/* Ekipman Adı */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Ekipman Adı <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="pricetag-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={equipmentName}
                onChangeText={setEquipmentName}
                placeholder="Örn: Topraklama Megeri 1"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          {/* Ekipman Tipi */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Ekipman Tipi <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.pickerButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setShowTypePicker(true)}
            >
              <Text style={[styles.pickerButtonText, { color: equipmentType ? theme.text : theme.textSecondary }]}>
                {getSelectedTypeLabel()}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Seri No */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Seri No <Text style={styles.required}>*</Text>
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="barcode-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={serialNumber}
                onChangeText={setSerialNumber}
                placeholder="Örn: SN123456789"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          {/* Kalibrasyon Tarihi */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Kalibrasyon Tarihi
            </Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.dateButtonText, { color: calibrationDate ? theme.text : theme.textSecondary }]}>
                {calibrationDate ? calibrationDate.toLocaleDateString('tr-TR') : 'Tarih Seçiniz'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Kalibrasyon Geçerlilik Tarihi */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Kalibrasyon Geçerlilik Tarihi <Text style={styles.required}>*</Text>
            </Text>
            <TouchableOpacity
              style={[styles.dateButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => setShowExpiryDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} />
              <Text style={[styles.dateButtonText, { color: calibrationExpiryDate ? theme.text : theme.textSecondary }]}>
                {calibrationExpiryDate ? calibrationExpiryDate.toLocaleDateString('tr-TR') : 'Tarih Seçiniz'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Kalibrasyon Numarası */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              Kalibrasyon Numarası
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Ionicons name="document-text-outline" size={20} color={theme.textSecondary} />
              <TextInput
                style={[styles.input, { color: theme.text }]}
                value={calibrationNumber}
                onChangeText={setCalibrationNumber}
                placeholder="Örn: KAL-2025-001"
                placeholderTextColor={theme.textSecondary}
              />
            </View>
          </View>

          {/* Mevcut Belge */}
          {equipment?.calibration_certificate_path && (
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Mevcut Belge</Text>
              <View style={[styles.currentFileContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="document-text" size={20} color={theme.primary} />
                <Text style={[styles.currentFileText, { color: theme.text }]}>Belge Mevcut</Text>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              </View>
            </View>
          )}

          {/* Yeni Kalibrasyon Belgesi */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>
              {equipment?.calibration_certificate_path ? 'Yeni Belge Yükle (PDF)' : 'Kalibrasyon Belgesi (PDF)'}
            </Text>
            <TouchableOpacity
              style={[styles.fileButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={handlePickDocument}
            >
              <Ionicons name="document-attach-outline" size={20} color={theme.primary} />
              <Text style={[styles.fileButtonText, { color: theme.text }]}>
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
                  Yeni dosya seçildi
                </Text>
              </View>
            )}
          </View>

          {/* Kaydet Butonu */}
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: theme.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Güncelle</Text>
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
                    equipmentType === type.id && { borderColor: theme.primary, backgroundColor: theme.primary + '10' }
                  ]}
                  onPress={() => {
                    setEquipmentType(type.id)
                    setShowTypePicker(false)
                  }}
                >
                  <Ionicons 
                    name={type.icon} 
                    size={24} 
                    color={equipmentType === type.id ? theme.primary : theme.textSecondary} 
                  />
                  <Text style={[
                    styles.pickerOptionText, 
                    { color: equipmentType === type.id ? theme.primary : theme.text }
                  ]}>
                    {type.label}
                  </Text>
                  {equipmentType === type.id && (
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
        onCancel={() => setAlertVisible(false)}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
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
    fontSize: 18,
    fontWeight: "700",
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
  formSection: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  required: {
    color: "#EF4444",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  pickerButtonText: {
    fontSize: 16,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dateButtonText: {
    fontSize: 16,
    marginLeft: 12,
  },
  currentFileContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  currentFileText: {
    flex: 1,
    fontSize: 16,
  },
  fileButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  fileButtonText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 12,
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
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
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
})

export default EditEquipmentScreen
