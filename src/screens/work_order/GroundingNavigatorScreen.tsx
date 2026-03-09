import React, { useState, useLayoutEffect, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import FormsApi from "../../api/forms";
import { useTheme } from "../../theme/ThemeContext";
import CustomAlert from "../../components/CustomAlert";

// Topraklama Not Listesi
export const GROUNDING_NOTE_LIST = [
  { code: "T001", description: "Uygundur" },

  { code: "T002", description: "Güvenlik şartı sağlanmamıştır (Ağır kusur)" },

  { code: "T003", description: "Topraklama bağlantısı yoktur, kontrol edilmelidir (Ağır kusur)" },

  { code: "T004", description: "Artık akım anahtarı (RCD) mevcut ve faaldir, uygundur" },

  { code: "T005", description: "32A altı priz devrelerinde 30mA RCD zorunluluğu sağlanmamıştır (Ağır kusur)" },

  { code: "T006", description: "32A üzeri devrelerde doğal kaçak akım tahkiki yapılmamıştır (Ağır kusur)" },

  { code: "T007", description: "Üst panodaki RCD selektif (gecikmeli) tip değildir" },

  { code: "T008", description: "Nötr-toprak gerilimi yüksek olduğundan ölçüm yapılamamıştır (Ağır kusur)" },

  { code: "T009", description: "PE ve N iletkenleri uygunsuz şekilde birleştirilmiştir (Ağır kusur)" },

  { code: "T010", description: "Prizde nötr-toprak köprüsü (sıfırlama) yapılmıştır, uygun değildir (Ağır kusur)" },

  { code: "T011", description: "Pano gövde-kapak topraklama köprüsü yoktur (Ağır kusur)" },
];

// Interfaces
interface NoteItem {
  id: string;
  code: string;
  description: string;
  source: string; // "5.1" veya "5.2"
  rowNo: string;
}

interface ConsumptionPointMeasurement {
  no: string;
  measurementPoint: string;
  inCurrent: string;
  curveType: string;
  tripCurrent: string;
  shortCircuitCurrent: string;
  measuredValue: string;
  limitValue: string;
  rcdInfo: string;
  tripCurrentDelta: string;
  tripTimeDelta: string;
  result: string;
  resultNotes: NoteItem[];
}

interface ResidualCurrentMeasurement {
  no: string;
  previousPanelName: string;
  rcdType: string;
  ratedCurrent: string;
  tripCurrentDelta: string;
  tripTimeDelay: string;
  feedingPanelName: string;
  rcdType2: string;
  tripCurrentDelta2: string;
  testTripTime: string;
  result: string;
  resultNotes: NoteItem[];
}

interface GroundingNavigatorScreenProps {
  navigation?: any;
  route?: {
    params: {
      workOrderId: number;
      panelId?: string;
      panelName?: string;
      reportData?: any;
    };
  };
}

type PageType = 'measurement-method' | 'consumption-points' | 'residual-current' | 'defects' | 'notes' | 'conclusion';

const GroundingNavigatorScreen: React.FC<GroundingNavigatorScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();

  // Current page state
  const [currentPage, setCurrentPage] = useState<PageType>('measurement-method');
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

  // 5. Ölçüm Metodu
  const [measurementMethod, setMeasurementMethod] = useState<string>('Çevrim Empedansı');
  const measurementMethodOptions = [
    'Üç Uçlu Karşılaştırma',
    'Çevrim Empedansı',
    'Klamp Yönetimi'
  ];

  // 5.1 Son Tüketim Noktası Ölçümleri
  const [consumptionMeasurements, setConsumptionMeasurements] = useState<ConsumptionPointMeasurement[]>([
    {
      no: "1",
      measurementPoint: "",
      inCurrent: "",
      curveType: "",
      tripCurrent: "",
      shortCircuitCurrent: "",
      measuredValue: "",
      limitValue: "",
      rcdInfo: "",
      tripCurrentDelta: "",
      tripTimeDelta: "",
      result: "",
      resultNotes: [],
    }
  ]);

  // 5.2 Artık Akım Anahtarları Ölçümleri
  const [residualMeasurements, setResidualMeasurements] = useState<ResidualCurrentMeasurement[]>([
    {
      no: "1",
      previousPanelName: "",
      rcdType: "",
      ratedCurrent: "",
      tripCurrentDelta: "",
      tripTimeDelay: "",
      feedingPanelName: "",
      rcdType2: "",
      tripCurrentDelta2: "",
      testTripTime: "",
      result: "",
      resultNotes: [],
    }
  ]);

  // 6. Kusur Açıklamaları
  const [defectDescription, setDefectDescription] = useState<string>('');

  // 7. Notlar
  const [generalNotes, setGeneralNotes] = useState<string>('');

  // Note selection modal
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [selectedRowForNote, setSelectedRowForNote] = useState<{
    tableType: '5.1' | '5.2';
    rowIndex: number;
  } | null>(null);
  const [newNoteCode, setNewNoteCode] = useState('');
  const [newNoteDescription, setNewNoteDescription] = useState('');
  const [noteSearchQuery, setNoteSearchQuery] = useState('');

  // Load existing data
  useEffect(() => {
    const loadExistingData = async () => {
      if (route?.params?.reportData) {
        const data = route.params.reportData;
        if (data.measurementMethod) setMeasurementMethod(data.measurementMethod);
        if (data.consumptionMeasurements) setConsumptionMeasurements(data.consumptionMeasurements);
        if (data.residualMeasurements) setResidualMeasurements(data.residualMeasurements);
        if (data.defectDescription) setDefectDescription(data.defectDescription);
        if (data.generalNotes) setGeneralNotes(data.generalNotes);
        if (data.id) setExistingFormId(data.id);
      }
    };
    loadExistingData();
  }, [route?.params?.reportData]);

  // Get all notes from both tables for section 8
  const allResultNotes = useMemo(() => {
    const notes: NoteItem[] = [];

    consumptionMeasurements.forEach((measurement) => {
      measurement.resultNotes.forEach((note) => {
        notes.push({
          ...note,
          source: '5.1',
          rowNo: measurement.no,
        });
      });
    });

    residualMeasurements.forEach((measurement) => {
      measurement.resultNotes.forEach((note) => {
        notes.push({
          ...note,
          source: '5.2',
          rowNo: measurement.no,
        });
      });
    });

    return notes;
  }, [consumptionMeasurements, residualMeasurements]);

  // Save handler
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const formData = {
        form_name: 'grounding',
        work_order_id: route?.params?.workOrderId,
        data: {
          panel_id: route?.params?.panelId,
          panel_name: route?.params?.panelName,
          measurementMethod,
          consumptionMeasurements,
          residualMeasurements,
          defectDescription,
          generalNotes,
          allResultNotes,
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
        message: 'Topraklama raporu başarıyla kaydedildi.',
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
    route?.params?.panelId,
    route?.params?.panelName,
    measurementMethod,
    consumptionMeasurements,
    residualMeasurements,
    defectDescription,
    generalNotes,
    allResultNotes,
    existingFormId,
    navigation,
  ]);

  // Row action menu state (bottom sheet modal)
  const [rowMenuVisible, setRowMenuVisible] = useState<{ table: '5.1' | '5.2', index: number } | null>(null);

  // Consumption measurement functions
  const addConsumptionRow = useCallback(() => {
    setConsumptionMeasurements(prev => [
      ...prev,
      {
        no: (prev.length + 1).toString(),
        measurementPoint: "",
        inCurrent: "",
        curveType: "",
        tripCurrent: "",
        shortCircuitCurrent: "",
        measuredValue: "",
        limitValue: "",
        rcdInfo: "",
        tripCurrentDelta: "",
        tripTimeDelta: "",
        result: "",
        resultNotes: [],
      }
    ]);
  }, []);

  const addConsumptionRowAfter = useCallback((index: number) => {
    setConsumptionMeasurements(prev => {
      const newRow = {
        no: "",
        measurementPoint: "",
        inCurrent: "",
        curveType: "",
        tripCurrent: "",
        shortCircuitCurrent: "",
        measuredValue: "",
        limitValue: "",
        rcdInfo: "",
        tripCurrentDelta: "",
        tripTimeDelta: "",
        result: "",
        resultNotes: [],
      };
      const newMeasurements = [
        ...prev.slice(0, index + 1),
        newRow,
        ...prev.slice(index + 1)
      ];
      return newMeasurements.map((item, i) => ({ ...item, no: (i + 1).toString() }));
    });
    setRowMenuVisible(null);
  }, []);

  const addConsumptionRowBefore = useCallback((index: number) => {
    setConsumptionMeasurements(prev => {
      const newRow = {
        no: "",
        measurementPoint: "",
        inCurrent: "",
        curveType: "",
        tripCurrent: "",
        shortCircuitCurrent: "",
        measuredValue: "",
        limitValue: "",
        rcdInfo: "",
        tripCurrentDelta: "",
        tripTimeDelta: "",
        result: "",
        resultNotes: [],
      };
      const newMeasurements = [
        ...prev.slice(0, index),
        newRow,
        ...prev.slice(index)
      ];
      return newMeasurements.map((item, i) => ({ ...item, no: (i + 1).toString() }));
    });
    setRowMenuVisible(null);
  }, []);

  const removeConsumptionRow = useCallback((index: number) => {
    if (consumptionMeasurements.length > 1) {
      setConsumptionMeasurements(prev => {
        const newMeasurements = prev.filter((_, i) => i !== index);
        return newMeasurements.map((item, i) => ({ ...item, no: (i + 1).toString() }));
      });
    }
    setRowMenuVisible(null);
  }, [consumptionMeasurements.length]);

  const updateConsumptionField = useCallback((index: number, field: keyof ConsumptionPointMeasurement, value: string) => {
    setConsumptionMeasurements(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;
        
        const updated = { ...item, [field]: value };
        
        // Otomatik hesaplamalar
        const inCurrent = parseFloat(updated.inCurrent) || 0;
        const curveType = updated.curveType.toUpperCase();
        const measuredValue = parseFloat(updated.measuredValue) || 0;
        const tripCurrentDelta = parseFloat(updated.tripCurrentDelta) || 0;
        const tripTimeDelta = parseFloat(updated.tripTimeDelta) || 0;
        
        // 1. Ia hesaplama (Açma akımı)
        let tripCurrent = 0;
        if (inCurrent > 0) {
          switch (curveType) {
            case 'B':
              tripCurrent = inCurrent * 5;
              break;
            case 'C':
              tripCurrent = inCurrent * 10;
              break;
            case 'D':
              tripCurrent = inCurrent * 15;
              break;
            case 'TMŞ':
            case 'TMS':
              tripCurrent = inCurrent * 5;
              break;
            case 'ATS':
              tripCurrent = inCurrent * 1;
              break;
            default:
              tripCurrent = 0;
          }
        }
        updated.tripCurrent = tripCurrent > 0 ? tripCurrent.toFixed(2) : '';
        
        // 2. Ik1 hesaplama (Kısa devre akımı)
        if (measuredValue > 0 && tripCurrent > 0) {
          const shortCircuitCurrent = 230 / measuredValue;
          updated.shortCircuitCurrent = shortCircuitCurrent.toFixed(2);
        } else {
          updated.shortCircuitCurrent = '';
        }
        
        // 3. Zs/RA limit değeri hesaplama
        if (tripCurrent > 0) {
          const limitValue = 230 / tripCurrent;
          updated.limitValue = limitValue.toFixed(2);
        } else {
          updated.limitValue = '';
        }
        
        // 4. Sonuç ve notları otomatik belirle
        const rcdInfo = updated.rcdInfo.toLowerCase();
        const hasRcd = rcdInfo.includes('30') || rcdInfo.includes('300') || rcdInfo.includes('1000');
        const rcdTypeMa = hasRcd ? (
          rcdInfo.includes('30') ? 30 : 
          rcdInfo.includes('300') ? 300 : 
          rcdInfo.includes('1000') ? 1000 : 0
        ) : 0;
        
        const newNotes: NoteItem[] = [];
        
        // Kontroller
        if (measuredValue > 2000) {
          // Not 3: Topraklama bağlantısı yok
          newNotes.push({
            id: `auto-T003-${Date.now()}`,
            code: 'T003',
            description: 'Topraklama bağlantısı yoktur, kontrol edilmelidir (Ağır kusur)',
            source: '5.1',
            rowNo: updated.no,
          });
        } else if (measuredValue > 80 || (hasRcd && tripCurrentDelta > rcdTypeMa)) {
          // Not 2: Güvenlik şartı sağlanmamış
          newNotes.push({
            id: `auto-T002-${Date.now()}`,
            code: 'T002',
            description: 'Güvenlik şartı sağlanmamıştır (Ağır kusur)',
            source: '5.1',
            rowNo: updated.no,
          });
        } else if (hasRcd && tripTimeDelta > 200) {
          // Not 2: Açma zamanı fazla
          newNotes.push({
            id: `auto-T002-${Date.now()}`,
            code: 'T002',
            description: 'Güvenlik şartı sağlanmamıştır (Ağır kusur)',
            source: '5.1',
            rowNo: updated.no,
          });
        } else if (!hasRcd && inCurrent < 32) {
          // Not 5: 32A altı priz devrelerinde 30mA RCD zorunlu
          newNotes.push({
            id: `auto-T005-${Date.now()}`,
            code: 'T005',
            description: '32A altı priz devrelerinde 30mA RCD zorunluluğu sağlanmamıştır (Ağır kusur)',
            source: '5.1',
            rowNo: updated.no,
          });
        } else if (measuredValue > 0 && measuredValue < 80 && hasRcd && tripCurrentDelta <= rcdTypeMa && tripTimeDelta <= 200) {
          // Not 4: Artık akım anahtarı mevcut ve faal
          newNotes.push({
            id: `auto-T004-${Date.now()}`,
            code: 'T004',
            description: 'Artık akım anahtarı (RCD) mevcut ve faaldir, uygundur',
            source: '5.1',
            rowNo: updated.no,
          });
        } else if (measuredValue > 0 && measuredValue < parseFloat(updated.limitValue)) {
          // Not 1: Uygun
          newNotes.push({
            id: `auto-T001-${Date.now()}`,
            code: 'T001',
            description: 'Uygundur',
            source: '5.1',
            rowNo: updated.no,
          });
        }
        
        // Mevcut manuel notları koru, otomatik notları güncelle
        const manualNotes = updated.resultNotes.filter(note => !note.id.startsWith('auto-'));
        updated.resultNotes = [...manualNotes, ...newNotes];
        
        return updated;
      })
    );
  }, []);

  // Residual measurement functions
  const addResidualRow = useCallback(() => {
    setResidualMeasurements(prev => [
      ...prev,
      {
        no: (prev.length + 1).toString(),
        previousPanelName: "",
        rcdType: "",
        ratedCurrent: "",
        tripCurrentDelta: "",
        tripTimeDelay: "",
        feedingPanelName: "",
        rcdType2: "",
        tripCurrentDelta2: "",
        testTripTime: "",
        result: "",
        resultNotes: [],
      }
    ]);
  }, []);

  const addResidualRowAfter = useCallback((index: number) => {
    setResidualMeasurements(prev => {
      const newRow = {
        no: "",
        previousPanelName: "",
        rcdType: "",
        ratedCurrent: "",
        tripCurrentDelta: "",
        tripTimeDelay: "",
        feedingPanelName: "",
        rcdType2: "",
        tripCurrentDelta2: "",
        testTripTime: "",
        result: "",
        resultNotes: [],
      };
      const newMeasurements = [
        ...prev.slice(0, index + 1),
        newRow,
        ...prev.slice(index + 1)
      ];
      return newMeasurements.map((item, i) => ({ ...item, no: (i + 1).toString() }));
    });
    setRowMenuVisible(null);
  }, []);

  const addResidualRowBefore = useCallback((index: number) => {
    setResidualMeasurements(prev => {
      const newRow = {
        no: "",
        previousPanelName: "",
        rcdType: "",
        ratedCurrent: "",
        tripCurrentDelta: "",
        tripTimeDelay: "",
        feedingPanelName: "",
        rcdType2: "",
        tripCurrentDelta2: "",
        testTripTime: "",
        result: "",
        resultNotes: [],
      };
      const newMeasurements = [
        ...prev.slice(0, index),
        newRow,
        ...prev.slice(index)
      ];
      return newMeasurements.map((item, i) => ({ ...item, no: (i + 1).toString() }));
    });
    setRowMenuVisible(null);
  }, []);

  const removeResidualRow = useCallback((index: number) => {
    if (residualMeasurements.length > 1) {
      setResidualMeasurements(prev => {
        const newMeasurements = prev.filter((_, i) => i !== index);
        return newMeasurements.map((item, i) => ({ ...item, no: (i + 1).toString() }));
      });
    }
    setRowMenuVisible(null);
  }, [residualMeasurements.length]);

  const updateResidualField = useCallback((index: number, field: keyof ResidualCurrentMeasurement, value: string) => {
    setResidualMeasurements(prev =>
      prev.map((item, i) => i === index ? { ...item, [field]: value } : item)
    );
  }, []);

  // Note dialog functions
  const openNoteDialog = useCallback((tableType: '5.1' | '5.2', rowIndex: number) => {
    setSelectedRowForNote({ tableType, rowIndex });
    setShowNoteDialog(true);
  }, []);

  const closeNoteDialog = useCallback(() => {
    setShowNoteDialog(false);
    setSelectedRowForNote(null);
    setNewNoteCode('');
    setNewNoteDescription('');
    setNoteSearchQuery('');
  }, []);

  const addCustomNote = useCallback(() => {
    if (selectedRowForNote && newNoteDescription) {
      const newNote: NoteItem = {
        id: Date.now().toString(),
        code: newNoteCode || 'ÖZEL',
        description: newNoteDescription,
        source: selectedRowForNote.tableType,
        rowNo: selectedRowForNote.tableType === '5.1'
          ? consumptionMeasurements[selectedRowForNote.rowIndex].no
          : residualMeasurements[selectedRowForNote.rowIndex].no,
      };

      if (selectedRowForNote.tableType === '5.1') {
        setConsumptionMeasurements(prev =>
          prev.map((item, i) =>
            i === selectedRowForNote.rowIndex
              ? { ...item, resultNotes: [...item.resultNotes, newNote] }
              : item
          )
        );
      } else {
        setResidualMeasurements(prev =>
          prev.map((item, i) =>
            i === selectedRowForNote.rowIndex
              ? { ...item, resultNotes: [...item.resultNotes, newNote] }
              : item
          )
        );
      }
      closeNoteDialog();
    }
  }, [selectedRowForNote, newNoteCode, newNoteDescription, consumptionMeasurements, residualMeasurements, closeNoteDialog]);

  const selectPredefinedNote = useCallback((note: { code: string; description: string }) => {
    if (selectedRowForNote) {
      const newNote: NoteItem = {
        id: Date.now().toString(),
        code: note.code,
        description: note.description,
        source: selectedRowForNote.tableType,
        rowNo: selectedRowForNote.tableType === '5.1'
          ? consumptionMeasurements[selectedRowForNote.rowIndex].no
          : residualMeasurements[selectedRowForNote.rowIndex].no,
      };

      if (selectedRowForNote.tableType === '5.1') {
        setConsumptionMeasurements(prev =>
          prev.map((item, i) =>
            i === selectedRowForNote.rowIndex
              ? { ...item, resultNotes: [...item.resultNotes, newNote] }
              : item
          )
        );
      } else {
        setResidualMeasurements(prev =>
          prev.map((item, i) =>
            i === selectedRowForNote.rowIndex
              ? { ...item, resultNotes: [...item.resultNotes, newNote] }
              : item
          )
        );
      }
      closeNoteDialog();
    }
  }, [selectedRowForNote, consumptionMeasurements, residualMeasurements, closeNoteDialog]);

  const removeNoteFromRow = useCallback((tableType: '5.1' | '5.2', rowIndex: number, noteId: string) => {
    if (tableType === '5.1') {
      setConsumptionMeasurements(prev =>
        prev.map((item, i) =>
          i === rowIndex
            ? { ...item, resultNotes: item.resultNotes.filter(n => n.id !== noteId) }
            : item
        )
      );
    } else {
      setResidualMeasurements(prev =>
        prev.map((item, i) =>
          i === rowIndex
            ? { ...item, resultNotes: item.resultNotes.filter(n => n.id !== noteId) }
            : item
        )
      );
    }
  }, []);

  // Header setup
  useLayoutEffect(() => {
    if (navigation?.setOptions) {
      let headerTitle = '';
      switch (currentPage) {
        case 'measurement-method':
          headerTitle = '5. Ölçüm Ve Doğrulama Metodu';
          break;
        case 'consumption-points':
          headerTitle = '5.1 Son Tüketim Noktası';
          break;
        case 'residual-current':
          headerTitle = '5.2 Artık Akım Anahtarları';
          break;
        case 'defects':
          headerTitle = '6. Kusur Açıklamaları';
          break;
        case 'notes':
          headerTitle = '7. Notlar';
          break;
        case 'conclusion':
          headerTitle = '8. Sonuç Ve Kanaat';
          break;
        default:
          headerTitle = '5. Ölçüm Ve Doğrulama Metodu';
      }

      navigation.setOptions({
        title: headerTitle,
        headerStyle: {
          backgroundColor: '#059669', // Green for grounding
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontSize: 16,
          fontWeight: 'bold',
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => {
              switch (currentPage) {
                case 'consumption-points':
                  setCurrentPage('measurement-method');
                  break;
                case 'residual-current':
                  setCurrentPage('consumption-points');
                  break;
                case 'defects':
                  setCurrentPage('residual-current');
                  break;
                case 'notes':
                  setCurrentPage('defects');
                  break;
                case 'conclusion':
                  setCurrentPage('notes');
                  break;
                default:
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
    methodOptionContainer: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      overflow: 'hidden',
    },
    methodOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    methodOptionSelected: {
      backgroundColor: '#D1FAE5',
    },
    methodOptionText: {
      fontSize: 14,
      color: theme.text,
    },
    methodOptionTextSelected: {
      fontWeight: '600',
      color: '#059669',
    },
    methodCheckmarkContainer: {
      width: 20,
      alignItems: 'center',
    },
    tableContainer: {
      marginTop: 8,
    },
    tableScrollView: {
      marginBottom: 16,
    },
    tableHeader: {
      flexDirection: 'row',
      backgroundColor: '#059669',
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    },
    tableHeaderCell: {
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderRightWidth: 1,
      borderRightColor: 'rgba(255,255,255,0.3)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    tableHeaderText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '600',
      textAlign: 'center',
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      backgroundColor: theme.surface,
    },
    tableCell: {
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRightWidth: 1,
      borderRightColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 44,
    },
    tableCellText: {
      color: theme.text,
      fontSize: 12,
      textAlign: 'center',
    },
    tableInput: {
      color: theme.text,
      fontSize: 12,
      padding: 4,
      textAlign: 'center',
      minHeight: 30,
      width: '100%',
    },
    addRowButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      backgroundColor: '#ECFDF5',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#059669',
      borderStyle: 'dashed',
      marginTop: 8,
    },
    addRowButtonText: {
      color: '#059669',
      fontSize: 14,
      fontWeight: '600',
      marginLeft: 8,
    },
    deleteButton: {
      padding: 4,
    },
    addAfterButton: {
      padding: 4,
    },
    noteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginTop: 4,
    },
    noteButtonText: {
      color: '#D97706',
      fontSize: 10,
      marginLeft: 4,
    },
    noteTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#DBEAFE',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      marginTop: 4,
      marginRight: 4,
    },
    noteTagText: {
      color: '#1D4ED8',
      fontSize: 9,
      marginRight: 4,
    },
    textArea: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: theme.text,
      minHeight: 200,
      textAlignVertical: 'top',
    },
    navigationButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.surface,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    navigationButtonsInline: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 0,
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
    conclusionItem: {
      flexDirection: 'row',
      backgroundColor: theme.background,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      alignItems: 'flex-start',
    },
    conclusionSource: {
      backgroundColor: '#059669',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      marginRight: 12,
    },
    conclusionSourceText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '600',
    },
    conclusionContent: {
      flex: 1,
    },
    conclusionCode: {
      color: '#059669',
      fontSize: 12,
      fontWeight: '600',
    },
    conclusionDescription: {
      color: theme.text,
      fontSize: 13,
      marginTop: 2,
    },
    emptyConclusion: {
      alignItems: 'center',
      paddingVertical: 40,
    },
    emptyConclusionText: {
      color: theme.textSecondary,
      fontSize: 14,
      marginTop: 12,
    },
    bottomPadding: {
      height: 40,
    },
    // Row menu styles (bottom sheet)
    rowMenuButton: {
      padding: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowMenuModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    rowMenuModalContent: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingTop: 8,
      paddingBottom: 32,
    },
    rowMenuHandle: {
      width: 40,
      height: 4,
      backgroundColor: theme.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 16,
    },
    rowMenuTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      textAlign: 'center',
      marginBottom: 16,
      paddingHorizontal: 20,
    },
    rowMenuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    rowMenuItemDanger: {
      borderBottomWidth: 0,
    },
    rowMenuItemIcon: {
      width: 24,
      alignItems: 'center',
      marginRight: 12,
    },
    rowMenuItemText: {
      fontSize: 15,
      color: theme.text,
      fontWeight: '500',
    },
    rowMenuItemTextDanger: {
      color: '#DC2626',
    },
    notesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 4,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: theme.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
      padding: 20,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.text,
    },
    modalScrollView: {
      maxHeight: 400,
    },
    sectionLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    newNoteSection: {
      marginBottom: 16,
    },
    noteInput: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 14,
      color: theme.text,
    },
    createNoteButton: {
      backgroundColor: '#059669',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 12,
    },
    createNoteButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    disabledButton: {
      opacity: 0.5,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      marginBottom: 12,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.text,
    },
    predefinedNoteItem: {
      flexDirection: 'row',
      padding: 12,
      backgroundColor: theme.background,
      borderRadius: 8,
      marginBottom: 8,
      alignItems: 'flex-start',
    },
    predefinedNoteCode: {
      color: '#059669',
      fontSize: 12,
      fontWeight: '600',
      marginRight: 8,
      minWidth: 40,
    },
    predefinedNoteDescription: {
      color: theme.text,
      fontSize: 13,
      flex: 1,
    },
    resultCell: {
      alignItems: 'flex-start',
      padding: 4,
    },
  });

  // Render measurement method page
  const renderMeasurementMethodPage = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Ölçüm Ve Doğrulama Metodu Seçiniz</Text>
      <View style={styles.methodOptionContainer}>
        {measurementMethodOptions.map((option, index) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.methodOption,
              measurementMethod === option && styles.methodOptionSelected,
              index === measurementMethodOptions.length - 1 && { borderBottomWidth: 0 },
            ]}
            onPress={() => setMeasurementMethod(option)}
          >
            <Text
              style={[
                styles.methodOptionText,
                measurementMethod === option && styles.methodOptionTextSelected,
              ]}
            >
              {option}
            </Text>
            <View style={styles.methodCheckmarkContainer}>
              {measurementMethod === option && <Ionicons name="checkmark" size={14} color="#059669" />}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render consumption points table (5.1)
  const renderConsumptionPointsPage = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Son Tüketim Noktası Ölçümleri</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollView}>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.tableHeaderCell, { width: 50 }]}>
              <Text style={styles.tableHeaderText}>Aksiyon</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 40 }]}>
              <Text style={styles.tableHeaderText}>No</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 120 }]}>
              <Text style={styles.tableHeaderText}>Ölçüm Noktası / Etiketi</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 60 }]}>
              <Text style={styles.tableHeaderText}>In (A)</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 80 }]}>
              <Text style={styles.tableHeaderText}>Açma Eğrisi Tipi</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 70 }]}>
              <Text style={styles.tableHeaderText}>Ia (A)</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 70 }]}>
              <Text style={styles.tableHeaderText}>Ik1 (A)</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 80 }]}>
              <Text style={styles.tableHeaderText}>Zx/Rx (Ω)</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 80 }]}>
              <Text style={styles.tableHeaderText}>Zs/RA (Ω)</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 120 }]}>
              <Text style={styles.tableHeaderText}>RCD In/IΔ</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 70 }]}>
              <Text style={styles.tableHeaderText}>IΔ (mA)</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 70 }]}>
              <Text style={styles.tableHeaderText}>TΔ (ms)</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 150 }]}>
              <Text style={styles.tableHeaderText}>Sonuç</Text>
            </View>
          </View>

          {/* Table Rows */}
          {consumptionMeasurements.map((measurement, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCell, { width: 50 }]}>
                <TouchableOpacity
                  style={styles.rowMenuButton}
                  onPress={() => setRowMenuVisible({ table: '5.1', index })}
                >
                  <Ionicons name="ellipsis-vertical" size={18} color="#059669" />
                </TouchableOpacity>
              </View>
              <View style={[styles.tableCell, { width: 40 }]}>
                <Text style={styles.tableCellText}>{measurement.no}</Text>
              </View>
              <View style={[styles.tableCell, { width: 120 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.measurementPoint}
                  onChangeText={(value) => updateConsumptionField(index, 'measurementPoint', value)}
                  placeholder="Nokta"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.tableCell, { width: 60 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.inCurrent}
                  onChangeText={(value) => updateConsumptionField(index, 'inCurrent', value)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.tableCell, { width: 80 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.curveType}
                  onChangeText={(value) => updateConsumptionField(index, 'curveType', value)}
                  placeholder="B/C/D"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.tableCell, { width: 70 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.tripCurrent}
                  onChangeText={(value) => updateConsumptionField(index, 'tripCurrent', value)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.tableCell, { width: 70 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.shortCircuitCurrent}
                  onChangeText={(value) => updateConsumptionField(index, 'shortCircuitCurrent', value)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.tableCell, { width: 80 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.measuredValue}
                  onChangeText={(value) => updateConsumptionField(index, 'measuredValue', value)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.tableCell, { width: 80 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.limitValue}
                  onChangeText={(value) => updateConsumptionField(index, 'limitValue', value)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.tableCell, { width: 120 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.rcdInfo}
                  onChangeText={(value) => updateConsumptionField(index, 'rcdInfo', value)}
                  placeholder="30/300/1000/Yok"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.tableCell, { width: 70 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.tripCurrentDelta}
                  onChangeText={(value) => updateConsumptionField(index, 'tripCurrentDelta', value)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.tableCell, { width: 70 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.tripTimeDelta}
                  onChangeText={(value) => updateConsumptionField(index, 'tripTimeDelta', value)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.tableCell, styles.resultCell, { width: 150 }]}>
                <TouchableOpacity
                  style={styles.noteButton}
                  onPress={() => openNoteDialog('5.1', index)}
                >
                  <Ionicons name="add-circle" size={14} color="#D97706" />
                  <Text style={styles.noteButtonText}>Not Ekle</Text>
                </TouchableOpacity>
                <View style={styles.notesContainer}>
                  {measurement.resultNotes.map((note) => (
                    <TouchableOpacity
                      key={note.id}
                      style={styles.noteTag}
                      onPress={() => removeNoteFromRow('5.1', index, note.id)}
                    >
                      <Text style={styles.noteTagText}>{note.code}</Text>
                      <Ionicons name="close" size={10} color="#1D4ED8" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.addRowButton} onPress={addConsumptionRow}>
        <Ionicons name="add" size={20} color="#059669" />
        <Text style={styles.addRowButtonText}>Satır Ekle</Text>
      </TouchableOpacity>
    </View>
  );

  // Render residual current table (5.2)
  const renderResidualCurrentPage = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Artık Akım Anahtarları Ölçümleri</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollView}>
        <View style={styles.tableContainer}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <View style={[styles.tableHeaderCell, { width: 50 }]}>
              <Text style={styles.tableHeaderText}>Aksiyon</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 40 }]}>
              <Text style={styles.tableHeaderText}>No</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 140 }]}>
              <Text style={styles.tableHeaderText}>N Önceki Pano Adı</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 70 }]}>
              <Text style={styles.tableHeaderText}>RCD Tipi</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 70 }]}>
              <Text style={styles.tableHeaderText}>In (A)</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 80 }]}>
              <Text style={styles.tableHeaderText}>IΔn (mA)</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 90 }]}>
              <Text style={styles.tableHeaderText}>Gecikme (ms)</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 140 }]}>
              <Text style={styles.tableHeaderText}>Besleyen Pano Adı</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 70 }]}>
              <Text style={styles.tableHeaderText}>RCD Tipi</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 80 }]}>
              <Text style={styles.tableHeaderText}>IΔn (mA)</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 80 }]}>
              <Text style={styles.tableHeaderText}>TΔ (ms)</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: 150 }]}>
              <Text style={styles.tableHeaderText}>Sonuç</Text>
            </View>
          </View>

          {/* Table Rows */}
          {residualMeasurements.map((measurement, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={[styles.tableCell, { width: 50 }]}>
                <TouchableOpacity
                  style={styles.rowMenuButton}
                  onPress={() => setRowMenuVisible({ table: '5.2', index })}
                >
                  <Ionicons name="ellipsis-vertical" size={18} color="#059669" />
                </TouchableOpacity>
              </View>
              <View style={[styles.tableCell, { width: 40 }]}>
                <Text style={styles.tableCellText}>{measurement.no}</Text>
              </View>
              <View style={[styles.tableCell, { width: 140 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.previousPanelName}
                  onChangeText={(value) => updateResidualField(index, 'previousPanelName', value)}
                  placeholder="Pano adı"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.tableCell, { width: 70 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.rcdType}
                  onChangeText={(value) => updateResidualField(index, 'rcdType', value)}
                  placeholder="Tip"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.tableCell, { width: 70 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.ratedCurrent}
                  onChangeText={(value) => updateResidualField(index, 'ratedCurrent', value)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.tableCell, { width: 80 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.tripCurrentDelta}
                  onChangeText={(value) => updateResidualField(index, 'tripCurrentDelta', value)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.tableCell, { width: 90 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.tripTimeDelay}
                  onChangeText={(value) => updateResidualField(index, 'tripTimeDelay', value)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.tableCell, { width: 140 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.feedingPanelName}
                  onChangeText={(value) => updateResidualField(index, 'feedingPanelName', value)}
                  placeholder="Pano adı"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.tableCell, { width: 70 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.rcdType2}
                  onChangeText={(value) => updateResidualField(index, 'rcdType2', value)}
                  placeholder="Tip"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              <View style={[styles.tableCell, { width: 80 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.tripCurrentDelta2}
                  onChangeText={(value) => updateResidualField(index, 'tripCurrentDelta2', value)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.tableCell, { width: 80 }]}>
                <TextInput
                  style={styles.tableInput}
                  value={measurement.testTripTime}
                  onChangeText={(value) => updateResidualField(index, 'testTripTime', value)}
                  placeholder="0"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.tableCell, styles.resultCell, { width: 150 }]}>
                <TouchableOpacity
                  style={styles.noteButton}
                  onPress={() => openNoteDialog('5.2', index)}
                >
                  <Ionicons name="add-circle" size={14} color="#D97706" />
                  <Text style={styles.noteButtonText}>Not Ekle</Text>
                </TouchableOpacity>
                <View style={styles.notesContainer}>
                  {measurement.resultNotes.map((note) => (
                    <TouchableOpacity
                      key={note.id}
                      style={styles.noteTag}
                      onPress={() => removeNoteFromRow('5.2', index, note.id)}
                    >
                      <Text style={styles.noteTagText}>{note.code}</Text>
                      <Ionicons name="close" size={10} color="#1D4ED8" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.addRowButton} onPress={addResidualRow}>
        <Ionicons name="add" size={20} color="#059669" />
        <Text style={styles.addRowButtonText}>Satır Ekle</Text>
      </TouchableOpacity>
    </View>
  );

  // Render defects page (6)
  const renderDefectsPage = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Kusur Açıklamaları</Text>
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

  // Render notes page (7)
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

  // Render conclusion page (8)
  const renderConclusionPage = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Sonuç Ve Kanaat</Text>
      <Text style={{ color: theme.textSecondary, marginBottom: 16, fontSize: 13 }}>
        5.1 ve 5.2 tablolarında eklenen tüm notlar aşağıda otomatik olarak listelenmektedir.
      </Text>

      {allResultNotes.length > 0 ? (
        allResultNotes.map((note, index) => (
          <View key={`${note.id}-${index}`} style={styles.conclusionItem}>
            <View style={styles.conclusionSource}>
              <Text style={styles.conclusionSourceText}>
                {note.source} - Satır {note.rowNo}
              </Text>
            </View>
            <View style={styles.conclusionContent}>
              <Text style={styles.conclusionCode}>{note.code}</Text>
              <Text style={styles.conclusionDescription}>{note.description}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyConclusion}>
          <Ionicons name="document-text-outline" size={48} color={theme.textSecondary} />
          <Text style={styles.emptyConclusionText}>
            Henüz sonuç notu eklenmedi.
          </Text>
          <Text style={[styles.emptyConclusionText, { fontSize: 12, marginTop: 4 }]}>
            5.1 ve 5.2 tablolarından not ekleyebilirsiniz.
          </Text>
        </View>
      )}
    </View>
  );

  // Navigation helper
  const getNextPage = (): PageType | null => {
    switch (currentPage) {
      case 'measurement-method': return 'consumption-points';
      case 'consumption-points': return 'residual-current';
      case 'residual-current': return 'defects';
      case 'defects': return 'notes';
      case 'notes': return 'conclusion';
      case 'conclusion': return null;
      default: return null;
    }
  };

  const getPreviousPage = (): PageType | null => {
    switch (currentPage) {
      case 'consumption-points': return 'measurement-method';
      case 'residual-current': return 'consumption-points';
      case 'defects': return 'residual-current';
      case 'notes': return 'defects';
      case 'conclusion': return 'notes';
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {currentPage === 'measurement-method' && renderMeasurementMethodPage()}
        {currentPage === 'consumption-points' && renderConsumptionPointsPage()}
        {currentPage === 'residual-current' && renderResidualCurrentPage()}
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
              style={[styles.navButton, styles.navButtonNext]}
              onPress={() => {
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

      {/* Note Selection Modal */}
      <Modal visible={showNoteDialog} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Not Seç</Text>
              <TouchableOpacity onPress={closeNoteDialog}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {/* Create New Note */}
              <Text style={styles.sectionLabel}>Yeni Not Oluştur:</Text>
              <View style={styles.newNoteSection}>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Not Kodu (örn: T021)"
                  placeholderTextColor="#9CA3AF"
                  value={newNoteCode}
                  onChangeText={setNewNoteCode}
                />
                <TextInput
                  style={[styles.noteInput, { marginTop: 8 }]}
                  placeholder="Not Açıklaması"
                  placeholderTextColor="#9CA3AF"
                  value={newNoteDescription}
                  onChangeText={setNewNoteDescription}
                  multiline
                  numberOfLines={3}
                />
                <TouchableOpacity
                  style={[styles.createNoteButton, !newNoteDescription && styles.disabledButton]}
                  onPress={addCustomNote}
                  disabled={!newNoteDescription}
                >
                  <Text style={styles.createNoteButtonText}>Not Oluştur</Text>
                </TouchableOpacity>
              </View>

              {/* Search */}
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Hazır Notlar:</Text>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Not ara..."
                  placeholderTextColor="#9CA3AF"
                  value={noteSearchQuery}
                  onChangeText={setNoteSearchQuery}
                />
                {noteSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setNoteSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Predefined Notes */}
              {GROUNDING_NOTE_LIST
                .filter(note =>
                  noteSearchQuery.length === 0 ||
                  note.code.toLowerCase().includes(noteSearchQuery.toLowerCase()) ||
                  note.description.toLowerCase().includes(noteSearchQuery.toLowerCase())
                )
                .map((note, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.predefinedNoteItem}
                    onPress={() => selectPredefinedNote(note)}
                  >
                    <Text style={styles.predefinedNoteCode}>{note.code}</Text>
                    <Text style={styles.predefinedNoteDescription}>{note.description}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Row Action Menu Modal (Bottom Sheet) */}
      <Modal visible={rowMenuVisible !== null} transparent animationType="slide">
        <TouchableOpacity 
          style={styles.rowMenuModalOverlay} 
          activeOpacity={1}
          onPress={() => setRowMenuVisible(null)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.rowMenuModalContent}>
              <View style={styles.rowMenuHandle} />
              <Text style={styles.rowMenuTitle}>Satır İşlemleri</Text>
              
              <TouchableOpacity
                style={styles.rowMenuItem}
                onPress={() => {
                  if (rowMenuVisible) {
                    if (rowMenuVisible.table === '5.1') {
                      addConsumptionRowBefore(rowMenuVisible.index);
                    } else {
                      addResidualRowBefore(rowMenuVisible.index);
                    }
                  }
                }}
              >
                <View style={styles.rowMenuItemIcon}>
                  <Ionicons name="arrow-up-circle-outline" size={22} color="#059669" />
                </View>
                <Text style={styles.rowMenuItemText}>Üste Satır Ekle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.rowMenuItem}
                onPress={() => {
                  if (rowMenuVisible) {
                    if (rowMenuVisible.table === '5.1') {
                      addConsumptionRowAfter(rowMenuVisible.index);
                    } else {
                      addResidualRowAfter(rowMenuVisible.index);
                    }
                  }
                }}
              >
                <View style={styles.rowMenuItemIcon}>
                  <Ionicons name="arrow-down-circle-outline" size={22} color="#059669" />
                </View>
                <Text style={styles.rowMenuItemText}>Alta Satır Ekle</Text>
              </TouchableOpacity>

              {((rowMenuVisible?.table === '5.1' && consumptionMeasurements.length > 1) ||
                (rowMenuVisible?.table === '5.2' && residualMeasurements.length > 1)) && (
                <TouchableOpacity
                  style={[styles.rowMenuItem, styles.rowMenuItemDanger]}
                  onPress={() => {
                    if (rowMenuVisible) {
                      if (rowMenuVisible.table === '5.1') {
                        removeConsumptionRow(rowMenuVisible.index);
                      } else {
                        removeResidualRow(rowMenuVisible.index);
                      }
                    }
                  }}
                >
                  <View style={styles.rowMenuItemIcon}>
                    <Ionicons name="trash-outline" size={22} color="#DC2626" />
                  </View>
                  <Text style={[styles.rowMenuItemText, styles.rowMenuItemTextDanger]}>Satırı Sil</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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

export default GroundingNavigatorScreen;
