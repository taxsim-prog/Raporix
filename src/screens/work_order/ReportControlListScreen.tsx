"use client"

import type React from "react"
import { useState } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import { useTheme } from "../../theme/ThemeContext"

interface ControlItem {
  id: string
  title: string
  evaluation: "Uygun" | "Uygun Değil" | "Uygulanamaz" | "Hafif Kusur" | ""
}

interface ControlSection {
  id: string
  title: string
  items: ControlItem[]
}

interface ControlChecklistScreenProps {
  navigation?: any
  route?: {
    params: {
      workOrderId: number
      reportTypeId: number
      panelId: string
      panelName: string
      reportData?: any
    }
  }
}

const ReportControlListScreen: React.FC<ControlChecklistScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme()
  const [sequenceNumber, setSequenceNumber] = useState("")
  const [panelName, setPanelName] = useState(route?.params?.panelName || "")

  const evaluationOptions = ["Uygun", "Uygun Değil", "Uygulanamaz", "Hafif Kusur"]

  const [controlSections, setControlSections] = useState<ControlSection[]>([
    {
      id: "panel_access",
      title: "PANO VE DİĞER DONANIMLARA GİRİŞİN UYGUNLUĞU",
      items: [
        { id: "cable_network", title: "Kablo şebeke tarafı", evaluation: "" },
        { id: "cable_load", title: "Kablo donanım tarafı", evaluation: "" },
        { id: "panel_fixing", title: "Pano sabitlenmesi (Depreme dayanıklılık)", evaluation: "" },
        { id: "external_protection", title: "Dış darbelere karşı koruma önlemi", evaluation: "" },
        { id: "foreign_materials", title: "Elektrik panosu etrafında yabancı malzemeler", evaluation: "" },
        { id: "ground_isolation", title: "Zemin izolasyonu", evaluation: "" },
      ],
    },
    {
      id: "grounding",
      title:
        "TOPRAKLANMIŞ POTANSİYEL DENGELEME VE BESLEMENİN OTOMATİK KESİLMESİ, ELEKTRİK ÇARPMASINA (DOLAYLI DOKUNMAYA) KARŞI KORUMA",
      items: [
        { id: "grounding_conductor", title: "Topraklama iletkeni", evaluation: "" },
        { id: "main_potential", title: "Ana potansiyel dengeleme iletkeni", evaluation: "" },
        { id: "additional_potential", title: "Ek Potansiyel dengeleme İletkeni (Tamamlayıcı pot.den)", evaluation: "" },
        { id: "panel_connection", title: "Pano kapak bağlantısı kontrolü 6 mm²", evaluation: "" },
      ],
    },
    {
      id: "harmful_effects",
      title: "KARŞILIKLI ZARARLI ETKİLERİN ÖNLENMESİ",
      items: [
        {
          id: "non_electrical_approach",
          title: "Elektriksel olmayan tesislere yaklaşma ve diğer etkilerin kontrolü",
          evaluation: "",
        },
        { id: "isolation_separation", title: "Bant I ve Bant II ayrılması, Bant II yalıtımı", evaluation: "" },
        { id: "safety_circuit", title: "Güvenlik devre ayrılması", evaluation: "" },
        { id: "internal_protection", title: "Pano iç kapak, faza erişim engeli veya pleksi koruma", evaluation: "" },
      ],
    },
    {
      id: "identification",
      title: "TANIMLAMA",
      items: [
        { id: "symbols_instructions", title: "Semalar, talimatlar, devre çizimleri ve kısa bilgiler", evaluation: "" },
        { id: "protection_device_label", title: "Koruma cihaz ve terminal etiket", evaluation: "" },
        { id: "danger_warning", title: "Tehlike işaretleri ve diğer uyarı işaretleri", evaluation: "" },
      ],
    },
    {
      id: "cables_conductors",
      title: "KABLO ve İLETKENLER",
      items: [
        { id: "cable_suitability", title: "Kablo yollarının uygunluğu ve mekanik koruma", evaluation: "" },
        { id: "cable_colors", title: "Kablo renk kodları Nötr: Mavi Toprak: Sarı/ Yeşil", evaluation: "" },
        { id: "resistance_method", title: "Tesisat yöntemi", evaluation: "" },
        {
          id: "fire_protection",
          title: "Yangın engeli, uygun kilitleme ve sıcaklık etkisine karşı koruma",
          evaluation: "",
        },
      ],
    },
    {
      id: "thermal_camera",
      title: "TERMAL KAMERA",
      items: [
        { id: "photo_date", title: "Fotoğraf tarihi", evaluation: "" },
        { id: "contact_heating", title: "Kontak gevşekliği ısınması", evaluation: "" },
        { id: "photo_number", title: "Fotoğraf no.", evaluation: "" },
        { id: "overheating_pvc", title: "Aşırı yük ısınması PVC kablolar için >70 derece", evaluation: "" },
      ],
    },
    {
      id: "general_evaluation",
      title: "GENEL DEĞERLENDİRMELER",
      items: [
        {
          id: "equipment_fire_extinguisher",
          title: "Ekipman yakınında elektriksel ekipman yangın söndürme tertibatı",
          evaluation: "",
        },
        { id: "equipment_cleanliness", title: "Ekipman temizlik/bakım durumu", evaluation: "" },
        { id: "panel_connection_corrosion", title: "Pano içi ve bağlantılarının korozyon kontrolü", evaluation: "" },
        {
          id: "emergency_lighting",
          title: "Ekipman içi veya yakınında acil durum aydınlatma tertibatı",
          evaluation: "",
        },
      ],
    },
  ])

  const updateItemEvaluation = (sectionId: string, itemId: string, evaluation: string) => {
    setControlSections((prev) =>
      prev.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map((item) =>
                item.id === itemId ? { ...item, evaluation: evaluation as any } : item,
              ),
            }
          : section,
      ),
    )
  }

  const getEvaluationColor = (evaluation: string) => {
    switch (evaluation) {
      case "Uygun":
        return "#10B981"
      case "Uygun Değil":
        return "#EF4444"
      case "Uygulanamaz":
        return "#9CA3AF"
      case "Hafif Kusur":
        return "#F59E0B"
      default:
        return "#E5E7EB"
    }
  }

  const handleSave = () => {
    if (!sequenceNumber || !panelName) {
      Alert.alert("Hata", "Lütfen sıra numarası ve pano adını girin")
      return
    }

    // Check if all items are evaluated
    const unevaluatedItems = controlSections.some((section) => section.items.some((item) => !item.evaluation))

    if (unevaluatedItems) {
      Alert.alert("Uyarı", "Bazı kontrol kriterleri değerlendirilmemiş. Devam etmek istiyor musunuz?", [
        { text: "İptal", style: "cancel" },
        { text: "Devam Et", onPress: saveAndContinue },
      ])
    } else {
      saveAndContinue()
    }
  }

  const saveAndContinue = () => {
    // Save checklist data
    const checklistData = { sequenceNumber, panelName, controlSections };
    console.log("Checklist saved:", checklistData);
    navigation?.navigate('ReportFuncControl', {
      workOrderId: route?.params?.workOrderId,
      reportData: route?.params?.reportData,
      checklistData: checklistData
    });
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    header: { backgroundColor: theme.headerBackground, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16 },
    backButton: { width: 40 },
    headerTitle: { fontSize: 18, fontWeight: "bold", color: theme.headerText, flex: 1, textAlign: "center" },
    saveButton: { width: 60, alignItems: "flex-end" },
    saveButtonText: { color: theme.headerText, fontSize: 16, fontWeight: "600" },
    scrollView: { flex: 1 },
    section: { marginBottom: 16, paddingHorizontal: 16 },
    sectionTitle: { fontSize: 16, fontWeight: "700", color: theme.text, marginBottom: 12 },
    formContainer: { backgroundColor: theme.card, borderRadius: 8, padding: 16, borderWidth: 1, borderColor: theme.border },
    inputContainer: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: "600", color: theme.text, marginBottom: 6 },
    textInput: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: theme.text },
    controlContainer: { gap: 16 },
    controlItem: { backgroundColor: theme.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.border },
    controlItemTitle: { fontSize: 15, fontWeight: "600", color: theme.text, marginBottom: 12 },
    evaluationContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    evaluationOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
    evaluationText: { fontSize: 14, fontWeight: "500" },
    continueButton: { backgroundColor: theme.primary, borderRadius: 8, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "center" },
    continueButtonText: { color: theme.headerText, fontSize: 16, fontWeight: "600", marginRight: 8 },
    bottomPadding: { height: 40 },
  })

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation?.goBack()}>
          <Ionicons name="chevron-back" size={24} color={theme.headerText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kontrol Kriterleri</Text>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Kaydet</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Panel Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pano Bilgileri</Text>
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Sıra Numarası *</Text>
              <TextInput
                style={styles.textInput}
                value={sequenceNumber}
                onChangeText={setSequenceNumber}
                placeholder="Sıra numarasını girin"
                placeholderTextColor={theme.textTertiary}
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Pano Adı/Ekipman Tanımlaması *</Text>
              <TextInput
                style={styles.textInput}
                value={panelName}
                onChangeText={setPanelName}
                placeholder="Pano adını girin"
                placeholderTextColor={theme.textTertiary}
                editable={!route?.params?.panelName} // Eğer pano listesinden gelindiyse düzenlenemez
              />
            </View>
          </View>
        </View>

        {/* Control Sections */}
        {controlSections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.controlContainer}>
              {section.items.map((item) => (
                <View key={item.id} style={styles.controlItem}>
                  <Text style={styles.controlItemTitle}>{item.title}</Text>
                  <View style={styles.evaluationContainer}>
                    {evaluationOptions.map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.evaluationOption,
                          { backgroundColor: item.evaluation === option ? getEvaluationColor(option) : "#F3F4F6" },
                        ]}
                        onPress={() => updateItemEvaluation(section.id, item.id, option)}
                      >
                        <Text
                          style={[styles.evaluationText, { color: item.evaluation === option ? "#FFFFFF" : theme.textSecondary }]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Continue Button Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.continueButton} onPress={handleSave}>
            <Text style={styles.continueButtonText}>Devam Et</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.headerText} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  )
}

export default ReportControlListScreen
