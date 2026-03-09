// (removed misplaced textInput style)
import React, { useState, useLayoutEffect, useCallback, useMemo, useEffect } from "react";
import { PANEL_ERROR_LIST } from './PanelListScreen';
import { Image, PermissionsAndroid, Platform, Linking } from 'react-native';
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
  ActivityIndicator
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import FormsApi from "../../api/forms";
import { useTheme } from "../../theme/ThemeContext";
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import CustomAlert from "../../components/CustomAlert";
import PanolarApi from "../../api/panolar";
import UploadsApi from "../../api/uploads";

interface ErrorItem {
  id: string;
  code: string;
  description: string;
}

interface ControlItem {
  id: string;
  title: string;
  evaluation: "Uygun" | "Uygun Değil" | "Uygulanamaz" | "Hafif Kusur" | "";
  errors: ErrorItem[];
  isCompleted: boolean; // Track if user has actually made a selection
}

interface ControlSection {
  id: string;
  title: string;
  items: ControlItem[];
}

interface ReportControlNavigatorProps {
  navigation?: any;
  route?: {
    params: {
      workOrderId: number;
      reportTypeId: number;
      panelId: string;
      panelName: string;
      sequenceNumber?: string;
      reportData?: any;
    };
  };
}

interface MeasurementData {
  no: string;
  panelName: string;
  switchType: string;
  setupCount: string;
  inCurrent: string;
  icuShortCircuit: string;
  phaseSection: string;
  npenSection: string;
  peSection: string;
  ibLoadCurrent: string;
  izCarryingCapacity: string;
  deltaI: string;
  deltaT: string;
  result: string;
}

interface PotentialEqualizationMeasurement {
  no: string;
  section: string;
  mainConductorSection: string;
  mainConductorContinuity: string;
  supplementaryConductorSection: string;
  supplementaryConductorContinuity: string;
  result: string;
}

interface FloorIsolationMeasurement {
  no: string;
  location: string;
  width: string;
  length: string;
  resistance: string;
  result: string;
}

const ReportControlNavigator: React.FC<ReportControlNavigatorProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const evaluationOptions = ["Uygun", "Uygun Değil", "Uygulanamaz", "Hafif Kusur"];

  const [controlSections, setControlSections] = useState<ControlSection[]>([
    {
      id: "panel_access",
      title: "PANO VE DİĞER DONANIMLARA GİRİŞİN UYGUNLUĞU",
      items: [
        { id: "cable_network", title: "Kablo şebeke tarafı", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "cable_load", title: "Kablo donanım tarafı", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "panel_fixing", title: "Pano sabitlenmesi (Depreme dayanıklılık)", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "external_protection", title: "Dış darbelere karşı koruma önlemi", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "foreign_materials", title: "Elektrik panosu etrafında yabancı malzemeler", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "ground_isolation", title: "Zemin izolasyonu", evaluation: "Uygun", errors: [], isCompleted: true },
      ],
    },
    {
      id: "grounding",
      title: "TOPRAKLANMIŞ POTANSİYEL DENGELEME VE BESLEMENİN OTOMATİK KESİLMESİ",
      items: [
        { id: "grounding_conductor", title: "Topraklama iletkeni", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "main_potential", title: "Ana potansiyel dengeleme iletkeni", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "additional_potential", title: "Ek Potansiyel dengeleme İletkeni", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "panel_connection", title: "Pano kapak bağlantısı kontrolü 6 mm²", evaluation: "Uygun", errors: [], isCompleted: true },
      ],
    },
    {
      id: "harmful_effects",
      title: "KARŞILIKLI ZARARLI ETKİLERİN ÖNLENMESİ",
      items: [
        { id: "non_electrical_approach", title: "Elektriksel olmayan tesislere yaklaşma kontrolü", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "isolation_separation", title: "Bant I ve Bant II ayrılması, Bant II yalıtımı", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "safety_circuit", title: "Güvenlik devre ayrılması", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "internal_protection", title: "Pano iç kapak, faza erişim engeli koruma", evaluation: "Uygun", errors: [], isCompleted: true },
      ],
    },
    {
      id: "identification",
      title: "TANIMLAMA",
      items: [
        { id: "symbols_instructions", title: "Şemalar, talimatlar, devre çizimleri", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "protection_device_label", title: "Koruma cihaz ve terminal etiket", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "danger_warning", title: "Tehlike işaretleri ve uyarı işaretleri", evaluation: "Uygun", errors: [], isCompleted: true },
      ],
    },
    {
      id: "cables_conductors",
      title: "KABLO VE İLETKENLER",
      items: [
        { id: "cable_suitability", title: "Kablo yollarının uygunluğu ve mekanik koruma", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "cable_colors", title: "Kablo renk kodları (Nötr: Mavi, Toprak: Sarı/Yeşil)", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "resistance_method", title: "Tesisat yöntemi", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "fire_protection", title: "Yangın engeli ve sıcaklık korunması", evaluation: "Uygun", errors: [], isCompleted: true },
      ],
    },
    {
      id: "thermal_camera",
      title: "TERMAL KAMERA",
      items: [
        { id: "photo_date", title: "Fotoğraf tarihi", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "contact_heating", title: "Kontak gevşekliği ısınması", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "photo_number", title: "Fotoğraf numarası", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "overheating_pvc", title: "Aşırı yük ısınması (PVC kablolar >70°C)", evaluation: "Uygun", errors: [], isCompleted: true },
      ],
    },
    {
      id: "general_evaluation",
      title: "GENEL DEĞERLENDİRMELER",
      items: [
        { id: "equipment_fire_extinguisher", title: "Ekipman yangın söndürme tertibatı", evaluation: "Uygulanamaz", errors: [], isCompleted: true },
        { id: "equipment_cleanliness", title: "Ekipman temizlik/bakım durumu", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "panel_connection_corrosion", title: "Pano bağlantılarının korozyon kontrolü", evaluation: "Uygun", errors: [], isCompleted: true },
        { id: "emergency_lighting", title: "Acil durum aydınlatma tertibatı", evaluation: "Uygulanamaz", errors: [], isCompleted: true },
      ],
    },
  ]);

  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [selectedItemForError, setSelectedItemForError] = useState<{ sectionId: string, itemId: string } | null>(null);
  const [newErrorCode, setNewErrorCode] = useState('');
  const [newErrorDescription, setNewErrorDescription] = useState('');
  const [errorSearchQuery, setErrorSearchQuery] = useState('');
  const [isNewErrorSectionExpanded, setIsNewErrorSectionExpanded] = useState(false); // Yeni hata bölümü başlangıçta kapalı
  const [duplicateErrorWarning, setDuplicateErrorWarning] = useState(''); // Duplicate hata uyarısı
  const [currentPage, setCurrentPage] = useState<'all-controls' | 'function' | 'electrical-tests' | 'line-tests' | 'potential-equalization' | 'floor-isolation' | 'error-summary' | 'equipment-photos' | 'notes'>('all-controls');
  // 9. Notlar
  const [notes, setNotes] = useState<string>('');
  // 8. Ekipman Fotoğrafları
  interface EquipmentPhoto {
    id: string;
    uri: string;
    uploadedUrl?: string; // Backend'e yüklenen fotoğrafın URL'si
    filename?: string;    // Yüklenen dosyanın adı
  }
  const [equipmentPhotos, setEquipmentPhotos] = useState<EquipmentPhoto[]>([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
    onCancel?: () => void;
    showCancel?: boolean;
    confirmText?: string;
    cancelText?: string;
  }>({
    title: '',
    message: '',
    type: 'info',
  });
  const [saving, setSaving] = useState(false);
  const [existingFormId, setExistingFormId] = useState<string | null>(null);

  // Form ID'yi yükle ve fotoğraf numarasını hesapla
  useEffect(() => {
    const loadExistingForm = async () => {
      try {
        const panelId = route?.params?.panelId;
        const workOrderId = route?.params?.workOrderId;
        if (!panelId) return;

        const forms = await FormsApi.list({
          form_name: 'control_navigator'
        });

        console.log('[ReportControlNavigator] Toplam form sayısı:', forms.length);
        console.log('[ReportControlNavigator] Mevcut panelId:', panelId);
        console.log('[ReportControlNavigator] Mevcut workOrderId:', workOrderId);

        // Bu panoya ait formu bul
        const existingForm = forms.find((f: any) => f.data?.panelId === panelId);
        if (existingForm) {
          console.log('[ReportControlNavigator] Mevcut form bulundu, veriler yükleniyor...');
          setExistingFormId(existingForm.id);
          // Mevcut verileri yükle
          if (existingForm.data) {
            if (existingForm.data.sections) setControlSections(existingForm.data.sections);
            if (existingForm.data.electricalTestData) setElectricalTestData(existingForm.data.electricalTestData);
            if (existingForm.data.measurements) setMeasurements(existingForm.data.measurements);
            if (existingForm.data.potentialMeasurements) setPotentialMeasurements(existingForm.data.potentialMeasurements);
            if (existingForm.data.floorIsolationMeasurements) setFloorIsolationMeasurements(existingForm.data.floorIsolationMeasurements);
            if (existingForm.data.notes) setNotes(existingForm.data.notes);
            if (existingForm.data.equipmentPhotos) setEquipmentPhotos(existingForm.data.equipmentPhotos);
            if (existingForm.data.photoDate) setPhotoDate(existingForm.data.photoDate);
            if (existingForm.data.photoNumber) {
              setPhotoNumber(existingForm.data.photoNumber);
              console.log('[ReportControlNavigator] Mevcut fotoğraf numarası:', existingForm.data.photoNumber);
            }
          }
        } else {
          console.log('[ReportControlNavigator] Yeni form - fotoğraf numarası hesaplanıyor...');
          // Yeni form - önceki panolardan son fotoğraf numarasını al
          const workOrderForms = forms.filter((f: any) =>
            f.data?.work_order_id === workOrderId &&
            f.form_name === 'control_navigator'
          );

          console.log('[ReportControlNavigator] Aynı iş emrindeki form sayısı:', workOrderForms.length);

          if (workOrderForms.length > 0) {
            // Tüm fotoğraf numaralarını topla
            const allPhotoNumbers: number[] = [];

            workOrderForms.forEach((form: any) => {
              if (form.data?.photoNumber) {
                const photoNumStr = form.data.photoNumber.toString();
                console.log('[ReportControlNavigator] Form photoNumber:', photoNumStr);
                // Tire ile ayrılmış numaraları parse et (örn: "5050-5052-5054")
                const numbers = photoNumStr.split('-').map((n: string) => {
                  const parsed = parseInt(n.trim());
                  return isNaN(parsed) ? 0 : parsed;
                }).filter((n: number) => n > 0);

                console.log('[ReportControlNavigator] Parse edilen numaralar:', numbers);
                allPhotoNumbers.push(...numbers);
              }
            });

            console.log('[ReportControlNavigator] Tüm fotoğraf numaraları:', allPhotoNumbers);

            if (allPhotoNumbers.length > 0) {
              // En büyük numarayı bul ve +2 ekle
              const maxNumber = Math.max(...allPhotoNumbers);
              const nextNumber = maxNumber + 2;
              setPhotoNumber(nextNumber.toString());
              console.log('[ReportControlNavigator] Hesaplanan fotoğraf numarası: max =', maxNumber, ', next =', nextNumber);
            } else {
              console.log('[ReportControlNavigator] Fotoğraf numarası bulunamadı, varsayılan kullanılıyor: 5050');
            }
          } else {
            console.log('[ReportControlNavigator] İlk pano, varsayılan fotoğraf numarası: 5050');
          }
        }
      } catch (e: any) {
        console.error('[ReportControlNavigator] Form yükleme hatası:', e);
      }
    };
    loadExistingForm();
  }, [route?.params?.panelId, route?.params?.workOrderId]);

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  // Kamera izni iste
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        // Önce mevcut izin durumunu kontrol et
        const hasPermission = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.CAMERA
        );

        if (hasPermission) {
          return true;
        }

        // İzin yoksa, iste
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Kamera İzni Gerekli',
            message: 'Fotoğraf çekmek için kamera iznine ihtiyacımız var. Lütfen izin verin.',
            buttonNeutral: 'Daha Sonra Sor',
            buttonNegative: 'İptal',
            buttonPositive: 'İzin Ver',
          },
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          return true;
        } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          // Kullanıcı "Bir daha sorma" seçeneğini işaretledi
          showAlert({
            title: 'İzin Gerekli',
            message: 'Kamera izni reddedildi. Ayarlardan kamera iznini manuel olarak vermeniz gerekiyor.',
            type: 'warning',
            showCancel: true,
            confirmText: 'Ayarlara Git',
            cancelText: 'İptal',
            onConfirm: () => {
              Linking.openSettings();
            },
          });
          return false;
        } else {
          // Kullanıcı izni reddetti
          return false;
        }
      } catch (err) {
        console.warn('Kamera izni hatası:', err);
        return false;
      }
    }
    return true; // iOS için
  };

  // Fotoğraf çekme
  const addEquipmentPhoto = useCallback(async () => {
    const hasPermission = await requestCameraPermission();

    if (!hasPermission) {
      console.log('Kamera izni reddedildi');
      return;
    }

    launchCamera(
      {
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: true,
      },
      (response: ImagePickerResponse) => {
        if (response.didCancel) {
          console.log('Kullanıcı fotoğraf çekmeyi iptal etti');
        } else if (response.errorCode) {
          console.log('Kamera hatası: ', response.errorMessage);
          showAlert({
            title: 'Hata',
            message: response.errorMessage || 'Fotoğraf çekilemedi',
            type: 'error',
          });
        } else if (response.assets && response.assets[0]) {
          const asset = response.assets[0];
          setEquipmentPhotos(prev => [
            ...prev,
            {
              id: Date.now().toString(),
              uri: asset.uri || '',
            },
          ]);
          console.log('Fotoğraf başarıyla eklendi');
        }
      }
    );
  }, []);

  const removeEquipmentPhoto = useCallback((id: string) => {
    setEquipmentPhotos(prev => prev.filter(photo => photo.id !== id));
  }, []);
  // 7. Kusur Açıklamaları için hata listesini derle
  const allErrors = useMemo(() => {
    // Tüm controlSections içindeki item'ların errors'larını topla
    const sectionErrors = controlSections.flatMap(section =>
      section.items.flatMap(item => item.errors.map(error => ({
        code: error.code,
        description: error.description,
        id: error.id
      })))
    );
    // Tekrarlı hataları filtrele (code + description kombinasyonu ile)
    const uniqueErrors = Array.from(
      new Map(
        sectionErrors.map(e => [`${e.code}-${e.description}`, e])
      ).values()
    );
    return uniqueErrors;
  }, [controlSections]);
  // 6.3 Zemin İzolasyonu Kontrolü
  const [floorIsolationMeasurements, setFloorIsolationMeasurements] = useState<FloorIsolationMeasurement[]>([
    {
      no: '1',
      location: '',
      width: '',
      length: '',
      resistance: '',
      result: '',
    },
  ]);

  const updateFloorIsolationMeasurement = useCallback((index: number, field: keyof FloorIsolationMeasurement, value: string) => {
    setFloorIsolationMeasurements(prev => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }, []);

  const addFloorIsolationMeasurement = useCallback(() => {
    setFloorIsolationMeasurements(prev => [
      ...prev,
      {
        no: (prev.length + 1).toString(),
        location: '',
        width: '',
        length: '',
        resistance: '',
        result: '',
      },
    ]);
  }, []);

  const removeFloorIsolationMeasurement = useCallback((index: number) => {
    if (floorIsolationMeasurements.length > 1) {
      setFloorIsolationMeasurements(prev => {
        const newArr = prev.filter((_, i) => i !== index);
        return newArr.map((item, i) => ({ ...item, no: (i + 1).toString() }));
      });
    }
  }, [floorIsolationMeasurements.length]);
  // 6.2 Potansiyel Dengeleme İletkenleri Kontrolü
  const [potentialMeasurements, setPotentialMeasurements] = useState<PotentialEqualizationMeasurement[]>([
    {
      no: '1',
      section: '',
      mainConductorSection: '',
      mainConductorContinuity: '',
      supplementaryConductorSection: '',
      supplementaryConductorContinuity: '',
      result: '',
    },
  ]);

  const updatePotentialMeasurement = useCallback((index: number, field: keyof PotentialEqualizationMeasurement, value: string) => {
    setPotentialMeasurements(prev => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }, []);

  const addPotentialMeasurement = useCallback(() => {
    setPotentialMeasurements(prev => [
      ...prev,
      {
        no: (prev.length + 1).toString(),
        section: '',
        mainConductorSection: '',
        mainConductorContinuity: '',
        supplementaryConductorSection: '',
        supplementaryConductorContinuity: '',
        result: '',
      },
    ]);
  }, []);

  const removePotentialMeasurement = useCallback((index: number) => {
    if (potentialMeasurements.length > 1) {
      setPotentialMeasurements(prev => {
        const newArr = prev.filter((_, i) => i !== index);
        return newArr.map((item, i) => ({ ...item, no: (i + 1).toString() }));
      });
    }
  }, [potentialMeasurements.length]);
  const [functionControlMethod, setFunctionControlMethod] = useState<string>('Çevrim Empedansı');

  // Termal kamera özel alanları
  const [photoDate, setPhotoDate] = useState<string>(() => {
    const today = new Date();
    return today.toLocaleDateString('tr-TR');
  });
  const [photoNumber, setPhotoNumber] = useState<string>('5050');

  // 6.1 Elektriksel Testler alanları
  const [electricalTestData, setElectricalTestData] = useState({
    // Fotoğraftaki ana alanlar
    phaseEarthImpedance: '', // Boş bırakıldı, placeholder'da 0,00 gösterilecek
    voltageFF: '',
    voltageLN: '',
    voltageNPE: '',
    overvoltageProtectionTypeDKD: '',
    phaseNeutralImpedance: '',
    calculatedShortCircuitCurrent: '',
    overvoltageResistanceCurrent: ''
  });

  // 6.1.1 Linye Testleri alanları
  const [measurements, setMeasurements] = useState<MeasurementData[]>([
    {
      no: "1",
      panelName: "",
      switchType: "",
      setupCount: "",
      inCurrent: "",
      icuShortCircuit: "",
      phaseSection: "",
      npenSection: "",
      peSection: "",
      ibLoadCurrent: "",
      izCarryingCapacity: "",
      deltaI: "",
      deltaT: "",
      result: "",
    },
  ]);

  // Kaydet işlevi
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      // 1. Önce fotoğrafları backend'e yükle
      console.log('[ReportControlNavigator] Fotoğraflar yükleniyor...', equipmentPhotos.length);
      const uploadedPhotos = await Promise.all(
        equipmentPhotos.map(async (photo) => {
          // Eğer zaten yüklenmiş URL varsa, tekrar yükleme
          if (photo.uploadedUrl) {
            return photo;
          }

          try {
            // Fotoğrafı backend'e yükle
            const fileName = `equipment_${Date.now()}_${photo.id}.jpg`;
            const uploadResponse = await UploadsApi.file({
              uri: photo.uri,
              name: fileName,
              type: 'image/jpeg',
            });

            console.log('[ReportControlNavigator] Fotoğraf yüklendi:', uploadResponse.url);

            return {
              ...photo,
              uploadedUrl: uploadResponse.url,
              filename: uploadResponse.filename,
            };
          } catch (uploadError: any) {
            console.error('[ReportControlNavigator] Fotoğraf yükleme hatası:', uploadError);
            // Yükleme başarısız olsa bile devam et, local URI'yi sakla
            return photo;
          }
        })
      );

      // 2. Form verilerini kaydet (yüklenmiş fotoğraf URL'leri ile)
      const payload = {
        form_name: 'control_navigator',
        data: {
          work_order_id: route?.params?.workOrderId,
          panelId: route?.params?.panelId,
          panelName: route?.params?.panelName,
          sections: controlSections,
          electricalTestData,
          measurements,
          potentialMeasurements,
          floorIsolationMeasurements,
          notes,
          equipmentPhotos: uploadedPhotos, // Yüklenmiş URL'ler ile kaydet
          photoDate,        // Fotoğraf tarihi
          photoNumber,      // Fotoğraf numarası
        },
        work_order_id: route?.params?.workOrderId,
      };

      if (existingFormId) {
        // Güncelle
        await FormsApi.update(existingFormId, payload);
      } else {
        // Yeni oluştur
        const created = await FormsApi.create(payload);
        setExistingFormId(created.id);
      }

      // State'i güncelle (yüklenmiş URL'ler ile)
      setEquipmentPhotos(uploadedPhotos);

      console.log('[ReportControlNavigator] Tüm veriler başarıyla kaydedildi');

      showAlert({
        title: 'Başarılı',
        message: 'Veriler ve fotoğraflar başarıyla kaydedildi',
        type: 'success',
        onConfirm: () => {
          // Pano listesine geri dön
          navigation.navigate('PanelList', {
            workOrderId: route?.params?.workOrderId,
            reportTypeId: route?.params?.reportTypeId,
          });
        },
      });
    } catch (e: any) {
      console.error('[ReportControlNavigator] Kaydetme hatası:', e);
      showAlert({
        title: 'Hata',
        message: e?.message || 'Kaydetme sırasında bir hata oluştu',
        type: 'error',
      });
    } finally {
      setSaving(false);
    }
  }, [controlSections, electricalTestData, measurements, potentialMeasurements, floorIsolationMeasurements, notes, equipmentPhotos, route?.params?.workOrderId, route?.params?.panelId, route?.params?.panelName, existingFormId, navigation]);

  // Header'ı dinamik olarak güncelle
  useLayoutEffect(() => {
    if (navigation?.setOptions) {
      let headerTitle = '';
      switch (currentPage) {
        case 'all-controls':
          headerTitle = '5.Kontrol Kriterleri Ve Testler';
          break;
        case 'function':
          headerTitle = '6.Fonksiyon Kontrol Kriterleri Ve Testler';
          break;
        case 'electrical-tests':
          headerTitle = '6.1.Aşırı Akım Cihazı/İletken Uygunluğu';
          break;
        case 'line-tests':
          headerTitle = '6.1.1 Linye Testleri';
          break;
        case 'potential-equalization':
          headerTitle = '6.2 Potansiyel Dengeleme İletkenleri Kontrolü';
          break;
        case 'floor-isolation':
          headerTitle = '6.3 Zemin İzolasyonu Kontrolü';
          break;
        case 'error-summary':
          headerTitle = '7.Kusur Açıklamaları';
          break;
        case 'equipment-photos':
          headerTitle = '8.Ekipman Fotoğrafları';
          break;
        case 'notes':
          headerTitle = '9.Notlar';
          break;
        default:
          headerTitle = '5.Kontrol Kriterleri Ve Testler';
      }

      navigation.setOptions({
        title: headerTitle,
        headerStyle: {
          backgroundColor: '#059669',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: 'bold',
        },
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => {
              if (currentPage === 'line-tests') {
                setCurrentPage('electrical-tests');
              } else if (currentPage === 'electrical-tests') {
                setCurrentPage('function');
              } else if (currentPage === 'function') {
                setCurrentPage('all-controls');
              }
              else if (currentPage === 'potential-equalization') {
                setCurrentPage('line-tests');
              }
              else if (currentPage === 'floor-isolation') {
                setCurrentPage('potential-equalization');
              }
              else if (currentPage === 'error-summary') {
                setCurrentPage('floor-isolation');
              }
              else if (currentPage === 'equipment-photos') {
                setCurrentPage('error-summary');
              }
              else if (currentPage === 'notes') {
                setCurrentPage('equipment-photos');
              }
              else {
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
  }, [navigation, currentPage, handleSave]);

  // Değerlendirme güncelleme işlevi
  const updateItemEvaluation = useCallback((sectionId: string, itemId: string, evaluation: string) => {
    setControlSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
            ...section,
            items: section.items.map(item => {
              // Modal açma mantığı: ilk kez uygunsuz/hafif kusur seçiliyorsa ve hata yoksa
              if (
                item.id === itemId &&
                (evaluation === 'Uygun Değil' || evaluation === 'Hafif Kusur') &&
                item.errors.length === 0 &&
                item.evaluation !== evaluation
              ) {
                // Modal'i aç
                setTimeout(() => {
                  openErrorDialog(sectionId, itemId);
                }, 0);
              }
              return item.id === itemId ? { ...item, evaluation: evaluation as any, isCompleted: true } : item;
            })
          }
          : section
      )
    );
  }, []);

  // Elektriksel test verisi güncelleme işlevi
  const updateElectricalTestData = useCallback((field: string, value: string) => {
    setElectricalTestData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Linye testi günceleme işlevleri
  const updateMeasurement = useCallback((index: number, field: keyof MeasurementData, value: string) => {
    setMeasurements(prev => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }, []);

  const addMeasurement = useCallback(() => {
    setMeasurements(prev => [
      ...prev,
      {
        no: (prev.length + 1).toString(),
        panelName: "",
        switchType: "",
        setupCount: "",
        inCurrent: "",
        icuShortCircuit: "",
        phaseSection: "",
        npenSection: "",
        peSection: "",
        ibLoadCurrent: "",
        izCarryingCapacity: "",
        deltaI: "",
        deltaT: "",
        result: "",
      },
    ]);
  }, []);

  const removeMeasurement = useCallback((index: number) => {
    if (measurements.length > 1) {
      setMeasurements(prev => {
        const newMeasurements = prev.filter((_, i) => i !== index);
        return newMeasurements.map((item, i) => ({ ...item, no: (i + 1).toString() }));
      });
    }
  }, [measurements.length]);

  // Error functions
  const predefinedErrors = PANEL_ERROR_LIST;

  const addErrorToItem = useCallback((sectionId: string, itemId: string, error: ErrorItem) => {
    setControlSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
            ...section,
            items: section.items.map(item =>
              item.id === itemId
                ? { ...item, errors: [...item.errors, error] }
                : item
            )
          }
          : section
      )
    );
  }, []);

  const removeErrorFromItem = useCallback((sectionId: string, itemId: string, errorId: string) => {
    setControlSections(prev =>
      prev.map(section =>
        section.id === sectionId
          ? {
            ...section,
            items: section.items.map(item =>
              item.id === itemId
                ? { ...item, errors: item.errors.filter(e => e.id !== errorId) }
                : item
            )
          }
          : section
      )
    );
  }, []);

  // Bir sonraki hata kodunu hesapla
  const getNextErrorCode = useCallback(() => {
    // Tüm mevcut hataların kodlarını topla
    const allCodes: string[] = [];
    controlSections.forEach(section => {
      section.items.forEach(item => {
        item.errors.forEach(error => {
          if (error.code) {
            allCodes.push(error.code);
          }
        });
      });
    });

    // Eön ekli kodları parse et (E001, E002 vs.)
    const numbers = allCodes
      .map(code => {
        const match = code.match(/E(\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(n => n > 0);

    if (numbers.length === 0) {
      return 'E001';
    }

    const maxNumber = Math.max(...numbers);
    const nextNumber = maxNumber + 1;
    return `E${nextNumber.toString().padStart(3, '0')}`;
  }, [controlSections]);

  // Hata kodunun zaten var olup olmadığını kontrol et
  const checkDuplicateErrorCode = useCallback((code: string): boolean => {
    if (!code) return false;

    let isDuplicate = false;
    controlSections.forEach(section => {
      section.items.forEach(item => {
        item.errors.forEach(error => {
          if (error.code?.toLowerCase() === code.toLowerCase()) {
            isDuplicate = true;
          }
        });
      });
    });
    return isDuplicate;
  }, [controlSections]);

  const openErrorDialog = useCallback((sectionId: string, itemId: string) => {
    setSelectedItemForError({ sectionId, itemId });
    setNewErrorCode(getNextErrorCode()); // Otomatik sonraki kodu doldur
    setDuplicateErrorWarning('');
    setIsNewErrorSectionExpanded(false); // Başlangıçta kapalı
    setShowErrorDialog(true);
  }, [getNextErrorCode]);

  const closeErrorDialog = useCallback(() => {
    setShowErrorDialog(false);
    setSelectedItemForError(null);
    setNewErrorCode('');
    setNewErrorDescription('');
    setErrorSearchQuery('');
    setDuplicateErrorWarning('');
    setIsNewErrorSectionExpanded(false);
  }, []);

  const addNewError = useCallback(() => {
    if (selectedItemForError && newErrorDescription) {
      // Duplicate kontrolü
      if (newErrorCode && checkDuplicateErrorCode(newErrorCode)) {
        setDuplicateErrorWarning(`"${newErrorCode}" kodu zaten kullanılmış!`);
        return;
      }

      const newError: ErrorItem = {
        id: Date.now().toString(),
        code: newErrorCode || '', // Kod boş olabilir
        description: newErrorDescription
      };
      addErrorToItem(selectedItemForError.sectionId, selectedItemForError.itemId, newError);
      closeErrorDialog();
    }
  }, [selectedItemForError, newErrorCode, newErrorDescription, addErrorToItem, closeErrorDialog, checkDuplicateErrorCode]);

  const selectPredefinedError = useCallback((error: { code: string, description: string }) => {
    if (selectedItemForError) {
      const newError: ErrorItem = {
        id: Date.now().toString(),
        code: '', // Kod kaldırıldı
        description: error.description
      };
      addErrorToItem(selectedItemForError.sectionId, selectedItemForError.itemId, newError);
      closeErrorDialog();
    }
  }, [selectedItemForError, addErrorToItem, closeErrorDialog]);

  // Değerlendirme rengi
  const getEvaluationColor = (evaluation: string) => {
    switch (evaluation) {
      case "Uygun":
        return "#10B981";
      case "Uygun Değil":
        return "#EF4444";
      case "Uygulanamaz":
        return "#9CA3AF";
      case "Hafif Kusur":
        return "#F59E0B";
      default:
        return "#E5E7EB";
    }
  };

  // Termal kamera özel alanları için render fonksiyonu
  const renderThermalCameraItem = (item: ControlItem) => {
    if (item.id === 'photo_date') {
      return (
        <View key={item.id} style={styles.controlItem}>
          <Text style={styles.controlItemTitle}>{item.title}</Text>
          <TextInput
            style={styles.dateInput}
            value={photoDate}
            onChangeText={setPhotoDate}
            placeholder="GG.AA.YYYY"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      );
    }

    if (item.id === 'photo_number') {
      return (
        <View key={item.id} style={styles.controlItem}>
          <Text style={styles.controlItemTitle}>{item.title}</Text>
          <TextInput
            style={styles.numberInput}
            value={photoNumber}
            onChangeText={setPhotoNumber}
            keyboardType="numeric"
            placeholder="0000"
            placeholderTextColor="#9CA3AF"
          />
        </View>
      );
    }

    // Diğer termal kamera alanları normal şekilde render edilsin
    return (
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
              onPress={() => updateItemEvaluation('thermal_camera', item.id, option)}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={[
                  styles.evaluationText,
                  { color: item.evaluation === option ? "#FFFFFF" : "#6B7280" }
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Error section - only show for "Uygun Değil" or "Hafif Kusur" */}
        {(item.evaluation === "Uygun Değil" || item.evaluation === "Hafif Kusur") && (
          <View style={styles.errorSection}>
            <View style={styles.errorHeader}>
              <Text style={styles.errorHeaderText}>Hatalar:</Text>
              <TouchableOpacity
                style={styles.addErrorButton}
                onPress={() => openErrorDialog('thermal_camera', item.id)}
              >
                <Ionicons name="add-circle" size={20} color="#059669" />
                <Text style={styles.addErrorText}>Hata Ekle</Text>
              </TouchableOpacity>
            </View>

            {item.errors.map((error) => (
              <View key={error.id} style={styles.errorItem}>
                <Text style={styles.errorCode}>{error.code}</Text>
                <Text style={styles.errorDescription}>{error.description}</Text>
                <TouchableOpacity
                  onPress={() => removeErrorFromItem('thermal_camera', item.id, error.id)}
                  style={styles.removeErrorButton}
                >
                  <Ionicons name="trash" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ))}

            {item.errors.length === 0 && (
              <Text style={styles.noErrorsText}>Henüz hata eklenmedi</Text>
            )}
          </View>
        )}
      </View>
    );
  };

  const styles = StyleSheet.create({
    textInput: {
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      textAlign: "left",
    },
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: theme.primary,
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
      fontWeight: "bold",
      color: theme.headerText,
      flex: 1,
      textAlign: "center",
    },
    headerActions: {
      width: 60,
      alignItems: "flex-end",
    },
    saveButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 6,
    },
    saveButtonText: {
      color: theme.headerText,
      fontSize: 12,
      fontWeight: "600",
    },
    progressContainer: {
      backgroundColor: theme.card,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    progressBar: {
      height: 8,
      backgroundColor: theme.border,
      borderRadius: 4,
      marginBottom: 8,
    },
    progressFill: {
      height: "100%",
      backgroundColor: theme.primary,
      borderRadius: 4,
    },
    progressText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      textAlign: "center",
    },
    scrollView: {
      flex: 1,
      marginTop: 12,
    },
    section: {
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.text,
      marginBottom: 16,
      lineHeight: 22,
    },
    controlContainer: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
    },
    controlItem: {
      marginBottom: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    controlItemTitle: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 12,
      lineHeight: 20,
    },
    evaluationContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 4,
      flexWrap: 'nowrap', // Tek satırda tut
    },
    evaluationOption: {
      flex: 1,
      paddingHorizontal: 6,
      paddingVertical: 8,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 0, // Flex shrink için gerekli
    },
    evaluationText: {
      fontSize: 9,
      fontWeight: "600",
      textAlign: "center",
      flexShrink: 1,
    },
    bottomNavigation: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      marginBottom: 16,
    },
    navButton: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.surface,
      borderRadius: 8,
      gap: 8,
    },
    navButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.primary,
    },
    sectionIndicator: {
      fontSize: 16,
      fontWeight: "bold",
      color: theme.text,
    },
    finishButton: {
      backgroundColor: theme.primary,
      borderRadius: 12,
      padding: 18,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 20,
      marginBottom: 16,
    },
    finishButtonText: {
      color: theme.headerText,
      fontSize: 18,
      fontWeight: 'bold',
      marginRight: 8,
    },
    disabledButton: {
      opacity: 0.5,
    },
    disabledText: {
      color: theme.textSecondary,
    },
    bottomPadding: {
      height: 32,
    },
    errorSection: {
      marginTop: 16,
      padding: 12,
      backgroundColor: "#FEF2F2",
      borderRadius: 8,
      borderWidth: 1,
      borderColor: "#FECACA",
    },
    errorHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    errorHeaderText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#7F1D1D",
    },
    addErrorButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    addErrorText: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.primary,
    },
    errorItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      padding: 8,
      borderRadius: 6,
      marginBottom: 4,
      gap: 8,
    },
    errorCode: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#EF4444",
      backgroundColor: "#FEE2E2",
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    errorDescription: {
      flex: 1,
      fontSize: 12,
      color: theme.text,
    },
    removeErrorButton: {
      padding: 4,
    },
    noErrorsText: {
      fontSize: 12,
      color: theme.textSecondary,
      fontStyle: "italic",
      textAlign: "center",
      padding: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      justifyContent: "flex-end",
    },
    modalContent: {
      backgroundColor: theme.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: "80%",
    },
    modalHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
    },
    modalScrollView: {
      padding: 20,
    },
    sectionLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 12,
      marginTop: 8,
    },
    predefinedErrorItem: {
      backgroundColor: theme.surface,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    predefinedErrorCode: {
      fontSize: 12,
      fontWeight: "bold",
      color: "#EF4444",
      marginBottom: 4,
    },
    predefinedErrorDescription: {
      fontSize: 14,
      color: theme.text,
    },
    newErrorSection: {
      backgroundColor: theme.surface,
      padding: 16,
      borderRadius: 8,
      gap: 12,
    },
    errorInput: {
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      color: theme.text,
    },
    errorDescriptionInput: {
      minHeight: 80,
      textAlignVertical: "top",
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: theme.text,
      padding: 0,
    },
    createErrorButton: {
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingVertical: 12,
      alignItems: "center",
    },
    createErrorButtonText: {
      color: theme.headerText,
      fontSize: 14,
      fontWeight: "600",
    },
    functionMethodContainer: {
      gap: 12,
    },
    methodOption: {
      backgroundColor: theme.surface,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: "center",
    },
    methodText: {
      fontSize: 14,
      fontWeight: "600",
      textAlign: "center",
    },
    dateInput: {
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      textAlign: "center",
    },
    numberInput: {
      backgroundColor: theme.surface,
      borderWidth: 2,
      borderColor: theme.primary,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      textAlign: "center",
    },
    sectionHeader: {
      backgroundColor: theme.surface,
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginVertical: 8,
      borderRadius: 8,
      alignItems: "center",
    },
    sectionHeaderText: {
      fontSize: 14,
      fontWeight: "bold",
      color: theme.primary,
      letterSpacing: 1,
    },
    measurementCard: {
      backgroundColor: theme.card,
      marginBottom: 16,
      borderRadius: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardHeader: {
      backgroundColor: theme.primary,
      padding: 16,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.headerText,
    },
    cardContent: {
      padding: 16,
    },
    inputRow: {
      marginBottom: 16,
    },
    twoColumnRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    threeColumnRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    halfWidth: {
      width: "48%",
    },
    thirdWidth: {
      width: "32%",
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 8,
      lineHeight: 20,
    },
    cardInput: {
      borderWidth: 2,
      borderColor: theme.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      color: theme.text,
      backgroundColor: theme.surface,
      minHeight: 44,
    },
    removeButton: {
      padding: 4,
    },
    addButton: {
      backgroundColor: theme.surface,
      borderRadius: 12,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "#059669",
      borderStyle: "dashed",
    },
    addButtonText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#059669",
      marginLeft: 8,
    },
    // Table Styles
    tableContainer: {
      marginVertical: 16,
    },
    tableRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    tableHeaderCell: {
      backgroundColor: theme.primary,
      padding: 12,
      borderRightWidth: 1,
      borderRightColor: theme.border,
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: 50,
    },
    tableHeaderText: {
      color: theme.headerText,
      fontWeight: 'bold',
      fontSize: 12,
      textAlign: 'center',
    },
    tableCell: {
      backgroundColor: theme.card,
      padding: 8,
      borderRightWidth: 1,
      borderRightColor: theme.border,
      justifyContent: 'center',
      minHeight: 44,
    },
    tableCellText: {
      color: theme.text,
      fontSize: 14,
      textAlign: 'center',
    },
    tableInput: {
      color: theme.text,
      fontSize: 14,
      padding: 4,
      textAlign: 'center',
      minHeight: 30,
    },
    tableDeleteButton: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 4,
    },
    // Accordion and Warning Styles
    accordionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: theme.surface,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.primary,
      marginBottom: 8,
    },
    warningContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FEF3C7',
      padding: 10,
      borderRadius: 8,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: '#F59E0B',
    },
    warningText: {
      color: '#B45309',
      fontSize: 13,
      fontWeight: '500',
      marginLeft: 8,
      flex: 1,
    },
    errorInputWarning: {
      borderColor: '#F59E0B',
      backgroundColor: '#FFFBEB',
    },
    helperText: {
      fontSize: 12,
      color: '#6B7280',
      marginTop: 4,
      marginBottom: 4,
      fontStyle: 'italic',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {currentPage === 'all-controls' ? (
          <>
            {/* All Control Sections on One Page */}
            {controlSections.map((section, sectionIndex) => (
              <View key={section.id} style={styles.section}>
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <View style={styles.controlContainer}>
                  {section.id === 'thermal_camera'
                    ? section.items.map((item) => renderThermalCameraItem(item))
                    : section.items.map((item) => (
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
                                numberOfLines={1}
                                adjustsFontSizeToFit
                                style={[
                                  styles.evaluationText,
                                  { color: item.evaluation === option ? "#FFFFFF" : "#6B7280" }
                                ]}
                              >
                                {option}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        {/* Error section - only show for "Uygun Değil" or "Hafif Kusur" */}
                        {(item.evaluation === "Uygun Değil" || item.evaluation === "Hafif Kusur") && (
                          <View style={styles.errorSection}>
                            <View style={styles.errorHeader}>
                              <Text style={styles.errorHeaderText}>Hatalar:</Text>
                              <TouchableOpacity
                                style={styles.addErrorButton}
                                onPress={() => openErrorDialog(section.id, item.id)}
                              >
                                <Ionicons name="add-circle" size={20} color="#059669" />
                                <Text style={styles.addErrorText}>Hata Ekle</Text>
                              </TouchableOpacity>
                            </View>

                            {item.errors.map((error) => (
                              <View key={error.id} style={styles.errorItem}>
                                <Text style={styles.errorCode}>{error.code}</Text>
                                <Text style={styles.errorDescription}>{error.description}</Text>
                                <TouchableOpacity
                                  onPress={() => removeErrorFromItem(section.id, item.id, error.id)}
                                  style={styles.removeErrorButton}
                                >
                                  <Ionicons name="trash" size={16} color="#EF4444" />
                                </TouchableOpacity>
                              </View>
                            ))}

                            {item.errors.length === 0 && (
                              <Text style={styles.noErrorsText}>Henüz hata eklenmedi</Text>
                            )}
                          </View>
                        )}
                      </View>
                    ))}
                </View>
              </View>
            ))}

            {/* Bottom Navigation - All Controls Page */}
            <View style={styles.bottomNavigation}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.navButton}
              >
                <Ionicons name="chevron-back" size={20} color="#059669" />
                <Text style={styles.navButtonText}>
                  Geri
                </Text>
              </TouchableOpacity>

              <Text style={styles.sectionIndicator}>
                Kontrol Kriterleri
              </Text>

              <TouchableOpacity
                onPress={() => setCurrentPage('function')}
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>
                  İleri
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#059669" />
              </TouchableOpacity>
            </View>
          </>
        ) : currentPage === 'function' ? (
          <>
            {/* Function Control Page */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>FONKSIYON KONTROL KRİTERLERİ</Text>
              <View style={styles.controlContainer}>
                <View style={styles.controlItem}>
                  <Text style={styles.controlItemTitle}>Ölçüm ve doğrulama metodu?</Text>
                  <View style={styles.functionMethodContainer}>
                    {['Üç Uçlu Karşılaştırma', 'Çevrim Empedansı', 'Klamp Yöntemi'].map((method) => (
                      <TouchableOpacity
                        key={method}
                        style={[
                          styles.methodOption,
                          { backgroundColor: functionControlMethod === method ? "#059669" : "#F3F4F6" },
                        ]}
                        onPress={() => setFunctionControlMethod(method)}
                      >
                        <Text
                          style={[
                            styles.methodText,
                            { color: functionControlMethod === method ? "#FFFFFF" : "#6B7280" }
                          ]}
                        >
                          {method}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            </View>

            {/* Bottom Navigation - Function Page */}
            <View style={styles.bottomNavigation}>
              <TouchableOpacity
                onPress={() => setCurrentPage('all-controls')}
                style={styles.navButton}
              >
                <Ionicons name="chevron-back" size={20} color="#059669" />
                <Text style={styles.navButtonText}>
                  Geri
                </Text>
              </TouchableOpacity>

              <Text style={styles.sectionIndicator}>
                Fonksiyon Kontrol
              </Text>

              <TouchableOpacity
                onPress={() => setCurrentPage('electrical-tests')}
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>
                  İleri
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#059669" />
              </TouchableOpacity>
            </View>
          </>
        ) : currentPage === 'electrical-tests' ? (
          <>
            {/* Electrical Tests Page */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6.1. AŞIRI AKIM CİHAZI / İLETKEN UYGUNLUĞU - GERİLİM KONTROLÜ - AŞIRI GERİM CİHAZLARI (DKD) KONTROLÜ - RCD TESTLERİ</Text>
              <View style={styles.controlContainer}>

                {/* Panodan ölçülen faz-toprak çevrim empedansı */}
                <View style={styles.controlItem}>
                  <Text style={styles.controlItemTitle}>Panodan ölçülen faz-toprak çevrim empedansı (Zx) (Ω)</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={electricalTestData.phaseEarthImpedance}
                    onChangeText={(value) => updateElectricalTestData('phaseEarthImpedance', value)}
                    keyboardType="numeric"
                    placeholder="0,00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Panodan ölçülen faz-nötr çevrim empedansı */}
                <View style={styles.controlItem}>
                  <Text style={styles.controlItemTitle}>Panodan ölçülen faz-nötr çevrim empedansı (ZLN) (Ω)</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={electricalTestData.phaseNeutralImpedance}
                    onChangeText={(value) => updateElectricalTestData('phaseNeutralImpedance', value)}
                    keyboardType="numeric"
                    placeholder="0,00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* F-F Gerilimi */}
                <View style={styles.controlItem}>
                  <Text style={styles.controlItemTitle}>F-F (V)</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={electricalTestData.voltageFF}
                    onChangeText={(value) => updateElectricalTestData('voltageFF', value)}
                    keyboardType="numeric"
                    placeholder="380"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* L-N Gerilimi */}
                <View style={styles.controlItem}>
                  <Text style={styles.controlItemTitle}>L-N (V)</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={electricalTestData.voltageLN}
                    onChangeText={(value) => updateElectricalTestData('voltageLN', value)}
                    keyboardType="numeric"
                    placeholder="230"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* N-PE Gerilimi */}
                <View style={styles.controlItem}>
                  <Text style={styles.controlItemTitle}>N-PE (V)</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={electricalTestData.voltageNPE}
                    onChangeText={(value) => updateElectricalTestData('voltageNPE', value)}
                    keyboardType="numeric"
                    placeholder="0,00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Hesaplanan 3 fazlı kısa devre akımı */}
                <View style={styles.controlItem}>
                  <Text style={styles.controlItemTitle}>Hesaplanan 3 fazlı kısa devre akımı (kA)</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={electricalTestData.calculatedShortCircuitCurrent}
                    onChangeText={(value) => updateElectricalTestData('calculatedShortCircuitCurrent', value)}
                    keyboardType="numeric"
                    placeholder="0,00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Aşırı gerilim koruma (DKD) tipi */}
                <View style={styles.controlItem}>
                  <Text style={styles.controlItemTitle}>Aşırı gerilim koruma (DKD) tipi</Text>
                  <TextInput
                    style={styles.textInput}
                    value={electricalTestData.overvoltageProtectionTypeDKD}
                    onChangeText={(value) => updateElectricalTestData('overvoltageProtectionTypeDKD', value)}
                    placeholder="Tip 2, Class II"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

                {/* Aşırı gerilim koruma (DKD) dayanma akımı */}
                <View style={styles.controlItem}>
                  <Text style={styles.controlItemTitle}>Aşırı gerilim koruma (DKD) dayanma akımı (kA)</Text>
                  <TextInput
                    style={styles.numberInput}
                    value={electricalTestData.overvoltageResistanceCurrent}
                    onChangeText={(value) => updateElectricalTestData('overvoltageResistanceCurrent', value)}
                    keyboardType="numeric"
                    placeholder="0,00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>

              </View>
            </View>

            {/* Bottom Navigation - Electrical Tests Page */}
            <View style={styles.bottomNavigation}>
              <TouchableOpacity
                onPress={() => setCurrentPage('function')}
                style={styles.navButton}
              >
                <Ionicons name="chevron-back" size={20} color="#059669" />
                <Text style={styles.navButtonText}>
                  Geri
                </Text>
              </TouchableOpacity>

              <Text style={styles.sectionIndicator}>
                Elektriksel Testler
              </Text>

              <TouchableOpacity
                onPress={() => setCurrentPage('line-tests')}
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>
                  İleri
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#059669" />
              </TouchableOpacity>
            </View>
          </>
        ) : currentPage === 'line-tests' ? (
          <>
            {/* Line Tests Page - Table View */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6.1.1 LİNYE TESTLERİ</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                bounces={true}
                scrollEventThrottle={16}
                decelerationRate="normal"
                style={styles.tableContainer}
                nestedScrollEnabled={true}
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                directionalLockEnabled={false}
              >
                <View>
                  {/* Table Header */}
                  <View style={styles.tableRow}>
                    <View style={[styles.tableHeaderCell, { width: 50 }]}>
                      <Text style={styles.tableHeaderText}>No</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 150 }]}>
                      <Text style={styles.tableHeaderText}>Linye Adı</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 120 }]}>
                      <Text style={styles.tableHeaderText}>Açma Cihazı Tipi</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 80 }]}>
                      <Text style={styles.tableHeaderText}>Kutup Sayısı</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 80 }]}>
                      <Text style={styles.tableHeaderText}>In (A)</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 100 }]}>
                      <Text style={styles.tableHeaderText}>Icu (kA)</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 90 }]}>
                      <Text style={styles.tableHeaderText}>Faz (mm²)</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 90 }]}>
                      <Text style={styles.tableHeaderText}>N/PEN (mm²)</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 90 }]}>
                      <Text style={styles.tableHeaderText}>PE (mm²)</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 80 }]}>
                      <Text style={styles.tableHeaderText}>Ib (A)</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 80 }]}>
                      <Text style={styles.tableHeaderText}>Iz (A)</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 80 }]}>
                      <Text style={styles.tableHeaderText}>IΔ (mA)</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 80 }]}>
                      <Text style={styles.tableHeaderText}>tΔ (ms)</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 120 }]}>
                      <Text style={styles.tableHeaderText}>Sonuç</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 60 }]}>
                      <Text style={styles.tableHeaderText}>Sil</Text>
                    </View>
                  </View>

                  {/* Table Rows */}
                  {measurements.map((measurement, index) => (
                    <View key={index} style={styles.tableRow}>
                      <View style={[styles.tableCell, { width: 50 }]}>
                        <Text style={styles.tableCellText}>{measurement.no}</Text>
                      </View>
                      <View style={[styles.tableCell, { width: 150 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.panelName}
                          onChangeText={(value) => updateMeasurement(index, "panelName", value)}
                          placeholder="Linye adı"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 120 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.switchType}
                          onChangeText={(value) => updateMeasurement(index, "switchType", value)}
                          placeholder="Tip"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 80 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.setupCount}
                          onChangeText={(value) => updateMeasurement(index, "setupCount", value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 80 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.inCurrent}
                          onChangeText={(value) => updateMeasurement(index, "inCurrent", value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 100 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.icuShortCircuit}
                          onChangeText={(value) => updateMeasurement(index, "icuShortCircuit", value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 90 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.phaseSection}
                          onChangeText={(value) => updateMeasurement(index, "phaseSection", value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 90 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.npenSection}
                          onChangeText={(value) => updateMeasurement(index, "npenSection", value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 90 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.peSection}
                          onChangeText={(value) => updateMeasurement(index, "peSection", value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 80 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.ibLoadCurrent}
                          onChangeText={(value) => updateMeasurement(index, "ibLoadCurrent", value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 80 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.izCarryingCapacity}
                          onChangeText={(value) => updateMeasurement(index, "izCarryingCapacity", value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 80 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.deltaI}
                          onChangeText={(value) => updateMeasurement(index, "deltaI", value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 80 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.deltaT}
                          onChangeText={(value) => updateMeasurement(index, "deltaT", value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 120 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.result}
                          onChangeText={(value) => updateMeasurement(index, "result", value)}
                          placeholder="Sonuç"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 60 }]}>
                        {measurements.length > 1 && (
                          <TouchableOpacity onPress={() => removeMeasurement(index)} style={styles.tableDeleteButton}>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.addButton} onPress={addMeasurement}>
                <Ionicons name="add-circle-outline" size={24} color="#059669" />
                <Text style={styles.addButtonText}>Yeni Ölçüm Ekle</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Navigation - Line Tests Page */}
            <View style={styles.bottomNavigation}>
              <TouchableOpacity
                onPress={() => setCurrentPage('electrical-tests')}
                style={styles.navButton}
              >
                <Ionicons name="chevron-back" size={20} color="#059669" />
                <Text style={styles.navButtonText}>
                  Elektriksel Testler
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setCurrentPage('potential-equalization')}
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>
                  Potansiyel Dengeleme
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#059669" />
              </TouchableOpacity>
            </View>
          </>
        ) : currentPage === 'potential-equalization' ? (
          <>
            {/* Potential Equalization Page - Table View */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6.2 POTANSİYEL DENGELEME İLETKENLERİ KONTROLÜ</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                bounces={true}
                scrollEventThrottle={16}
                decelerationRate="normal"
                style={styles.tableContainer}
                nestedScrollEnabled={true}
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                directionalLockEnabled={false}
              >
                <View>
                  {/* Table Header */}
                  <View style={styles.tableRow}>
                    <View style={[styles.tableHeaderCell, { width: 50 }]}>
                      <Text style={styles.tableHeaderText}>No</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 200 }]}>
                      <Text style={styles.tableHeaderText}>Bölüm</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 120 }]}>
                      <Text style={styles.tableHeaderText}>Ana İletken Kesiti (mm²)</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 120 }]}>
                      <Text style={styles.tableHeaderText}>Ana İletken Süreklilik (Ω)</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 120 }]}>
                      <Text style={styles.tableHeaderText}>Tamamlayıcı Kesit (mm²)</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 120 }]}>
                      <Text style={styles.tableHeaderText}>Tamamlayıcı Süreklilik (Ω)</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 150 }]}>
                      <Text style={styles.tableHeaderText}>Sonuç</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 60 }]}>
                      <Text style={styles.tableHeaderText}>Sil</Text>
                    </View>
                  </View>

                  {/* Table Rows */}
                  {potentialMeasurements.map((measurement, index) => (
                    <View key={index} style={styles.tableRow}>
                      <View style={[styles.tableCell, { width: 50 }]}>
                        <Text style={styles.tableCellText}>{measurement.no}</Text>
                      </View>
                      <View style={[styles.tableCell, { width: 200 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.section}
                          onChangeText={(value) => updatePotentialMeasurement(index, 'section', value)}
                          placeholder="Bölüm"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 120 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.mainConductorSection}
                          onChangeText={(value) => updatePotentialMeasurement(index, 'mainConductorSection', value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 120 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.mainConductorContinuity}
                          onChangeText={(value) => updatePotentialMeasurement(index, 'mainConductorContinuity', value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 120 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.supplementaryConductorSection}
                          onChangeText={(value) => updatePotentialMeasurement(index, 'supplementaryConductorSection', value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 120 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.supplementaryConductorContinuity}
                          onChangeText={(value) => updatePotentialMeasurement(index, 'supplementaryConductorContinuity', value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 150 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.result}
                          onChangeText={(value) => updatePotentialMeasurement(index, 'result', value)}
                          placeholder="Sonuç"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 60 }]}>
                        {potentialMeasurements.length > 1 && (
                          <TouchableOpacity onPress={() => removePotentialMeasurement(index)} style={styles.tableDeleteButton}>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.addButton} onPress={addPotentialMeasurement}>
                <Ionicons name="add-circle-outline" size={24} color="#059669" />
                <Text style={styles.addButtonText}>Yeni Ölçüm Ekle</Text>
              </TouchableOpacity>
            </View>
            {/* Bottom Navigation - Potential Equalization Page */}
            <View style={styles.bottomNavigation}>
              <TouchableOpacity
                onPress={() => setCurrentPage('line-tests')}
                style={styles.navButton}
              >
                <Ionicons name="chevron-back" size={20} color="#059669" />
                <Text style={styles.navButtonText}>
                  Geri
                </Text>
              </TouchableOpacity>
              <Text style={styles.sectionIndicator}>
                Potansiyel Dengeleme
              </Text>
              <TouchableOpacity
                onPress={() => setCurrentPage('floor-isolation')}
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>
                  İleri
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#059669" />
              </TouchableOpacity>
            </View>
          </>
        ) : currentPage === 'floor-isolation' ? (
          <>
            {/* Floor Isolation Page - Table View */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6.3 ZEMİN İZOLASYONU KONTROLÜ</Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={true}
                bounces={true}
                scrollEventThrottle={16}
                decelerationRate="normal"
                style={styles.tableContainer}
                nestedScrollEnabled={true}
                contentContainerStyle={{ flexGrow: 1 }}
                keyboardShouldPersistTaps="handled"
                directionalLockEnabled={false}
              >
                <View>
                  {/* Table Header */}
                  <View style={styles.tableRow}>
                    <View style={[styles.tableHeaderCell, { width: 50 }]}>
                      <Text style={styles.tableHeaderText}>No</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 250 }]}>
                      <Text style={styles.tableHeaderText}>Zemin Yalıtımının Yeri</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 100 }]}>
                      <Text style={styles.tableHeaderText}>Eni (m)</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 100 }]}>
                      <Text style={styles.tableHeaderText}>Boyu (m)</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 120 }]}>
                      <Text style={styles.tableHeaderText}>Direnç (kΩ)</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 150 }]}>
                      <Text style={styles.tableHeaderText}>Sonuç</Text>
                    </View>
                    <View style={[styles.tableHeaderCell, { width: 60 }]}>
                      <Text style={styles.tableHeaderText}>Sil</Text>
                    </View>
                  </View>

                  {/* Table Rows */}
                  {floorIsolationMeasurements.map((measurement, index) => (
                    <View key={index} style={styles.tableRow}>
                      <View style={[styles.tableCell, { width: 50 }]}>
                        <Text style={styles.tableCellText}>{measurement.no}</Text>
                      </View>
                      <View style={[styles.tableCell, { width: 250 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.location}
                          onChangeText={(value) => updateFloorIsolationMeasurement(index, 'location', value)}
                          placeholder="Yer"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 100 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.width}
                          onChangeText={(value) => updateFloorIsolationMeasurement(index, 'width', value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 100 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.length}
                          onChangeText={(value) => updateFloorIsolationMeasurement(index, 'length', value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 120 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.resistance}
                          onChangeText={(value) => updateFloorIsolationMeasurement(index, 'resistance', value)}
                          placeholder="0"
                          placeholderTextColor="#9CA3AF"
                          keyboardType="numeric"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 150 }]}>
                        <TextInput
                          style={styles.tableInput}
                          value={measurement.result}
                          onChangeText={(value) => updateFloorIsolationMeasurement(index, 'result', value)}
                          placeholder="Sonuç"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                      <View style={[styles.tableCell, { width: 60 }]}>
                        {floorIsolationMeasurements.length > 1 && (
                          <TouchableOpacity onPress={() => removeFloorIsolationMeasurement(index)} style={styles.tableDeleteButton}>
                            <Ionicons name="trash-outline" size={18} color="#EF4444" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity style={styles.addButton} onPress={addFloorIsolationMeasurement}>
                <Ionicons name="add-circle-outline" size={24} color="#059669" />
                <Text style={styles.addButtonText}>Yeni Ölçüm Ekle</Text>
              </TouchableOpacity>
            </View>
            {/* Bottom Navigation - Floor Isolation Page */}
            <View style={styles.bottomNavigation}>
              <TouchableOpacity
                onPress={() => setCurrentPage('potential-equalization')}
                style={styles.navButton}
              >
                <Ionicons name="chevron-back" size={20} color="#059669" />
                <Text style={styles.navButtonText}>
                  Geri
                </Text>
              </TouchableOpacity>
              <Text style={styles.sectionIndicator}>
                Zemin İzolasyonu
              </Text>
              <TouchableOpacity
                onPress={() => setCurrentPage('error-summary')}
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>
                  İleri
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#059669" />
              </TouchableOpacity>
            </View>
          </>
        ) : currentPage === 'error-summary' ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. KUSUR AÇIKLAMALARI</Text>
              {allErrors.length === 0 ? (
                <Text style={{ color: '#9CA3AF', fontStyle: 'italic', marginTop: 16 }}>Herhangi bir hata eklenmemiştir.</Text>
              ) : (
                allErrors.map((error, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#E5E7EB' }}>
                    <Text style={{ fontWeight: 'bold', color: '#EF4444', marginRight: 12 }}>{error.code}</Text>
                    <Text style={{ color: '#374151', flex: 1 }}>{error.description}</Text>
                  </View>
                ))
              )}
            </View>
            {/* Bottom Navigation - Error Summary Page */}
            <View style={styles.bottomNavigation}>
              <TouchableOpacity
                onPress={() => setCurrentPage('floor-isolation')}
                style={styles.navButton}
              >
                <Ionicons name="chevron-back" size={20} color="#059669" />
                <Text style={styles.navButtonText}>
                  Geri
                </Text>
              </TouchableOpacity>
              <Text style={styles.sectionIndicator}>
                Kusur Açıklamaları
              </Text>
              <TouchableOpacity
                onPress={() => setCurrentPage('equipment-photos')}
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>
                  İleri
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#059669" />
              </TouchableOpacity>
            </View>
          </>
        ) : currentPage === 'equipment-photos' ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. EKİPMAN FOTOĞRAFLARI</Text>
              <TouchableOpacity style={[styles.addButton, { marginBottom: 20 }]} onPress={addEquipmentPhoto}>
                <Ionicons name="camera-outline" size={24} color="#059669" />
                <Text style={styles.addButtonText}>Fotoğraf Ekle</Text>
              </TouchableOpacity>
              {equipmentPhotos.length === 0 ? (
                <Text style={{ color: '#9CA3AF', fontStyle: 'italic', marginTop: 16 }}>Henüz fotoğraf eklenmedi.</Text>
              ) : (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                  {equipmentPhotos.map(photo => (
                    <View key={photo.id} style={{ alignItems: 'center', marginRight: 12, marginBottom: 12 }}>
                      <Image source={{ uri: photo.uri }} style={{ width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB' }} />
                      <TouchableOpacity style={{ marginTop: 4 }} onPress={() => removeEquipmentPhoto(photo.id)}>
                        <Ionicons name="trash-outline" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
            {/* Bottom Navigation - Equipment Photos Page */}
            <View style={styles.bottomNavigation}>
              <TouchableOpacity
                onPress={() => setCurrentPage('error-summary')}
                style={styles.navButton}
              >
                <Ionicons name="chevron-back" size={20} color="#059669" />
                <Text style={styles.navButtonText}>
                  Geri
                </Text>
              </TouchableOpacity>
              <Text style={styles.sectionIndicator}>
                Ekipman Fotoğrafları
              </Text>
              <TouchableOpacity
                onPress={() => setCurrentPage('notes')}
                style={styles.navButton}
              >
                <Text style={styles.navButtonText}>
                  İleri
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#059669" />
              </TouchableOpacity>
            </View>
          </>
        ) : currentPage === 'notes' ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. NOTLAR</Text>
              <TextInput
                style={[styles.cardInput, { minHeight: 120, textAlignVertical: 'top', marginTop: 16 }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Notlarınızı buraya yazabilirsiniz..."
                placeholderTextColor="#9CA3AF"
                multiline
              />
            </View>
            {/* Bottom Navigation - Notes Page */}
            <View style={styles.bottomNavigation}>
              <TouchableOpacity
                onPress={() => setCurrentPage('equipment-photos')}
                style={styles.navButton}
              >
                <Ionicons name="chevron-back" size={20} color="#059669" />
                <Text style={styles.navButtonText}>
                  Geri
                </Text>
              </TouchableOpacity>
              <Text style={styles.sectionIndicator}>
                Notlar
              </Text>
              <TouchableOpacity
                onPress={async () => {
                  await handleSave();
                  showAlert({
                    title: 'Başarılı',
                    message: 'Tüm aşamalar tamamlandı!',
                    type: 'success',
                    onConfirm: () => {
                      // Pano listesine geri dön
                      navigation.navigate('PanelList', {
                        workOrderId: route?.params?.workOrderId,
                        reportTypeId: route?.params?.reportTypeId,
                      });
                    },
                  });
                }}
                style={[styles.navButton, { backgroundColor: theme.primary }]}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={[styles.navButtonText, { color: '#FFFFFF' }]}>
                      Bitir
                    </Text>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <></>
        )}

        <View style={styles.bottomPadding} />
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Error Selection Modal */}
      <Modal visible={showErrorDialog} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hata Seç</Text>
              <TouchableOpacity onPress={closeErrorDialog}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {/* Yeni Hata Oluştur - Accordion Yapısı */}
              <TouchableOpacity
                style={styles.accordionHeader}
                onPress={() => setIsNewErrorSectionExpanded(!isNewErrorSectionExpanded)}
              >
                <Text style={styles.sectionLabel}>Yeni Hata Oluştur</Text>
                <Ionicons
                  name={isNewErrorSectionExpanded ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#059669"
                />
              </TouchableOpacity>

              {isNewErrorSectionExpanded && (
                <View style={styles.newErrorSection}>
                  {/* Duplicate uyarısı */}
                  {duplicateErrorWarning !== '' && (
                    <View style={styles.warningContainer}>
                      <Ionicons name="warning" size={16} color="#F59E0B" />
                      <Text style={styles.warningText}>{duplicateErrorWarning}</Text>
                    </View>
                  )}

                  <TextInput
                    style={[styles.errorInput, duplicateErrorWarning !== '' && styles.errorInputWarning]}
                    placeholder="Hata Kodu (örn: E009)"
                    placeholderTextColor="#9CA3AF"
                    value={newErrorCode}
                    onChangeText={(text) => {
                      setNewErrorCode(text);
                      // Duplicate uyarısını temizle
                      if (duplicateErrorWarning) setDuplicateErrorWarning('');
                    }}
                  />
                  <Text style={styles.helperText}>Önerilen sonraki kod otomatik dolduruldu</Text>

                  <TextInput
                    style={[styles.errorInput, { marginTop: 8 }]}
                    placeholder="Hata Açıklaması"
                    placeholderTextColor="#9CA3AF"
                    value={newErrorDescription}
                    onChangeText={setNewErrorDescription}
                    multiline
                    numberOfLines={3}
                  />
                  <TouchableOpacity
                    style={[styles.createErrorButton, !newErrorDescription && styles.disabledButton]}
                    onPress={addNewError}
                    disabled={!newErrorDescription}
                  >
                    <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.createErrorButtonText}>Hata Oluştur</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Arama */}
              <Text style={[styles.sectionLabel, { marginTop: 20 }]}>Hazır Hatalar:</Text>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#9CA3AF" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Hata ara..."
                  placeholderTextColor="#9CA3AF"
                  value={errorSearchQuery}
                  onChangeText={setErrorSearchQuery}
                />
                {errorSearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setErrorSearchQuery('')}>
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Filtrelenmiş Hazır Hatalar */}
              {predefinedErrors
                .filter(error =>
                  errorSearchQuery.length === 0 ||
                  error.code.toLowerCase().includes(errorSearchQuery.toLowerCase()) ||
                  error.description.toLowerCase().includes(errorSearchQuery.toLowerCase())
                )
                .map((error, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.predefinedErrorItem}
                    onPress={() => selectPredefinedError(error)}
                  >
                    <Text style={styles.predefinedErrorCode}>{error.code}</Text>
                    <Text style={styles.predefinedErrorDescription}>{error.description}</Text>
                  </TouchableOpacity>
                ))}
            </ScrollView>
          </View>
        </View>
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

export default ReportControlNavigator;
