"use client"

import type React from "react"
import { useState, useLayoutEffect, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import FormsApi from "../../api/forms"
import { useTheme } from "../../theme/ThemeContext"
import CustomAlert from "../../components/CustomAlert"

interface ReportFormData {
  companyName: string
  controlAddress: string
  weather: string
  groundCondition: string
  networkType: string
  networkVoltage: string
  groundingType: string
  hasProject: string
  hasSingleLineSchema: string
  buildingType: string
  equipmentUsage: string
  energyProvider: string
  controlReason: string
  lastControlDate: string
  indirectTouchProtection: string
  projectInfo: string
  phaseCount: string
  nominalVoltage: string
  nominalFrequency: string
  faultCurrentProbability: string
  externalCircuitImpedance: string
  mainBreakerType: string
  mainBreakerNominalCurrent: string
  mainRcdNominalCurrent: string
  mainRcdTestCurrent: string
  mainRcdTestTime: string
  hasComprehensiveChange: string
  hasOvervoltageProtection: string
  hasPreviousPeriodicControlOptions: string
}

interface ReportFormScreenProps {
  navigation?: any
  route?: {
    params: {
      workOrderId: number
    }
  }
}

const ReportGeneralInfoScreen: React.FC<ReportFormScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme()
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({
    title: '',
    message: '',
    type: 'info',
  })
  const [existingFormId, setExistingFormId] = useState<string | null>(null)
  const [formData, setFormData] = useState<ReportFormData>({
    companyName: "",
    controlAddress: "",
    weather: "",
    groundCondition: "",
    networkType: "",
    networkVoltage: "",
    groundingType: "",
    hasProject: "",
    hasSingleLineSchema: "",
    buildingType: "",
    equipmentUsage: "",
    energyProvider: "",
    controlReason: "",
    lastControlDate: "",
    indirectTouchProtection: "",
    projectInfo: "",
    phaseCount: "",
    nominalVoltage: "0,23",
    nominalFrequency: "50",
    faultCurrentProbability: "",
    externalCircuitImpedance: "",
    mainBreakerType: "TMŞ",
    mainBreakerNominalCurrent: "100",
    mainRcdNominalCurrent: "",
    mainRcdTestCurrent: "",
    mainRcdTestTime: "",
    hasComprehensiveChange: "",
    hasOvervoltageProtection: "",
    hasPreviousPeriodicControlOptions: "",
  })

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Daha önce kaydedilmiş verileri yükle
  useEffect(() => {
    const loadExistingForm = async () => {
      if (!route?.params?.workOrderId) return

      try {
        const forms = await FormsApi.list({
          form_name: "main_panel_control",
          work_order_id: route.params.workOrderId,
          limit: 1
        })

        if (forms && forms.length > 0) {
          const existingForm = forms[0]
          setExistingFormId(existingForm.id)

          // Formdaki data'yı yükle
          if (existingForm.data) {
            setFormData(prev => ({
              ...prev,
              ...existingForm.data
            }))
          }
        }
      } catch (e) {
        console.error("Mevcut form yüklenemedi:", e)
      } finally {
        setIsLoading(false)
      }
    }
    loadExistingForm()
  }, [route?.params?.workOrderId])

  const updateFormData = (field: keyof ReportFormData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }

      // Hata akımı olasılığını otomatik hesapla: Nominal gerilim / Dış empedans
      if (field === 'nominalVoltage' || field === 'externalCircuitImpedance') {
        const nominalVoltage = field === 'nominalVoltage' ? value : prev.nominalVoltage
        const externalImpedance = field === 'externalCircuitImpedance' ? value : prev.externalCircuitImpedance

        // Virgüllü sayıları parse et
        const voltageNum = parseFloat(nominalVoltage.replace(',', '.'))
        const impedanceNum = parseFloat(externalImpedance.replace(',', '.'))

        if (!isNaN(voltageNum) && !isNaN(impedanceNum) && impedanceNum !== 0) {
          // kV -> V dönüşümü (0,23 kV = 230 V) ve hesaplama
          const faultCurrent = (voltageNum * 1000) / impedanceNum
          newData.faultCurrentProbability = faultCurrent.toFixed(2).replace('.', ',')
        }
      }

      return newData
    })
  }

  const mainBreakerTypeOptions = ["TMŞ", "Otomatik Sigorta", "ATS", "MKŞ", "Diğer"]
  const rcdNominalCurrentOptions = ["30", "300", "1000"]

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info', onConfirm?: () => void) => {
    setAlertConfig({ title, message, type, onConfirm })
    setAlertVisible(true)
  }

  const handleSave = async () => {
    try {
      const payload = {
        form_name: "main_panel_control",
        data: formData,
        work_order_id: route?.params?.workOrderId
      }

      // Mevcut form varsa güncelle, yoksa yeni oluştur
      if (existingFormId) {
        await FormsApi.update(existingFormId, payload)
      } else {
        const result = await FormsApi.create(payload)
        setExistingFormId(result.id)
      }

      showAlert(
        "Başarılı",
        "Ana pano bilgileri başarıyla kaydedildi",
        "success",
        () => navigation?.goBack()
      )
    } catch (e: any) {
      showAlert(
        "Hata",
        e?.message || "Kaydetme sırasında bir hata oluştu",
        "error"
      )
    }
  }

  const handleContinue = () => {
    // Form validation
    if (!formData.companyName || !formData.controlAddress) {
      showAlert("Hata", "Lütfen zorunlu alanları doldurun", "error")
      return
    }

    // Navigate to control checklist screen
    navigation?.navigate("ReportControlList", {
      workOrderId: route?.params?.workOrderId,
      reportData: formData,
    })
  }

  const renderDropdown = (
    label: string,
    value: string,
    options: string[],
    field: keyof ReportFormData,
    required = false,
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={styles.dropdownContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.dropdownOption, value === option && styles.selectedOption]}
            onPress={() => updateFormData(field, option)}
          >
            <Text style={[styles.dropdownOptionText, value === option && styles.selectedOptionText]}>{option}</Text>
            {value === option && <Ionicons name="checkmark" size={14} color={theme.primary} />}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  const renderTextInput = (
    label: string,
    value: string,
    field: keyof ReportFormData,
    placeholder: string,
    required = false,
    multiline = false,
    keyboardType: 'default' | 'numeric' = 'default',
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[styles.textInput, multiline && styles.textArea]}
        value={value}
        onChangeText={(text) => updateFormData(field, text)}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
        textAlignVertical={multiline ? "top" : "center"}
        keyboardType={keyboardType}
      />
    </View>
  )

  useLayoutEffect(() => {
    navigation?.setOptions({
      title: "Ana Pano",
      headerStyle: { backgroundColor: theme.headerBackground },
      headerTintColor: theme.headerText,
      headerTitleStyle: { fontSize: 16, fontWeight: "bold" },
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 16 }} onPress={handleSave}>
          <Text style={{ color: theme.headerText, fontSize: 14, fontWeight: "600" }}>Kaydet</Text>
        </TouchableOpacity>
      ),
    })
  }, [navigation, handleSave, theme])

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      marginTop: 20,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 16,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 12,
      letterSpacing: 0.3,
    },
    formContainer: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    inputContainer: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
    },
    required: {
      color: theme.error,
    },
    textInput: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.text,
    },
    textArea: {
      minHeight: 80,
      paddingTop: 10,
    },
    dropdownContainer: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      overflow: "hidden",
    },
    dropdownOption: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    selectedOption: {
      backgroundColor: theme.surfaceVariant,
    },
    dropdownOptionText: {
      fontSize: 14,
      color: theme.text,
    },
    selectedOptionText: {
      fontWeight: "600",
      color: theme.primary,
    },
    bottomPadding: {
      height: 40,
    },
  })

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>

        {/* Besleme Kaynağı Karakteristikleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Besleme Kaynağı Karakteristikleri</Text>
          <View style={styles.formContainer}>
            {renderTextInput(
              "Nominal gerilim, U/Uo (kV) :",
              formData.nominalVoltage,
              "nominalVoltage",
              "kV değerini girin",
              false,
              false,
              "numeric",
            )}
            {renderTextInput(
              "Nominal frekans, f (Hz) :",
              formData.nominalFrequency,
              "nominalFrequency",
              "Hz değerini girin",
              false,
              false,
              "numeric",
            )}
            {renderTextInput(
              "Hata Akımı Olasılığı, IF (kA) :",
              formData.faultCurrentProbability,
              "faultCurrentProbability",
              "kA değerini girin",
              false,
              false,
              "numeric",
            )}
            {renderTextInput(
              "Dış çevrim empedansı ZE (Ω) :",
              formData.externalCircuitImpedance,
              "externalCircuitImpedance",
              "Ω değerini girin",
              false,
              false,
              "numeric",
            )}
          </View>
        </View>


        {/* Ana Kesici Karakteristikleri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ana Kesici Karakteristikleri</Text>
          <View style={styles.formContainer}>
            {renderDropdown("Tip :", formData.mainBreakerType, mainBreakerTypeOptions, "mainBreakerType")}
            {renderTextInput(
              "Nominal Akım (A) :",
              formData.mainBreakerNominalCurrent,
              "mainBreakerNominalCurrent",
              "Akım değerini girin",
              false,
              false,
              "numeric",
            )}
          </View>
        </View>

        {/* RCD Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TT-TN-S Şebeke RCD Bilgileri</Text>
          <View style={styles.formContainer}>
            {renderDropdown(
              "Ana RCD anma akımı (mA) :",
              formData.mainRcdNominalCurrent,
              rcdNominalCurrentOptions,
              "mainRcdNominalCurrent"
            )}
            {renderTextInput(
              "Ana RCD test akımı (mA) :",
              formData.mainRcdTestCurrent,
              "mainRcdTestCurrent",
              "mA değerini girin",
              false,
              false,
              "numeric",
            )}
            {renderTextInput(
              "Ana RCD test süresi (ms) :",
              formData.mainRcdTestTime,
              "mainRcdTestTime",
              "ms değerini girin",
              false,
              false,
              "numeric",
            )}
          </View>
        </View>


        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          setAlertVisible(false)
          alertConfig.onConfirm?.()
        }}
        confirmText="Tamam"
      />
    </SafeAreaView>
  )
}

export default ReportGeneralInfoScreen
