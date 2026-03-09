import React, { useState, useLayoutEffect, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import FormsApi from "../../api/forms";
import { useTheme } from "../../theme/ThemeContext";
import CustomAlert from "../../components/CustomAlert";

// Interfaces
interface LightningProtectionNavigatorScreenProps {
  navigation?: any;
  route?: {
    params: {
      workOrderId: number;
      reportData?: any;
    };
  };
}

type PageType =
  | 'detected-info'
  | 'control-criteria'
  | 'paratoner-controls'
  | 'faraday-controls'
  | 'defects'
  | 'notes'
  | 'conclusion';

type YesNoType = 'Evet' | 'Hayır' | '';

type EvaluationType = 'Uygun' | 'Uygun Değil' | 'Uygulanamaz' | 'Hafif Kusur' | '';

type ProtectionSystemType = 'ESE Paratoner' | 'Faraday Kafesi' | 'Gerilmiş Tel' | 'Franklin Çubuğu' | 'Doğal Bileşenler' | '';

type EquipmentUsageType = 'Ayrılmış YKS' | 'Ayrılmamış (Eşpotansiyel) YKS' | '';

const LightningProtectionNavigatorScreen: React.FC<LightningProtectionNavigatorScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();

  // Current page state
  const [currentPage, setCurrentPage] = useState<PageType>('detected-info');
  const [saving, setSaving] = useState(false);
  const [existingFormId, setExistingFormId] = useState<number | null>(null);

  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({ title: '', message: '', type: 'info' });

  // 2.1 Ekipman Kullanım Amacı
  const [equipmentUsage, setEquipmentUsage] = useState<EquipmentUsageType>('');

  // 2.2 Tespit Edilen Bilgiler (eski 3)
  const [hasComprehensiveChange, setHasComprehensiveChange] = useState<EvaluationType>('');
  const [hasPreviousControlLabel, setHasPreviousControlLabel] = useState<EvaluationType>('');
  const [equipmentDescription, setEquipmentDescription] = useState('');
  const [protectionSystemType, setProtectionSystemType] = useState<ProtectionSystemType>('');
  const [protectionLevel, setProtectionLevel] = useState('');
  const [buildingUsageDetails, setBuildingUsageDetails] = useState('');

  // 4. Kontrol Kriterleri Ve Testler
  const [hasRiskAnalysisProject, setHasRiskAnalysisProject] = useState<YesNoType>('Hayır'); // Varsayılan Hayır
  const [doesCoverageAreaCoverBuilding, setDoesCoverageAreaCoverBuilding] = useState<YesNoType>('Evet'); // Varsayılan Evet
  const [measurementMethod, setMeasurementMethod] = useState('Çevrim Empedansı'); // Varsayılan Çevrim Empedansı

  // Aktif Paratoner Soruları - Varsayılan Uygun
  const [activeLightningRodAnswers, setActiveLightningRodAnswers] = useState<Record<string, EvaluationType | YesNoType>>({
    // A. Koruma Borusu
    'a1': 'Uygun',
    'a2': 'Uygun',
    'a3': 'Uygun',
    'a4': 'Uygun',
    'a5': 'Uygun',
    'a6': 'Uygun',
    'a7': 'Uygun',
    'a8': 'Uygun',
    // B. İndirme İletkenleri
    'b1': 'Uygun',
    'b2': 'Uygun',
    'b3': 'Uygun',
    'b4': 'Uygun',
    'b5': 'Uygun',
    'b6': 'Uygun',
    'b7': 'Uygulanamaz',
    // C. Muayene Klemensi
    'c1': 'Uygun',
    'c2': 'Uygun',
    'c3': 'Uygun',
    // D. Çatı/Tesis Üstü
    'd1': 'Uygun',
    'd2': 'Uygun',
    'd3': 'Uygun',
    'd4': 'Uygun',
    // E. Topraklama Tesisi
    'e1': 'Uygulanamaz',
    'e2': 'Uygun',
    'e3': 'Uygulanamaz',
    'e4': 'Hayır', // Topraklama Hattı - Evet/Hayır
    'e5': 'Uygulanamaz',
  });
  const [resistanceValue, setResistanceValue] = useState(''); // E5 için ölçüm sonucu

  // Faraday Kafesi Soruları - Varsayılan Uygun
  const [faradayCageAnswers, setFaradayCageAnswers] = useState<Record<string, EvaluationType | YesNoType>>({
    // A. Çatıda Terasta Ağ
    'fa1': 'Uygun',
    'fa2': 'Uygun',
    'fa3': 'Uygun',
    'fa4': 'Uygulanamaz',
    // B. İndirme İletkenleri
    'fb1': 'Uygun',
    'fb2': 'Uygun',
    'fb3': 'Uygun',
    'fb4': 'Uygun',
    'fb5': 'Uygun',
    'fb6': 'Uygun',
    // C. Topraklama Tesisi
    'fc1': '', // Eşpotansiyel - Evet/Hayır
    'fc2': 'Uygun',
    'fc3': 'Uygulanamaz',
    'fc4': 'Uygun',
    // D. İç Yıldırımlık Tesisi
    'fd1': 'Uygulanamaz',
    'fd2': 'Uygulanamaz',
  });
  const [faradayResistanceValue, setFaradayResistanceValue] = useState(''); // fc4 için ölçüm sonucu

  // 5. Kusur Ve Açıklamalar
  const [defectDescription, setDefectDescription] = useState('');

  // 6. Notlar
  const [generalNotes, setGeneralNotes] = useState('');

  // 7. Sonuç Ve Kanaat
  const [conclusion, setConclusion] = useState('');

  // Evaluation options for Gözle Kontrol style
  const evaluationOptions: EvaluationType[] = ['Uygun', 'Uygun Değil', 'Uygulanamaz', 'Hafif Kusur'];

  // Get evaluation color
  const getEvaluationColor = (evaluation: EvaluationType): string => {
    switch (evaluation) {
      case 'Uygun': return '#059669';
      case 'Uygun Değil': return '#DC2626';
      case 'Uygulanamaz': return '#6B7280';
      case 'Hafif Kusur': return '#F59E0B';
      default: return '#9CA3AF';
    }
  };

  // Load existing data
  useEffect(() => {
    const loadExistingData = async () => {
      if (route?.params?.reportData) {
        const data = route.params.reportData;
        // 2.1 Ekipman Kullanım Amacı
        if (data.equipmentUsage) setEquipmentUsage(data.equipmentUsage);
        // 2.2 Tespit Edilen Bilgiler
        if (data.hasComprehensiveChange) setHasComprehensiveChange(data.hasComprehensiveChange);
        if (data.hasPreviousControlLabel) setHasPreviousControlLabel(data.hasPreviousControlLabel);
        if (data.equipmentDescription) setEquipmentDescription(data.equipmentDescription);
        if (data.protectionSystemType) setProtectionSystemType(data.protectionSystemType);
        if (data.protectionLevel) setProtectionLevel(data.protectionLevel);
        if (data.buildingUsageDetails) setBuildingUsageDetails(data.buildingUsageDetails);
        // Kontrol Kriterleri
        if (data.hasRiskAnalysisProject) setHasRiskAnalysisProject(data.hasRiskAnalysisProject);
        if (data.doesCoverageAreaCoverBuilding) setDoesCoverageAreaCoverBuilding(data.doesCoverageAreaCoverBuilding);
        if (data.measurementMethod) setMeasurementMethod(data.measurementMethod);
        // Paratoner / Faraday Kafesi
        if (data.activeLightningRodAnswers) setActiveLightningRodAnswers(data.activeLightningRodAnswers);
        if (data.resistanceValue) setResistanceValue(data.resistanceValue);
        if (data.faradayCageAnswers) setFaradayCageAnswers(data.faradayCageAnswers);
        if (data.faradayResistanceValue) setFaradayResistanceValue(data.faradayResistanceValue);
        // Kusur, Notlar, Sonuç
        if (data.defectDescription) setDefectDescription(data.defectDescription);
        if (data.generalNotes) setGeneralNotes(data.generalNotes);
        if (data.conclusion) setConclusion(data.conclusion);
        if (data.id) setExistingFormId(data.id);
      }
    };
    loadExistingData();
  }, [route?.params?.reportData]);

  // Save handler
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const formData = {
        form_name: 'lightning_protection',
        work_order_id: route?.params?.workOrderId,
        data: {
          // 2.1 Ekipman Kullanım Amacı
          equipmentUsage,
          // 2.2 Tespit Edilen Bilgiler
          hasComprehensiveChange,
          hasPreviousControlLabel,
          equipmentDescription,
          protectionSystemType,
          protectionLevel,
          buildingUsageDetails,
          // Kontrol Kriterleri
          hasRiskAnalysisProject,
          doesCoverageAreaCoverBuilding,
          measurementMethod,
          // Paratoner / Faraday Kafesi
          activeLightningRodAnswers,
          resistanceValue,
          faradayCageAnswers,
          faradayResistanceValue,
          // Kusur, Notlar, Sonuç
          defectDescription,
          generalNotes,
          conclusion,
        },
      };

      let response;
      if (existingFormId) {
        response = await FormsApi.update(String(existingFormId), formData);
      } else {
        response = await FormsApi.create(formData);
        if (response?.id) {
          setExistingFormId(Number(response.id));
        }
      }

      setAlertConfig({
        title: 'Başarılı',
        message: 'Yıldırımdan korunma raporu başarıyla kaydedildi.',
        type: 'success',
        onConfirm: () => navigation?.goBack(),
      });
      setAlertVisible(true);
    } catch (error) {
      console.error('Save error:', error);
      setAlertConfig({
        title: 'Hata',
        message: 'Kayıt sırasında bir hata oluştu.',
        type: 'error',
      });
      setAlertVisible(true);
    } finally {
      setSaving(false);
    }
  }, [
    route?.params?.workOrderId,
    equipmentUsage,
    hasComprehensiveChange,
    hasPreviousControlLabel,
    equipmentDescription,
    protectionSystemType,
    protectionLevel,
    buildingUsageDetails,
    hasRiskAnalysisProject,
    doesCoverageAreaCoverBuilding,
    measurementMethod,
    activeLightningRodAnswers,
    resistanceValue,
    faradayCageAnswers,
    faradayResistanceValue,
    defectDescription,
    generalNotes,
    conclusion,
    existingFormId,
    navigation,
  ]);

  // Update active lightning rod answer
  const updateActiveLightningRodAnswer = useCallback((key: string, value: EvaluationType | YesNoType) => {
    setActiveLightningRodAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  // Update faraday cage answer
  const updateFaradayCageAnswer = useCallback((key: string, value: EvaluationType | YesNoType) => {
    setFaradayCageAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  // Check if paratoner is selected
  const isParatonerSelected = protectionSystemType === 'ESE Paratoner';

  // Header setup
  useLayoutEffect(() => {
    if (navigation?.setOptions) {
      let headerTitle = '';
      switch (currentPage) {
        case 'detected-info':
          headerTitle = '2. Tespit Edilen Bilgiler';
          break;
        case 'control-criteria':
          headerTitle = '4. Kontrol Kriterleri Ve Testler';
          break;
        case 'paratoner-controls':
          headerTitle = '4.1 Paratoner Kontrolleri';
          break;
        case 'faraday-controls':
          headerTitle = '4.1 Faraday Kafesi Kontrolleri';
          break;
        case 'defects':
          headerTitle = '5. Kusur Ve Açıklamalar';
          break;
        case 'notes':
          headerTitle = '6. Notlar';
          break;
        case 'conclusion':
          headerTitle = '7. Sonuç Ve Kanaat';
          break;
        default:
          headerTitle = '2. Tespit Edilen Bilgiler';
      }

      navigation.setOptions({
        title: headerTitle,
        headerStyle: {
          backgroundColor: '#059669',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => {
              const prev = getPreviousPage();
              if (prev) {
                setCurrentPage(prev);
              } else {
                navigation.goBack();
              }
            }}
            style={{ padding: 8, marginLeft: -8 }}
          >
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              backgroundColor: saving ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
              borderRadius: 6,
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "600" }}>
                Kaydet
              </Text>
            )}
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, currentPage, handleSave, saving]);

  // Styles
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
      padding: 16,
    },
    section: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 16,
    },
    subsectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: '#059669',
      marginBottom: 12,
      marginTop: 8,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    questionContainer: {
      marginBottom: 16,
    },
    questionText: {
      fontSize: 14,
      color: theme.text,
      marginBottom: 10,
      lineHeight: 20,
    },
    // Evaluation Options (Gözle Kontrol style - Tek satır)
    evaluationContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 4,
      flexWrap: 'nowrap',
    },
    evaluationOption: {
      flex: 1,
      paddingHorizontal: 6,
      paddingVertical: 8,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 0,
    },
    evaluationText: {
      fontSize: 9,
      fontWeight: '600',
      textAlign: 'center',
    },
    // Yes/No buttons (Genel Bilgiler tarzı dropdown)
    yesNoDropdownContainer: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      overflow: 'hidden',
    },
    yesNoOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    yesNoOptionSelected: {
      backgroundColor: '#D1FAE5',
    },
    yesNoOptionText: {
      fontSize: 14,
      color: theme.text,
    },
    yesNoOptionTextSelected: {
      fontWeight: '600',
      color: '#059669',
    },
    checkmarkContainer: {
      width: 20,
      alignItems: 'center',
    },
    textInput: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: theme.text,
      minHeight: 44,
    },
    textArea: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: theme.text,
      minHeight: 150,
      textAlignVertical: 'top',
    },
    optionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 2,
    },
    optionButtonSelected: {
      backgroundColor: '#D1FAE5',
      borderColor: '#059669',
    },
    optionButtonUnselected: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    optionButtonText: {
      fontSize: 14,
      marginLeft: 12,
      flex: 1,
    },
    optionButtonTextSelected: {
      color: '#059669',
      fontWeight: '600',
    },
    optionButtonTextUnselected: {
      color: theme.text,
    },
    navigationButtonsInline: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 16,
      marginTop: 8,
    },
    navButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    navButtonPrev: {
      backgroundColor: theme.border,
    },
    navButtonNext: {
      backgroundColor: '#059669',
    },
    navButtonText: {
      fontSize: 14,
      fontWeight: '600',
    },
    navButtonTextPrev: {
      color: theme.text,
      marginLeft: 8,
    },
    navButtonTextNext: {
      color: '#FFFFFF',
      marginRight: 8,
    },
    bottomPadding: {
      height: 40,
    },
    resistanceInput: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: theme.text,
      marginTop: 8,
    },
    // Equipment Usage Style
    equipmentUsageOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 10,
      marginBottom: 10,
      borderWidth: 2,
    },
    equipmentUsageSelected: {
      backgroundColor: '#D1FAE5',
      borderColor: '#059669',
    },
    equipmentUsageUnselected: {
      backgroundColor: theme.surface,
      borderColor: theme.border,
    },
    equipmentUsageText: {
      fontSize: 15,
      marginLeft: 12,
      flex: 1,
      fontWeight: '500',
    },
  });

  // Protection system type options
  const protectionSystemOptions: ProtectionSystemType[] = [
    'ESE Paratoner',
    'Faraday Kafesi',
    'Gerilmiş Tel',
    'Franklin Çubuğu',
    'Doğal Bileşenler',
  ];

  // Equipment usage options
  const equipmentUsageOptions: EquipmentUsageType[] = [
    'Ayrılmış YKS',
    'Ayrılmamış (Eşpotansiyel) YKS',
  ];

  // Measurement method options
  const measurementMethodOptions = [
    'Çevrim Empedansı',
    'Üç Uçlu Topraklama',
    'Klamp Yönetimi',
  ];

  // Render Evaluation Question (Gözle Kontrol style - 4 options)
  const renderEvaluationQuestion = (
    question: string,
    value: EvaluationType,
    setValue: (val: EvaluationType) => void
  ) => (
    <View style={styles.questionContainer}>
      <Text style={styles.questionText}>{question}</Text>
      <View style={styles.evaluationContainer}>
        {evaluationOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.evaluationOption,
              { backgroundColor: value === option ? getEvaluationColor(option) : '#F3F4F6' },
            ]}
            onPress={() => setValue(option)}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[
                styles.evaluationText,
                { color: value === option ? '#FFFFFF' : '#6B7280' }
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render Yes/No question (Genel Bilgiler tarzı dropdown)
  const renderYesNoQuestion = (
    question: string,
    value: YesNoType,
    setValue: (val: YesNoType) => void,
    additionalContent?: React.ReactNode
  ) => (
    <View style={styles.questionContainer}>
      <Text style={styles.questionText}>{question}</Text>
      <View style={styles.yesNoDropdownContainer}>
        {(['Evet', 'Hayır'] as YesNoType[]).map((option, index) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.yesNoOption,
              value === option && styles.yesNoOptionSelected,
              index === 1 && { borderBottomWidth: 0 },
            ]}
            onPress={() => setValue(option)}
          >
            <Text
              style={[
                styles.yesNoOptionText,
                value === option && styles.yesNoOptionTextSelected,
              ]}
            >
              {option}
            </Text>
            <View style={styles.checkmarkContainer}>
              {value === option && <Ionicons name="checkmark" size={14} color="#059669" />}
            </View>
          </TouchableOpacity>
        ))}
      </View>
      {additionalContent}
    </View>
  );

  // Render detected info page (2.1 and 2.2)
  const renderDetectedInfoPage = () => (
    <>
      {/* 2.1 Ekipman Kullanım Amacı */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2.1 Ekipman Kullanım Amacı</Text>
        {equipmentUsageOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.equipmentUsageOption,
              equipmentUsage === option ? styles.equipmentUsageSelected : styles.equipmentUsageUnselected,
            ]}
            onPress={() => setEquipmentUsage(option)}
          >
            <Ionicons
              name={equipmentUsage === option ? "radio-button-on" : "radio-button-off"}
              size={22}
              color={equipmentUsage === option ? "#059669" : theme.textSecondary}
            />
            <Text
              style={[
                styles.equipmentUsageText,
                { color: equipmentUsage === option ? '#059669' : theme.text }
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 2.2 Tespit Edilen Bilgiler */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2.2 Tespit Edilen Bilgiler</Text>

        {renderEvaluationQuestion(
          'Tesisatta kapsamlı değişiklik var mı?',
          hasComprehensiveChange,
          setHasComprehensiveChange
        )}

        {renderEvaluationQuestion(
          'Bir önceki periyodik kontrol etiketi var mı?',
          hasPreviousControlLabel,
          setHasPreviousControlLabel
        )}

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>Ekipman Tanımlaması</Text>
          <TextInput
            style={styles.textInput}
            value={equipmentDescription}
            onChangeText={setEquipmentDescription}
            placeholder="Ekipman tanımlamasını giriniz..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>Yıldırımdan korunma tesisatı tipi</Text>
          {protectionSystemOptions.map((option) => (
            <TouchableOpacity
              key={option}
              style={[
                styles.optionButton,
                protectionSystemType === option ? styles.optionButtonSelected : styles.optionButtonUnselected,
              ]}
              onPress={() => setProtectionSystemType(option)}
            >
              <Ionicons
                name={protectionSystemType === option ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={protectionSystemType === option ? "#059669" : theme.textSecondary}
              />
              <Text
                style={[
                  styles.optionButtonText,
                  protectionSystemType === option ? styles.optionButtonTextSelected : styles.optionButtonTextUnselected,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>Koruma Seviyesi (EPS)</Text>
          <TextInput
            style={styles.textInput}
            value={protectionLevel}
            onChangeText={setProtectionLevel}
            placeholder="Koruma seviyesini giriniz..."
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>Yapı kullanım amacı ve yapıya ait detaylar</Text>
          <TextInput
            style={styles.textArea}
            value={buildingUsageDetails}
            onChangeText={setBuildingUsageDetails}
            placeholder="Yapı kullanım amacı ve detaylarını giriniz..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>
      </View>
    </>
  );

  // Render control criteria page (4)
  const renderControlCriteriaPage = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Kontrol Kriterleri Ve Testler</Text>

      {renderYesNoQuestion(
        'Yıldırımdan korunma risk analizi ve kapsam alanı projesi var mı?',
        hasRiskAnalysisProject,
        setHasRiskAnalysisProject
      )}

      {renderYesNoQuestion(
        'Yıldırım seviyesine göre montajı yapılmış olan yıldırımdan korunma sistemi için tanımlanan kapsam alanı binayı kapsıyor mu?',
        doesCoverageAreaCoverBuilding,
        setDoesCoverageAreaCoverBuilding
      )}

      <View style={styles.questionContainer}>
        <Text style={styles.questionText}>Ölçüm ve doğrulama metodu</Text>
        {measurementMethodOptions.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              measurementMethod === option ? styles.optionButtonSelected : styles.optionButtonUnselected,
            ]}
            onPress={() => setMeasurementMethod(option)}
          >
            <Ionicons
              name={measurementMethod === option ? "radio-button-on" : "radio-button-off"}
              size={20}
              color={measurementMethod === option ? "#059669" : theme.textSecondary}
            />
            <Text
              style={[
                styles.optionButtonText,
                measurementMethod === option ? styles.optionButtonTextSelected : styles.optionButtonTextUnselected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Active Lightning Rod Questions Data (Paratoner)
  const activeLightningRodQuestions = {
    a: {
      title: 'A. Koruma Borusu',
      questions: [
        { key: 'a1', text: 'Koruma borusu tesis edilmiş midir?', type: 'evaluation' },
        { key: 'a2', text: 'Koruma borusu galvaniz mi?', type: 'evaluation' },
        { key: 'a3', text: 'Koruma borusunda oksitlenme var mı?', type: 'evaluation' },
        { key: 'a4', text: 'Koruma borusu çapı uygun mudur?', type: 'evaluation' },
        { key: 'a5', text: 'Koruma borusu duvarlara kelepçelerle tutturulmuş mudur?', type: 'evaluation' },
        { key: 'a6', text: 'Koruma borusu ağzı yalıtkan bir madde ile kaplanmış mıdır?', type: 'evaluation' },
        { key: 'a7', text: 'Koruma borusu içindeki iletkenler PVC boru/hortum içinde midir?', type: 'evaluation' },
        { key: 'a8', text: 'Koruma borusu > 250 cm yukarıda mıdır?', type: 'evaluation' },
      ],
    },
    b: {
      title: 'B. İndirme İletkenleri',
      questions: [
        { key: 'b1', text: 'İndirme iletkenleri 2 × 50 mm² bakır veya eşdeğer iletken mi?', type: 'evaluation' },
        { key: 'b2', text: 'İndirme iletkenleri som bakır veya eşdeğer iletken mi?', type: 'evaluation' },
        { key: 'b3', text: 'İndirme iletkenleri tespit kroşeleri kızıl döküm mü?', type: 'evaluation' },
        { key: 'b4', text: 'İndirme iletkenleri tespit kroşelerinde oksitlenme var mıdır?', type: 'evaluation' },
        { key: 'b5', text: 'İndirme iletkenleri köşe "S" yapmakta mıdır?', type: 'evaluation' },
        { key: 'b6', text: 'İndirme iletkenleri tespit elemanları arası mesafe ortalama 0,5-0,7 m midir?', type: 'evaluation' },
        { key: 'b7', text: 'Gerilmiş tel ise her bir tel ucu için indirme iletkeni kullanılmış mı?', type: 'evaluation' },
      ],
    },
    c: {
      title: 'C. Muayene Klemensi',
      questions: [
        { key: 'c1', text: 'Muayene klemensi oksitlenmeye karşı koruma alınmış mıdır?', type: 'evaluation' },
        { key: 'c2', text: 'Muayene klemensi zeminden 270 cm yukarıda mıdır?', type: 'evaluation' },
        { key: 'c3', text: 'Muayene klemensi ile koruma borusu arası mesafe 20 cm midir?', type: 'evaluation' },
      ],
    },
    d: {
      title: 'D. Çatı/Tesis Üstü',
      questions: [
        { key: 'd1', text: 'Çatı direği boyu ve çapı uygun mu? (Boy: 6-6,5 m, Çap: 2")', type: 'evaluation' },
        { key: 'd2', text: 'Çatı direği üzerinde tespit elemanları bulunmakta mıdır?', type: 'evaluation' },
        { key: 'd3', text: 'Çatı direği çatı üzerine sağlam tutturulmuş mudur?', type: 'evaluation' },
        { key: 'd4', text: 'İniş iletkenleri çatı direğine uygun olarak irtibatlandırılmış mıdır?', type: 'evaluation' },
      ],
    },
    e: {
      title: 'E. Topraklama Tesisi',
      questions: [
        { key: 'e1', text: 'İndirme iletkenleri topraklama elektrotlarına uygun bir şekilde tutturulmuş mudur?', type: 'evaluation' },
        { key: 'e2', text: 'İndirme iletkenleri koruma borusundan sonra zemin üzerinde midir?', type: 'evaluation' },
        { key: 'e3', text: 'İndirme iletkenlerinde sürekliliğin sağlandığı görülüyor mu?', type: 'evaluation' },
        { key: 'e4', text: 'Topraklama hattı tesis edilmiş midir? Bina topraklaması ile eşpotansiyel midir?', type: 'yesno' },
        { key: 'e5', text: 'Topraklama tesisi direnci 10 Ω\'dan küçük müdür?', type: 'numeric' },
      ],
    },
  };

  // Render Paratoner controls page
  const renderParatonerControlsPage = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Paratoner Kontrolleri</Text>

      {Object.entries(activeLightningRodQuestions).map(([sectionKey, section]) => (
        <View key={sectionKey}>
          <Text style={styles.subsectionTitle}>{section.title}</Text>
          {section.questions.map((q) => (
            <View key={q.key}>
              {q.type === 'evaluation' && renderEvaluationQuestion(
                q.text,
                activeLightningRodAnswers[q.key] as EvaluationType,
                (val) => updateActiveLightningRodAnswer(q.key, val)
              )}
              {q.type === 'yesno' && renderYesNoQuestion(
                q.text,
                activeLightningRodAnswers[q.key] as YesNoType,
                (val) => updateActiveLightningRodAnswer(q.key, val)
              )}
              {q.type === 'numeric' && (
                <View style={styles.questionContainer}>
                  <Text style={styles.questionText}>{q.text}</Text>
                  <TextInput
                    style={styles.resistanceInput}
                    value={resistanceValue}
                    onChangeText={setResistanceValue}
                    placeholder="Ölçüm değeri (Ω)"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  // Faraday Cage Questions Data
  const faradayCageQuestions = {
    a: {
      title: 'A. Çatıda Terasta Ağ',
      questions: [
        { key: 'fa1', text: 'Ağ iletkenlerinin kesitleri standarta uygun mudur?', type: 'evaluation' },
        { key: 'fa2', text: 'Ağ risk analizinde belirlenen genişlikte midir?', type: 'evaluation' },
        { key: 'fa3', text: 'Ağ\'da varsa düşey yakalama çubukları uygun mudur?', type: 'evaluation' },
        { key: 'fa4', text: 'Özellikle yanıcı, parlayıcı, patlayıcı madde bulunan binalarda düşey yakalama çubuklarının bulunmadığı veya tehlikeli bölge dışında bulunduğu kontrol edildi mi?', type: 'evaluation' },
      ],
    },
    b: {
      title: 'B. İndirme İletkenleri',
      questions: [
        { key: 'fb1', text: 'Yatay yakalama sistemi (ağ) için yeterli sayıda indiricilerle bağlantı var mı? (en az 20 m\'de 1 indirici)', type: 'evaluation' },
        { key: 'fb2', text: 'İndirme iletkenleri standarta uygun kesitte som bakır veya eşdeğer iletken mi?', type: 'evaluation' },
        { key: 'fb3', text: 'Doğal indirici metal yapılar kullanılmıyorsa indirme iletkenleri tespit kroşeleri kızıl döküm mü?', type: 'evaluation' },
        { key: 'fb4', text: 'Doğal indirici metal yapılar kullanılmıyorsa indirme iletkenleri tespit kroşelerinde oksitlenme var mıdır?', type: 'evaluation' },
        { key: 'fb5', text: 'Doğal indirici metal yapılar kullanılmıyorsa indirme iletkenleri köşe "S" yapmakta mıdır?', type: 'evaluation' },
        { key: 'fb6', text: 'Doğal indirici metal yapılar kullanılmıyorsa indirme iletkenleri tespit kroşeleri arası mesafe ortalama 0,5-0,7 m midir?', type: 'evaluation' },
      ],
    },
    c: {
      title: 'C. Topraklama Tesisi',
      questions: [
        { key: 'fc1', text: 'Yıldırıma karşı koruma topraklamalarına 20 m\'den daha küçük mesafede başka topraklayıcılar bulunuyorsa, bütün topraklayıcılar birbirleriyle eşpotansiyel midir?', type: 'yesno' },
        { key: 'fc2', text: 'Bina çatısına monte edilen düşey yakalama ucunun bağlı olduğu çatı direği, çelik dübellerle bina betonuna bağlandığından, topraklamasının bina ile eşpotansiyel midir?', type: 'evaluation' },
        { key: 'fc3', text: 'Doğal metal yapılar indirici olarak kullanıldıysa bu yapılar temel topraklamasına bağlı olduğundan çatı ağının doğal bileşenlere bağlantı noktaları kontrol edildi mi?', type: 'evaluation' },
        { key: 'fc4', text: 'Topraklama tesisi direnci 10 Ω\'dan küçük müdür?', type: 'numeric' },
      ],
    },
    d: {
      title: 'D. İç Yıldırımlık Tesisi',
      questions: [
        { key: 'fd1', text: 'Ana dağıtım panosunda uygun parafudr tesisi edilmiş mi?', type: 'evaluation' },
        { key: 'fd2', text: 'Parafudr tipi uygun mu?', type: 'evaluation' },
      ],
    },
  };

  // Render Faraday cage page
  const renderFaradayCageControlsPage = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Faraday Kafesi Kontrolleri</Text>

      {Object.entries(faradayCageQuestions).map(([sectionKey, section]) => (
        <View key={sectionKey}>
          <Text style={styles.subsectionTitle}>{section.title}</Text>
          {section.questions.map((q) => (
            <View key={q.key}>
              {q.type === 'evaluation' && renderEvaluationQuestion(
                q.text,
                faradayCageAnswers[q.key] as EvaluationType,
                (val) => updateFaradayCageAnswer(q.key, val)
              )}
              {q.type === 'yesno' && renderYesNoQuestion(
                q.text,
                faradayCageAnswers[q.key] as YesNoType,
                (val) => updateFaradayCageAnswer(q.key, val)
              )}
              {q.type === 'numeric' && (
                <View style={styles.questionContainer}>
                  <Text style={styles.questionText}>{q.text}</Text>
                  <TextInput
                    style={styles.resistanceInput}
                    value={faradayResistanceValue}
                    onChangeText={setFaradayResistanceValue}
                    placeholder="Ölçüm değeri (Ω)"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                  />
                </View>
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );

  // Render defects page (5)
  const renderDefectsPage = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Kusur Ve Açıklamalar</Text>
      <TextInput
        style={styles.textArea}
        value={defectDescription}
        onChangeText={setDefectDescription}
        placeholder="Tespit edilen kusurları ve açıklamalarını buraya yazınız..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={10}
        textAlignVertical="top"
      />
    </View>
  );

  // Render notes page (6)
  const renderNotesPage = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notlar</Text>
      <TextInput
        style={styles.textArea}
        value={generalNotes}
        onChangeText={setGeneralNotes}
        placeholder="Genel notlarınızı buraya yazınız..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={10}
        textAlignVertical="top"
      />
    </View>
  );

  // Render conclusion page (7)
  const renderConclusionPage = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Sonuç Ve Kanaat</Text>
      <TextInput
        style={styles.textArea}
        value={conclusion}
        onChangeText={setConclusion}
        placeholder="Sonuç ve kanaatinizi buraya yazınız..."
        placeholderTextColor="#9CA3AF"
        multiline
        numberOfLines={10}
        textAlignVertical="top"
      />
    </View>
  );

  // Navigation helper - Get next page based on protection type selection
  const getNextPage = (): PageType | null => {
    switch (currentPage) {
      case 'detected-info':
        return 'control-criteria';
      case 'control-criteria':
        // Eğer paratoner seçiliyse paratoner, değilse faraday
        if (isParatonerSelected) {
          return 'paratoner-controls';
        } else {
          return 'faraday-controls';
        }
      case 'paratoner-controls':
      case 'faraday-controls':
        return 'defects';
      case 'defects':
        return 'notes';
      case 'notes':
        return 'conclusion';
      case 'conclusion':
        return null;
      default:
        return null;
    }
  };

  const getPreviousPage = (): PageType | null => {
    switch (currentPage) {
      case 'control-criteria':
        return 'detected-info';
      case 'paratoner-controls':
      case 'faraday-controls':
        return 'control-criteria';
      case 'defects':
        if (isParatonerSelected) {
          return 'paratoner-controls';
        } else {
          return 'faraday-controls';
        }
      case 'notes':
        return 'defects';
      case 'conclusion':
        return 'notes';
      default:
        return null;
    }
  };

  // Check if can proceed to next page
  const canProceedToNext = (): boolean => {
    if (currentPage === 'detected-info' && !protectionSystemType) {
      return false;
    }
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {currentPage === 'detected-info' && renderDetectedInfoPage()}
        {currentPage === 'control-criteria' && renderControlCriteriaPage()}
        {currentPage === 'paratoner-controls' && renderParatonerControlsPage()}
        {currentPage === 'faraday-controls' && renderFaradayCageControlsPage()}
        {currentPage === 'defects' && renderDefectsPage()}
        {currentPage === 'notes' && renderNotesPage()}
        {currentPage === 'conclusion' && renderConclusionPage()}

        {/* Navigation Buttons - Inside ScrollView */}
        <View style={styles.navigationButtonsInline}>
          {getPreviousPage() ? (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonPrev]}
              onPress={() => {
                const prev = getPreviousPage();
                if (prev) setCurrentPage(prev);
              }}
            >
              <Ionicons name="chevron-back" size={20} color={theme.text} />
              <Text style={[styles.navButtonText, styles.navButtonTextPrev]}>Önceki</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 100 }} />
          )}

          {getNextPage() ? (
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.navButtonNext,
                !canProceedToNext() && { opacity: 0.5 }
              ]}
              onPress={() => {
                if (!canProceedToNext()) {
                  setAlertConfig({
                    title: 'Uyarı',
                    message: 'Devam etmek için yıldırımdan korunma tesisatı tipini seçmelisiniz.',
                    type: 'warning',
                  });
                  setAlertVisible(true);
                  return;
                }
                const next = getNextPage();
                if (next) setCurrentPage(next);
              }}
            >
              <Text style={[styles.navButtonText, styles.navButtonTextNext]}>Sonraki</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.navButton, styles.navButtonNext]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={[styles.navButtonText, styles.navButtonTextNext]}>Tamamla</Text>
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          setAlertVisible(false);
          alertConfig.onConfirm?.();
        }}
        onCancel={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
};

export default LightningProtectionNavigatorScreen;
