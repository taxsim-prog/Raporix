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
  detectedInformation: string[]
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
    weather: "Açık",
    groundCondition: "Kuru",
    networkType: "TT",
    networkVoltage: "400",
    groundingType: "Temel",
    hasProject: "Yok",
    hasSingleLineSchema: "Yok",
    buildingType: "Endüstri",
    equipmentUsage: "Fabrika",
    energyProvider: "",
    controlReason: "İlk Kontrol",
    lastControlDate: "",
    indirectTouchProtection: "Eş Potansiyel Topraklama",
    projectInfo: "",
    phaseCount: "(3 faz, 3 tel)",
    nominalVoltage: "",
    nominalFrequency: "",
    faultCurrentProbability: "",
    externalCircuitImpedance: "",
    mainBreakerType: "",
    mainBreakerNominalCurrent: "",
    mainRcdNominalCurrent: "",
    mainRcdTestCurrent: "",
    mainRcdTestTime: "",
    hasComprehensiveChange: "Yok",
    hasOvervoltageProtection: "Hayır",
    hasPreviousPeriodicControlOptions: "Var",
    detectedInformation: ["Gerilim altındaki bölümlerin yalıtılması (iç kapak veya pleksi koruma)"],
  })

  const [showDatePicker, setShowDatePicker] = useState(false)

  const updateFormData = (field: keyof ReportFormData, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // Mevcut formu yükle
  useEffect(() => {
    const loadExistingForm = async () => {
      if (!route?.params?.workOrderId) return
      
      try {
        const forms = await FormsApi.list({
          form_name: "general_info",
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
      }
    }
    
    loadExistingForm()
  }, [route?.params?.workOrderId])

  const updateMultiSelectFormData = (field: keyof ReportFormData, value: string) => {
    setFormData((prev) => {
      const currentValues = prev[field] as string[]
      const isSelected = currentValues.includes(value)
      
      if (isSelected) {
        return { ...prev, [field]: currentValues.filter(item => item !== value) }
      } else {
        return { ...prev, [field]: [...currentValues, value] }
      }
    })
  }

  const weatherOptions = ["Açık", "Kapalı", "Yağışlı"]
  const groundOptions = ["Kuru", "Nemli", "Islak"]
  const networkTypeOptions = ["TT", "IT", "TN", "(TN-CS)", "(TN-C)", "(TN-S)"]
  const groundingTypeOptions = ["Ring", "Yüzeysel", "Temel", "Derin", "Belirlenemedi"]
  const yesNoOptions = ["Var", "Yok"]
  const buildingTypeOptions = ["Ev", "Ticari", "Endüstri", "Diğer"]
  const equipmentUsageOptions = ["Konut", "Ofis", "Fabrika", "Otel", "Diğer"]
  const controlReasonOptions = ["Periyodik Kontrol", "İlk Kontrol"]
  const hasPreviousPeriodicControlOptions = ["Var", "Yok"]
  const detectedInformationOptions = [
    "Gerilim altındaki bölümlerin yalıtılması (iç kapak veya pleksi koruma)",
    "Mahfaza (IPXY, Pan kilidi, tehlike işareti vb.)",
    "Engel",
    "El ulaşma uzaklığı dışına yerleştirme",
    "İlave koruma",
    "30 mA RCD (5xl için 40 ms açma zamanı); devre kesicisi < 32 A devreler için (TS HD 60364-4-41)"
  ]
  const protectionOptions = ["Eş Potansiyel Topraklama", "Koruyucu Ayırma", "Küçük Gerilim", "Koruyucu Yalıtım"]
  const phaseCountOptions = [
    "AA",
    "(1 faz, 2 tel)",
    "(1 faz, 3 tel)",
    "(2 faz, 3 tel)",
    "(3 faz, 3 tel)",
    "(3 faz, 4 tel)",
  ]
  const yesNoOptions2 = ["Evet", "Hayır"]

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info', onConfirm?: () => void) => {
    setAlertConfig({ title, message, type, onConfirm })
    setAlertVisible(true)
  }

  const handleSave = async () => {
    try {
      const payload = {
        form_name: "general_info",
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
        "Rapor bilgileri başarıyla kaydedildi",
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
            <View style={styles.checkmarkContainer}>
              {value === option && <Ionicons name="checkmark" size={14} color={theme.primary} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  )

  const renderMultiSelectDropdown = (
    label: string,
    values: string[],
    options: string[],
    field: keyof ReportFormData,
    required = false,
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <View style={styles.dropdownContainer}>
        {options.map((option) => {
          const isSelected = values.includes(option)
          return (
            <TouchableOpacity
              key={option}
              style={[styles.dropdownOption, isSelected && styles.selectedOption]}
              onPress={() => updateMultiSelectFormData(field, option)}
            >
              <Text style={[styles.dropdownOptionText, isSelected && styles.selectedOptionText]}>
                {option}
              </Text>
              <View style={styles.checkmarkContainer}>
                {isSelected && <Ionicons name="checkmark" size={14} color={theme.primary} />}
              </View>
            </TouchableOpacity>
          )
        })}
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
      />
    </View>
  )

  useLayoutEffect(() => {
    navigation?.setOptions({
      title: "Genel Bilgiler",
      headerStyle: { backgroundColor: theme.headerBackground },
      headerTintColor: theme.headerText,
      headerTitleStyle: { fontSize: 18, fontWeight: "bold" },
      headerRight: () => (
        <TouchableOpacity style={{ marginRight: 16 }} onPress={handleSave}>
          <Text style={{ color: theme.headerText, fontSize: 16, fontWeight: "600" }}>Kaydet</Text>
        </TouchableOpacity>
      ),
    })
  }, [navigation, handleSave, theme])

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
      paddingHorizontal: 16,
      marginTop: 24,
    },
    section: {
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 12,
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
    checkmarkContainer: {
      width: 20,
      alignItems: "center",
    },
    bottomPadding: {
      height: 40,
    },
  })

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Genel Bilgiler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Genel Bilgiler</Text>
          <View style={styles.formContainer}>
            {renderDropdown("Hava Durumu :", formData.weather, weatherOptions, "weather")}
            {renderDropdown("Zemin Durumu :", formData.groundCondition, groundOptions, "groundCondition")}
          </View>
        </View>

        {/* Şebeke Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Şebeke Bilgileri</Text>
          <View style={styles.formContainer}>
            {renderTextInput(
              "Enerji Sağlayan Kuruluş :",
              formData.energyProvider,
              "energyProvider",
              "Kuruluş adını girin",
            )}
            {renderDropdown("Şebeke Tipi :", formData.networkType, networkTypeOptions, "networkType")}
            {renderTextInput("Şebeke Gerilimi : (V)", formData.networkVoltage, "networkVoltage", "Gerilim değerini girin")}
            {renderDropdown("Topraklayıcı Tipi :", formData.groundingType, groundingTypeOptions, "groundingType")}
            {renderDropdown("Faz İletkenlerin Sayısı :", formData.phaseCount, phaseCountOptions, "phaseCount")}
          </View>
        </View>

        {/* Tesis Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tesis Bilgileri</Text>
          <View style={styles.formContainer}>
            {renderDropdown("Tesise Ait Proje var mı? :", formData.hasProject, yesNoOptions, "hasProject")}
            {renderDropdown("Tek Hat Şeması var mı? :", formData.hasSingleLineSchema, yesNoOptions, "hasSingleLineSchema")}
            {renderDropdown("Yapı Cinsi :", formData.buildingType, buildingTypeOptions, "buildingType")}
            {renderDropdown("Ekipman Kullanım Amacı :", formData.equipmentUsage, equipmentUsageOptions, "equipmentUsage")}


            {renderTextInput(
              "Proje Bilgileri :",
              formData.projectInfo,
              "projectInfo",
              "Proje detaylarını girin",
              false,
              true,
            )}
          </View>
        </View>

        {/* Kontrol Bilgileri */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kontrol Bilgileri</Text>
          <View style={styles.formContainer}>
            {renderDropdown("Kontrol Nedeni :", formData.controlReason, controlReasonOptions, "controlReason")}
            {renderTextInput("Son Kontrol Tarihi :", formData.lastControlDate, "lastControlDate", "GG.AA.YYYY")}
            {renderDropdown(
              "Dolaylı Dokunmaya Karşı Koruma Önlemi :",
              formData.indirectTouchProtection,
              protectionOptions,
              "indirectTouchProtection",
            )}
            {renderDropdown(
              "Tesisatta Kapsamlı Değişiklik var mı? :",
              formData.hasComprehensiveChange,
              yesNoOptions,
              "hasComprehensiveChange",
            )}
            {renderDropdown(
              "Tesisatta aşırı gerilim koruma cihazları (DKD/SPD) kullanılmış mı? :",
              formData.hasOvervoltageProtection,
              yesNoOptions2,
              "hasOvervoltageProtection",
            )}
            {renderMultiSelectDropdown(
              "Tespit edilen bilgiler :",
              formData.detectedInformation,
              detectedInformationOptions,
              "detectedInformation",
            )}
            {renderDropdown(
              "Bir önceki periyodik kontrol etiketi var mı?",
              formData.hasPreviousPeriodicControlOptions,
              hasPreviousPeriodicControlOptions,
              "hasPreviousPeriodicControlOptions",
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
