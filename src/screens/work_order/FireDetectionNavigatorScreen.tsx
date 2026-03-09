
import React, { useState, useLayoutEffect, useCallback, useEffect, useRef, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Modal,
    ActivityIndicator,
    Image,
    Keyboard,
    PermissionsAndroid,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { launchCamera } from 'react-native-image-picker';
import * as DocumentPicker from '@react-native-documents/picker';
import DatePicker from 'react-native-date-picker';
import FormsApi from '../../api/forms';
import UploadsApi from '../../api/uploads';
import CustomAlert from '../../components/CustomAlert';
import { useTheme } from '../../theme/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
// --- Interfaces ---

interface FacilityInfo {
    // 2.1 Sistem Detay Bilgileri
    fireDetectionSystem: string[];
    warningSystem: string[];
    systemOperationType: string;
    projectApprovalInstitution: string;
    controlReason: string;
    projectApprovalDateNo: string;
    panelBrandModel: string;
    panelCommissioningDate: string;
    lastControlDate: string;
    panelSerialYear: string;
    panelVoltage: string;
    panelLocation: string;
    detectionEquipment: string[];
    warningEquipment: string[];
    extinguishingEquipment: string[];
    hydrants: string;
    // 2.2 Tespit Edilen Bilgiler
    installationComprehensive: string;
    prevControlLabel: string;
    buildingClass: string;
    buildingDangerClass: string;
    buildingArea: string;
    floorCount: string;
    dangerCategory: string;
    permitDate: string;
    sectionCount: string;
    buildingHeight: string;
    otherFindings: string;
}

interface DeviceControlItem {
    id: string;
    code: string;
    location: string;
    equipment: string;
    eval_project: string;
    eval_access: string;
    eval_mount: string;
    eval_test: string;
    eval_sound: string;
    eval_light: string;
    eval_address: string;
}

interface EquipmentPhoto {
    id: string;
    uri: string;
    uploadedUrl?: string;
}

// --- Constants ---

const VISUAL_INSPECTION_QUESTIONS = [
    {
        category: 'ÖN KONTROLLER',
        questions: [
            { id: 'v1', text: 'Yedekli ve eğitimli personel var mı?' },
            { id: 'v2', text: 'Yangın güvenliği sorumluları belirlenmiş mi?' },
            { id: 'v3', text: 'Yangın alarm panelinin durumu (ekran-tuşlar-LED\'ler)' },
        ]
    },
    {
        category: 'YANGIN ALGILAMA VE YANGIN UYARI SİSTEMİ VE TESİSATI',
        questions: [
            { id: 'v4', text: 'Kontrol paneli ve varsa tekrarlayıcı panellerin yerleşim durumu' },
            { id: 'v5', text: 'Kullanma talimatı var mı?' },
            { id: 'v6', text: 'Kontrol paneli sürekli izlenebilir durumda mı?' },
            { id: 'v7', text: 'Akü kapasitesi, gerilimi ve fiziki durumu' },
            { id: 'v8', text: 'Dedektör ve uyarı buton adreslemesi veya yerleşim haritası var mı?' },
            { id: 'v9', text: 'Dedektörlerin çalışma ortamına uyumu ve yeterli olması' },
            { id: 'v10', text: 'Asma tavan, yükseltilmiş döşeme vb. içinde kalan dedektörlerin uyarılarının görülebilmesi için paralel ihbar lambaları var mı?' },
            { id: 'v11', text: 'Sesli-ışıklı-flaşör uyarılarının yerleşim durumu ve yeterli olması' },
            { id: 'v12', text: 'Çevrimlerde kısa devre ve açık devre koruması' },
            { id: 'v13', text: 'Yangın alarm ve uyarı kablolarının uygunluğu' },
            { id: 'v14', text: 'Güvenlik devre ayrılması (Bant-I, Bant-II\'den ayırma/yalıtım)' },
        ]
    },
    {
        category: 'ACİL DURUM AYDINLATMA VE ACİL DURUM YÖNLENDİRME SİSTEMİ',
        questions: [
            { id: 'v15', text: 'Acil durum aydınlatma armatürleri uygunluğu' },
            { id: 'v16', text: 'Acil durum aydınlatma sistemi varlığı, yeterliliği-panel önü (lux değeri TS EN 12464\'e göre)' },
            { id: 'v17', 'text': 'Acil durum aydınlatma sistemi varlığı, yeterliliği-diğer gerekli alanlar' },
            { id: 'v18', 'text': 'Acil çıkış hollerinde acil durum yönlendirme işaretleri varlığı, yeterliliği' },
            { id: 'v19', 'text': 'Kaçış yollarında acil durum yönlendirme işaretleri varlığı, yeterliliği' },
            { id: 'v20', 'text': 'Acil durum aydınlatma ünitelerinin aydınlatma sürelerinin uygunluğu' },
            { id: 'v21', 'text': 'Acil durum aydınlatma ünitelerinin aydınlatma seviyelerinin uygunluğu' },
            { id: 'v22', 'text': 'Acil durum aydınlatması ve yönlendirmesi elektrik kesildiğinde otomatik devreye girmesi' },
        ]
    },
    {
        category: 'YANGIN ANINDA DİĞER MEKANİK, ELEKTRİK VE ELEKTRONİK SİSTEMLERLE ENTEGRASYON',
        questions: [
            { id: 'v23', text: 'Duman damperleri açık/kapak konum bilgilerinin doğrudan çevrimlere bağlı kontak izleme cihazlar ile izlenebilirliği' },
            { id: 'v24', text: 'İklimlendirme/havalandırma sistemi ve duman/egzoz sistemi sinyal kontrolü' },
            { id: 'v25', text: 'Yangın alarm sisteminin diğer otomatik söndürme sistemleri ile entegre olma durumu' },
            { id: 'v26', text: 'Yangın söndürme sistemi akış anahtarları, hat kesme vanaları, yangın pompaları çalışma fonksiyonları konum bilgisi izlenebilirliği' },
            { id: 'v27', text: 'Yangın algılama ve uyarı sisteminin bina otomasyon sistemi ile bağlantı ve haberleşme kontrolü' },
            { id: 'v28', text: 'Yangın anında asansör kuyuları ve yangın merdiveni kovaları basınçlandırma sistemi kontrolleri' },
            { id: 'v29', text: 'Asansörlerin yangın anında davranışları kontrolü' },
            { id: 'v30', text: 'Yangın bölme kapıları elektromanyetik tutucuları kontrolü' },
            { id: 'v31', text: 'Yangın anında elektrik tesisatında kesicilerin çakışıp çalışmadığı, enerjisi kesilmemesi gereken bölümlerin yedek enerji kaynaklarının bulunup bulunmadığı ve devreye otomatik girip girmediği' },
            { id: 'v32', text: 'Yangın anında patlayıcı gaz dağıtım sistemlerinin kontrolü' },
            { id: 'v33', text: 'Geçiş kontrol sistemleri uygunluğu (döner kapı, turnike, acil çıkış kapıları)' },
        ]
    }
];

const EVALUATION_OPTIONS = ['Uygun', 'Uygun Değil', 'Uygulanamaz', 'Hafif Kusur'];
const EVALUATION_SHORT = {
    'Uygun': 'U',
    'Uygun Değil': 'UD',
    'Uygulanamaz': 'UG',
    'Hafif Kusur': 'HF'
};

const FireDetectionNavigatorScreen = () => {
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { theme } = useTheme();

    // Debug: Keyboard event tracking
    const keyboardEventCount = useRef(0);
    const inputFocusCount = useRef(0);
    const inputBlurCount = useRef(0);
    const textChangeCount = useRef(0);

    useEffect(() => {
        console.log('🔵 [KEYBOARD DEBUG] FireDetectionNavigatorScreen mounted');
        
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
            keyboardEventCount.current++;
            console.log('⬆️ [KEYBOARD DEBUG] keyboardDidShow', {
                eventCount: keyboardEventCount.current,
                height: e.endCoordinates.height,
                timestamp: new Date().toISOString()
            });
        });

        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
            keyboardEventCount.current++;
            console.log('⬇️ [KEYBOARD DEBUG] keyboardDidHide', {
                eventCount: keyboardEventCount.current,
                timestamp: new Date().toISOString(),
                focusCount: inputFocusCount.current,
                blurCount: inputBlurCount.current,
                textChangeCount: textChangeCount.current
            });
        });

        const keyboardWillShowListener = Keyboard.addListener('keyboardWillShow', () => {
            console.log('🔼 [KEYBOARD DEBUG] keyboardWillShow');
        });

        const keyboardWillHideListener = Keyboard.addListener('keyboardWillHide', () => {
            console.log('🔽 [KEYBOARD DEBUG] keyboardWillHide');
        });

        return () => {
            console.log('🔴 [KEYBOARD DEBUG] FireDetectionNavigatorScreen unmounted');
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
            keyboardWillShowListener.remove();
            keyboardWillHideListener.remove();
        };
    }, []);

    // State for Pages
    const [currentPage, setCurrentPage] = useState<'facility-info' | 'visual-inspection' | 'device-controls' | 'defects' | 'photos' | 'notes' | 'conclusion'>('facility-info');
    const [saving, setSaving] = useState(false);
    const [existingFormId, setExistingFormId] = useState<string | null>(null);

    // Debug: Track page changes
    useEffect(() => {
        console.log('📄 [PAGE DEBUG] Page changed to:', currentPage);
    }, [currentPage]);

    // Debug: Track saving state
    useEffect(() => {
        console.log('💾 [SAVE DEBUG] Saving state changed to:', saving);
    }, [saving]);

    // --- Form States ---
    const [facilityInfo, setFacilityInfo] = useState<FacilityInfo>({
        // 2.1 Sistem Detay Bilgileri
        fireDetectionSystem: [],
        warningSystem: [],
        systemOperationType: '',
        projectApprovalInstitution: '',
        controlReason: '',
        projectApprovalDateNo: '',
        panelBrandModel: '',
        panelCommissioningDate: '',
        lastControlDate: '',
        panelSerialYear: '',
        panelVoltage: '',
        panelLocation: '',
        detectionEquipment: [],
        warningEquipment: [],
        extinguishingEquipment: [],
        hydrants: '',
        // 2.2 Tespit Edilen Bilgiler
        installationComprehensive: '',
        prevControlLabel: '',
        buildingClass: '',
        buildingDangerClass: '',
        buildingArea: '',
        floorCount: '',
        dangerCategory: '',
        permitDate: '',
        sectionCount: '',
        buildingHeight: '',
        otherFindings: ''
    });

    const [visualInspections, setVisualInspections] = useState<Record<string, string>>({});
    const [deviceControls, setDeviceControls] = useState<DeviceControlItem[]>([]);
    const [photos, setPhotos] = useState<EquipmentPhoto[]>([]);
    const [notes, setNotes] = useState('');
    const [defectDescription, setDefectDescription] = useState('');
    const [conclusion, setConclusion] = useState('');

    // --- Device Modal State ---
    const [modalVisible, setModalVisible] = useState(false);
    const [editingDevice, setEditingDevice] = useState<DeviceControlItem | null>(null);
    const [tempDevice, setTempDevice] = useState<Partial<DeviceControlItem>>({});

    // --- Date Picker State ---
    const [datePickerVisible, setDatePickerVisible] = useState(false);
    const [datePickerField, setDatePickerField] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState(new Date());

    // --- Alert State ---
    const [alertConfig, setAlertConfig] = useState<any>({ visible: false, title: '', message: '', type: 'info' });


    // Load Form Data
    useEffect(() => {
        const loadForm = async () => {
            try {
                const { workOrderId } = route.params || {};
                if (!workOrderId) return;

                const response = await FormsApi.list({ form_name: 'fire_detection' });
                const form = response.find((f: any) => f.data.work_order_id === workOrderId);

                if (form) {
                    setExistingFormId(form.id);
                    const d = form.data;
                    if (d.facilityInfo) setFacilityInfo(d.facilityInfo);
                    if (d.visualInspections) setVisualInspections(d.visualInspections);
                    if (d.deviceControls) setDeviceControls(d.deviceControls);
                    if (d.defectDescription) setDefectDescription(d.defectDescription);
                    if (d.photos) setPhotos(d.photos);
                    if (d.notes) setNotes(d.notes);
                    if (d.conclusion) setConclusion(d.conclusion);
                }
            } catch (error) {
                console.error('Form yükleme hatası:', error);
            }
        };
        loadForm();
    }, [route.params]);

    // --- Handlers (Defined BEFORE useLayoutEffect to avoid hoisting issues) ---

    const handleBack = useCallback(() => {
        console.log('⬅️ [NAV DEBUG] handleBack called', { currentPage });
        switch (currentPage) {
            case 'conclusion': 
                console.log('⬅️ [NAV DEBUG] Moving back to notes');
                setCurrentPage('notes'); 
                break;
            case 'notes': 
                console.log('⬅️ [NAV DEBUG] Moving back to photos');
                setCurrentPage('photos'); 
                break;
            case 'photos': 
                console.log('⬅️ [NAV DEBUG] Moving back to defects');
                setCurrentPage('defects'); 
                break;
            case 'defects': 
                console.log('⬅️ [NAV DEBUG] Moving back to device-controls');
                setCurrentPage('device-controls'); 
                break;
            case 'device-controls': 
                console.log('⬅️ [NAV DEBUG] Moving back to visual-inspection');
                setCurrentPage('visual-inspection'); 
                break;
            case 'visual-inspection': 
                console.log('⬅️ [NAV DEBUG] Moving back to facility-info');
                setCurrentPage('facility-info'); 
                break;
            default: 
                console.log('⬅️ [NAV DEBUG] Going back to previous screen');
                navigation.goBack(); 
                break;
        }
    }, [currentPage, navigation]);

    const handleSave = useCallback(async () => {
        console.log('💾 [SAVE DEBUG] handleSave called');
        setSaving(true);
        try {
            const { workOrderId } = route.params || {};
            console.log('💾 [SAVE DEBUG] workOrderId:', workOrderId);

            // Upload photos first
            console.log('📸 [SAVE DEBUG] Uploading photos, count:', photos.length);
            const uploadedPhotos = await Promise.all(photos.map(async (p) => {
                if (p.uploadedUrl) return p;
                try {
                    const res = await UploadsApi.file({ uri: p.uri, name: `fire_${Date.now()}.jpg`, type: 'image/jpeg' });
                    return { ...p, uploadedUrl: res.url };
                } catch (e) {
                    console.error('📸 [SAVE DEBUG] Photo upload error:', e);
                    return p;
                }
            }));
            setPhotos(uploadedPhotos);
            console.log('📸 [SAVE DEBUG] Photos uploaded successfully');

            const payload = {
                form_name: 'fire_detection',
                work_order_id: workOrderId,
                data: {
                    work_order_id: workOrderId,
                    facilityInfo,
                    visualInspections,
                    deviceControls,
                    defectDescription,
                    photos: uploadedPhotos,
                    notes,
                    conclusion,
                    timestamp: new Date().toISOString()
                }
            };

            console.log('💾 [SAVE DEBUG] Payload prepared, existingFormId:', existingFormId);

            if (existingFormId) {
                console.log('💾 [SAVE DEBUG] Updating existing form');
                await FormsApi.update(existingFormId, payload);
            } else {
                console.log('💾 [SAVE DEBUG] Creating new form');
                const res = await FormsApi.create(payload);
                setExistingFormId(res.id);
            }

            console.log('✅ [SAVE DEBUG] Save successful');
            setAlertConfig({
                visible: true,
                title: 'Başarılı',
                message: 'Rapor başarıyla kaydedildi.',
                type: 'success',
                onConfirm: () => {
                    console.log('✅ [SAVE DEBUG] Alert confirmed');
                    setAlertConfig((prev: any) => ({ ...prev, visible: false }));
                    if (currentPage === 'conclusion') {
                        console.log('✅ [SAVE DEBUG] Navigating back');
                        navigation.goBack();
                    }
                }
            });
        } catch (error) {
            console.error('❌ [SAVE DEBUG] Save error:', error);
            setAlertConfig({
                visible: true,
                title: 'Hata',
                message: 'Kaydetme sırasında bir hata oluştu.',
                type: 'error',
                onConfirm: () => setAlertConfig((prev: any) => ({ ...prev, visible: false }))
            });
        } finally {
            console.log('💾 [SAVE DEBUG] Setting saving to false');
            setSaving(false);
        }
    }, [existingFormId, facilityInfo, visualInspections, deviceControls, defectDescription, photos, notes, conclusion, route.params, currentPage, navigation]);

    const handleSaveRef = React.useRef<() => void>(() => { });
    useEffect(() => {
        handleSaveRef.current = handleSave;
    }, [handleSave]);

    const onPressSaveStable = useCallback(() => {
        handleSaveRef.current();
    }, []);

    const handleNext = useCallback(() => {
        console.log('➡️ [NAV DEBUG] handleNext called', { currentPage });
        switch (currentPage) {
            case 'facility-info': 
                console.log('➡️ [NAV DEBUG] Moving to visual-inspection');
                setCurrentPage('visual-inspection'); 
                break;
            case 'visual-inspection': 
                console.log('➡️ [NAV DEBUG] Moving to device-controls');
                setCurrentPage('device-controls'); 
                break;
            case 'device-controls': 
                console.log('➡️ [NAV DEBUG] Moving to defects');
                setCurrentPage('defects'); 
                break;
            case 'defects': 
                console.log('➡️ [NAV DEBUG] Moving to photos');
                setCurrentPage('photos'); 
                break;
            case 'photos': 
                console.log('➡️ [NAV DEBUG] Moving to notes');
                setCurrentPage('notes'); 
                break;
            case 'notes': 
                console.log('➡️ [NAV DEBUG] Moving to conclusion');
                setCurrentPage('conclusion'); 
                break;
            case 'conclusion': 
                console.log('➡️ [NAV DEBUG] Calling handleSave');
                handleSave(); 
                break;
        }
    }, [currentPage, handleSave]);

    const handleTakePhoto = async () => {
        try {
            // Android için kamera izni kontrolü
            if (Platform.OS === 'android') {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: 'Kamera İzni',
                        message: 'Fotoğraf çekmek için kamera iznine ihtiyaç var',
                        buttonNeutral: 'Daha Sonra',
                        buttonNegative: 'İptal',
                        buttonPositive: 'Tamam',
                    }
                );

                if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
                    console.log('Kamera izni reddedildi');
                    return;
                }
            }

            const result = await launchCamera({
                mediaType: 'photo',
                quality: 0.8,
                saveToPhotos: false,
                cameraType: 'back',
            });

            if (result.didCancel) {
                console.log('Kullanıcı fotoğraf çekmeyi iptal etti');
                return;
            }

            if (result.errorCode) {
                console.error('Kamera hatası:', result.errorMessage);
                return;
            }

            if (result.assets && result.assets.length > 0 && result.assets[0]?.uri) {
                const uri = result.assets[0].uri;
                setPhotos((prev: EquipmentPhoto[]) => [...prev, {
                    id: Date.now().toString(),
                    uri
                }]);
            }
        } catch (error) {
            console.error('Fotoğraf çekme hatası:', error);
        }
    };

    const handlePickPhoto = async () => {
        try {
            const result = await DocumentPicker.pick({
                type: [DocumentPicker.types.images],
                allowMultiSelection: false,
            });

            if (result && result.length > 0 && result[0]?.uri) {
                const uri = result[0].uri;
                setPhotos((prev: EquipmentPhoto[]) => [...prev, {
                    id: Date.now().toString(),
                    uri
                }]);
            }
        } catch (error: any) {
            if (error?.message === 'User canceled document picker' || error?.message?.includes('canceled')) {
                console.log('Kullanıcı fotoğraf seçmeyi iptal etti');
                return;
            }
            console.error('Fotoğraf seçme hatası:', error);
        }
    };

    const openDatePicker = (fieldKey: string, currentValue: string) => {
        setDatePickerField(fieldKey);
        if (currentValue) {
            const parts = currentValue.split('.');
            if (parts.length === 3) {
                const [day, month, year] = parts;
                setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
            } else {
                setSelectedDate(new Date());
            }
        } else {
            setSelectedDate(new Date());
        }
        setDatePickerVisible(true);
    };

    const handleDateConfirm = (date: Date) => {
        const formatted = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;

        // Determine which field to update based on datePickerField
        if (datePickerField === 'İlk kontrol/devreye alma tarihi') {
            setFacilityInfo(prev => ({ ...prev, panelCommissioningDate: formatted }));
        } else if (datePickerField === 'Son Kontrol Tarihi') {
            setFacilityInfo(prev => ({ ...prev, lastControlDate: formatted }));
        } else if (datePickerField === 'Yapı kullanma izin tarihi') {
            setFacilityInfo(prev => ({ ...prev, permitDate: formatted }));
        }

        setDatePickerVisible(false);
    };

    // --- Navigation Header & Page Logic ---

    useLayoutEffect(() => {
        if (navigation?.setOptions) {
            let headerTitle = '';
            switch (currentPage) {
                case 'facility-info': headerTitle = '2. Tesis Bilgileri'; break;
                case 'visual-inspection': headerTitle = '5.1 Gözle Muayeneler'; break;
                case 'device-controls': headerTitle = '5.2 Cihaz Kontrolleri'; break;
                case 'defects': headerTitle = '6. Kusur Açıklamaları'; break;
                case 'photos': headerTitle = '7. Ekipman Fotoğrafları'; break;
                case 'notes': headerTitle = '8. Notlar'; break;
                case 'conclusion': headerTitle = '9. Sonuç Ve Kanaat'; break;
                default: headerTitle = '2. Tesis Bilgileri';
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
                        onPress={handleBack}
                        style={{ padding: 8, marginLeft: -8 }}
                    >
                        <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                ),
                headerRight: () => (
                    <TouchableOpacity
                        onPress={onPressSaveStable}
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
    }, [navigation, currentPage, saving, handleBack, onPressSaveStable]);

    // --- Styles (Theme-based like other navigators) ---
    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },
        contentContainer: { flex: 1, padding: 16 },
        section: { backgroundColor: theme.surface, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
        sectionTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text, marginBottom: 16 },
        sectionSubtitle: { fontSize: 13, color: theme.textSecondary, marginBottom: 16, marginTop: -12 },

        // Navigation
        bottomNavigation: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border },
        navButton: { flexDirection: 'row', alignItems: 'center', padding: 8 },
        navButtonText: { fontSize: 14, fontWeight: '600', color: '#059669', marginHorizontal: 4 },
        sectionIndicator: { fontSize: 14, fontWeight: '600', color: theme.text },

        // Header
        headerSaveButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6 },
        headerSaveText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },

        // Inputs
        inputContainer: { marginBottom: 12 },
        label: { fontSize: 14, fontWeight: '500', color: theme.text, marginBottom: 4 },
        input: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 12, fontSize: 14, color: theme.text, backgroundColor: theme.background },
        selectContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
        selectButton: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: theme.background, borderWidth: 1, borderColor: theme.border },
        selectButtonActive: { backgroundColor: '#D1FAE5', borderColor: '#059669' },
        selectButtonText: { fontSize: 13, color: theme.text },
        selectButtonTextActive: { color: '#059669', fontWeight: '600' },

        // Visual Inspection
        questionContainer: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 16 },
        questionText: { fontSize: 14, color: theme.text, marginBottom: 10, lineHeight: 20 },
        optionsRow: { flexDirection: 'row', gap: 6 },
        optionButton: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center', justifyContent: 'center', minWidth: 0 },
        optionButtonText: { fontSize: 11, fontWeight: '600' },

        // Table
        tableScrollView: { marginBottom: 8 },
        tableHeaderRow: { flexDirection: 'row', backgroundColor: '#059669', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
        tableHeaderCell: { paddingVertical: 10, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
        tableHeaderText: { color: '#FFF', fontSize: 10, fontWeight: '600', textAlign: 'center' },
        tableDataRow: { flexDirection: 'row', backgroundColor: theme.surface, borderBottomWidth: 1, borderBottomColor: theme.border },
        tableDataCell: { paddingVertical: 8, paddingHorizontal: 4, borderRightWidth: 1, borderRightColor: theme.border, justifyContent: 'center', alignItems: 'center', minHeight: 44 },
        tableCellText: { fontSize: 11, color: theme.text, textAlign: 'center' },
        emptyTableRow: { padding: 20, alignItems: 'center', backgroundColor: theme.background, borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
        emptyTableText: { color: theme.textSecondary, fontSize: 13 },

        // Legacy table styles
        tableContainer: { marginBottom: 8 },
        tableHeader: { flexDirection: 'row', backgroundColor: theme.background, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.border },
        tableRow: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, alignItems: 'center' },
        th: { fontSize: 12, fontWeight: '600', color: theme.textSecondary, paddingHorizontal: 4 },
        td: { fontSize: 13, color: theme.text, paddingHorizontal: 4 },

        addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16, padding: 12, backgroundColor: '#D1FAE5', borderRadius: 8, borderWidth: 1, borderColor: '#059669', borderStyle: 'dashed' },
        addButtonText: { marginLeft: 8, color: '#059669', fontWeight: '600', fontSize: 14 },

        // Photos
        photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
        photoContainer: { width: 100, height: 100, borderRadius: 8, overflow: 'hidden', position: 'relative' },
        photo: { width: '100%', height: '100%' },
        deletePhotoButton: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 12, padding: 4 },
        addPhotoButton: { width: 100, height: 100, borderRadius: 8, borderWidth: 2, borderColor: theme.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background },
        addPhotoText: { marginTop: 4, color: theme.textSecondary, fontSize: 12 },

        // Modal
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
        modalContent: { backgroundColor: theme.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '90%' },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
        modalTitle: { fontSize: 18, fontWeight: 'bold', color: theme.text },
        modalScrollView: { padding: 16, maxHeight: 500 },
        modalSectionLabel: { fontSize: 15, fontWeight: '600', color: theme.text, marginTop: 16, marginBottom: 8 },
        modalHint: { fontSize: 12, color: theme.textSecondary, marginBottom: 12 },
        modalButtons: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, borderTopWidth: 1, borderTopColor: theme.border, gap: 12 },
        modalCancel: { flex: 1, padding: 12, borderRadius: 8, backgroundColor: theme.border, alignItems: 'center' },
        modalCancelText: { color: theme.text, fontWeight: '600', fontSize: 14 },
        modalSave: { flex: 1, backgroundColor: '#059669', padding: 12, borderRadius: 8, alignItems: 'center' },
        modalSaveText: { color: '#FFF', fontWeight: '600', fontSize: 14 },

        // Evaluation in Modal
        evalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
        evalItem: { marginBottom: 16 },
        evalLabel: { fontSize: 13, color: theme.text, marginBottom: 8, fontWeight: '500' },
        evalOptionsRow: { flexDirection: 'row', gap: 8 },
        evalOptionBtn: { flex: 1, paddingVertical: 10, paddingHorizontal: 8, borderRadius: 8, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' },
        evalOptionBtnActive: { backgroundColor: '#059669' },
        evalOptionText: { fontSize: 12, fontWeight: '600', color: theme.textSecondary },
        evalOptionTextActive: { color: '#FFF' },

        // Result/Conclusion options
        resultOptionContainer: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 8, overflow: 'hidden' },
        resultOption: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
        resultOptionSelected: { backgroundColor: '#D1FAE5' },
        resultOptionText: { fontSize: 14, color: theme.text, flex: 1 },
        resultOptionTextSelected: { fontWeight: '600', color: '#059669' },
        checkmarkContainer: { width: 20, alignItems: 'center' },

        // ScrollView and Navigation (like Generator)
        scrollView: { flex: 1, padding: 16 },
        navigationButtonsInline: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, marginTop: 8 },
        navButtonPrev: { backgroundColor: theme.border },
        navButtonNext: { backgroundColor: '#059669' },
        navButtonTextPrev: { color: theme.text, marginLeft: 8 },
        navButtonTextNext: { color: '#FFFFFF', marginRight: 8 },
        bottomPadding: { height: 40 },
    }), [theme]);

    // --- Render Components ---

    const updateFacilityInfo = useCallback((field: keyof FacilityInfo, value: any) => {
        console.log('🔄 [STATE DEBUG] updateFacilityInfo', { field, valueType: typeof value });
        setFacilityInfo(prev => {
            if (prev[field] === value) {
                console.log('⚠️ [STATE DEBUG] Value unchanged, skipping update');
                return prev;
            }
            return { ...prev, [field]: value };
        });
    }, []);

    const SelectInput = ({ label, value, options, onSelect }: any) => (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.selectContainer}>
                {options.map((opt: string) => (
                    <TouchableOpacity
                        key={opt}
                        style={[styles.selectButton, value === opt && styles.selectButtonActive]}
                        onPress={() => onSelect(opt)}
                    >
                        <Text style={[styles.selectButtonText, value === opt && styles.selectButtonTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    const MultiSelectInput = ({ label, values, options, onToggle }: any) => (
        <View style={styles.inputContainer}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.selectContainer}>
                {options.map((opt: string) => {
                    const isSelected = values?.includes(opt);
                    return (
                        <TouchableOpacity
                            key={opt}
                            style={[styles.selectButton, isSelected && styles.selectButtonActive]}
                            onPress={() => onToggle(opt)}
                        >
                            <Text style={[styles.selectButtonText, isSelected && styles.selectButtonTextActive]}>{opt}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );

    const toggleMultiSelect = (field: keyof FacilityInfo, value: string) => {
        setFacilityInfo(prev => {
            const currentValues = prev[field] as string[];
            const newValues = currentValues.includes(value)
                ? currentValues.filter(v => v !== value)
                : [...currentValues, value];
            return { ...prev, [field]: newValues };
        });
    };

    // --- Page Content ---

    const renderFacilityInfo = () => (
        <View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>2.1. Sistem Detay Bilgileri</Text>

                <MultiSelectInput
                    label="Yangın algılama sistemi"
                    values={facilityInfo.fireDetectionSystem}
                    options={['Otomatik', 'Manuel']}
                    onToggle={(v: string) => toggleMultiSelect('fireDetectionSystem', v)}
                />

                <MultiSelectInput
                    label="Uyarı sistemi"
                    values={facilityInfo.warningSystem}
                    options={['Işıklı', 'Sesli', 'Işıklı+Sesli', 'Anons', 'Diğer']}
                    onToggle={(v: string) => toggleMultiSelect('warningSystem', v)}
                />

                <SelectInput
                    label="Sistem çalışma tipi"
                    value={facilityInfo.systemOperationType}
                    options={['Adresli', 'Konvansiyonel']}
                    onSelect={(v: any) => setFacilityInfo(prev => ({ ...prev, systemOperationType: v }))}
                />

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Proje onay kurumu</Text>
                    <TextInput
                        style={styles.input}
                        value={facilityInfo.projectApprovalInstitution}
                        onChangeText={(v) => setFacilityInfo(prev => ({ ...prev, projectApprovalInstitution: v }))}
                        placeholder="Proje onay kurumu"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <SelectInput
                    label="Kontrol nedeni"
                    value={facilityInfo.controlReason}
                    options={['Periyodik Kontrol', 'İlk Kontrol']}
                    onSelect={(v: any) => setFacilityInfo(prev => ({ ...prev, controlReason: v }))}
                />

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Proje onay tarih ve sayısı</Text>
                    <TextInput
                        style={styles.input}
                        value={facilityInfo.projectApprovalDateNo}
                        onChangeText={(v) => setFacilityInfo(prev => ({ ...prev, projectApprovalDateNo: v }))}
                        placeholder="Proje onay tarih ve sayısı"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Kontrol paneli marka/model</Text>
                    <TextInput
                        style={styles.input}
                        value={facilityInfo.panelBrandModel}
                        onChangeText={(v) => setFacilityInfo(prev => ({ ...prev, panelBrandModel: v }))}
                        placeholder="Kontrol paneli marka/model"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>İlk kontrol/devreye alma tarihi</Text>
                    <TouchableOpacity
                        style={[styles.input, { justifyContent: 'center' }]}
                        onPress={() => openDatePicker('İlk kontrol/devreye alma tarihi', facilityInfo.panelCommissioningDate)}
                    >
                        <Text style={{ color: facilityInfo.panelCommissioningDate ? theme.text : '#9CA3AF', fontSize: 14 }}>
                            {facilityInfo.panelCommissioningDate || 'GG.AA.YYYY'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Son Kontrol Tarihi</Text>
                    <TouchableOpacity
                        style={[styles.input, { justifyContent: 'center' }]}
                        onPress={() => openDatePicker('Son Kontrol Tarihi', facilityInfo.lastControlDate)}
                    >
                        <Text style={{ color: facilityInfo.lastControlDate ? theme.text : '#9CA3AF', fontSize: 14 }}>
                            {facilityInfo.lastControlDate || 'GG.AA.YYYY'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Kontrol paneli seri no./imal yılı</Text>
                    <TextInput
                        style={styles.input}
                        value={facilityInfo.panelSerialYear}
                        onChangeText={(v) => setFacilityInfo(prev => ({ ...prev, panelSerialYear: v }))}
                        placeholder="Kontrol paneli seri no./imal yılı"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Kontrol paneli çalışma gerilimi</Text>
                    <TextInput
                        style={styles.input}
                        value={facilityInfo.panelVoltage}
                        onChangeText={(v) => setFacilityInfo(prev => ({ ...prev, panelVoltage: v }))}
                        placeholder="Kontrol paneli çalışma gerilimi"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Kontrol paneli yeri</Text>
                    <TextInput
                        style={styles.input}
                        value={facilityInfo.panelLocation}
                        onChangeText={(v) => setFacilityInfo(prev => ({ ...prev, panelLocation: v }))}
                        placeholder="Kontrol paneli yeri"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <MultiSelectInput
                    label="Algılama ekipmanları"
                    values={facilityInfo.detectionEquipment}
                    options={['Duman (optik) dedektörü', 'Isı dedektörü', 'İhbar butonu']}
                    onToggle={(v: string) => toggleMultiSelect('detectionEquipment', v)}
                />

                <MultiSelectInput
                    label="Uyarı ekipmanları"
                    values={facilityInfo.warningEquipment}
                    options={['Siren', 'Flaşör']}
                    onToggle={(v: string) => toggleMultiSelect('warningEquipment', v)}
                />

                <MultiSelectInput
                    label="Söndürme ekipmanları"
                    values={facilityInfo.extinguishingEquipment}
                    options={['Otomatik söndürme', 'KKT Özellikli yangın tüpleri', 'CO² Özellikli yangın tüpleri']}
                    onToggle={(v: string) => toggleMultiSelect('extinguishingEquipment', v)}
                />

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Hidrantlar-Yangın dolapları</Text>
                    <TextInput
                        style={styles.input}
                        value={facilityInfo.hydrants}
                        onChangeText={(v) => setFacilityInfo(prev => ({ ...prev, hydrants: v }))}
                        placeholder="Hidrantlar-Yangın dolapları"
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>2.2. Tespit Edilen Bilgiler</Text>

                <SelectInput
                    label="Tesisatta Kapsamlı"
                    value={facilityInfo.installationComprehensive}
                    options={['Var', 'Yok', 'Belirlenemedi']}
                    onSelect={(v: any) => setFacilityInfo(prev => ({ ...prev, installationComprehensive: v }))}
                />

                <SelectInput
                    label="Bir önceki periyodik kontrol etiketi var mı?"
                    value={facilityInfo.prevControlLabel}
                    options={['Var', 'Yok']}
                    onSelect={(v: any) => setFacilityInfo(prev => ({ ...prev, prevControlLabel: v }))}
                />

                <SelectInput
                    label="Bina kullanım sınıfı"
                    value={facilityInfo.buildingClass}
                    options={['Konut', 'Toplanma amaçlı bina', 'Konaklama amaçlı bina', 'Depolama amaçlı tesis', 'Kurumsal bina', 'Yüksek tehlikeli bina', 'Karışık kullanım amaçlı bina', 'Endüstriyel yapı', 'Büro binası', 'Ticari']}
                    onSelect={(v: any) => setFacilityInfo(prev => ({ ...prev, buildingClass: v }))}
                />

                <SelectInput
                    label="Bina tehlike sınıfı"
                    value={facilityInfo.buildingDangerClass}
                    options={['Düşük tehlike', 'Orta tehlike', 'Yüksek tehlike']}
                    onSelect={(v: any) => setFacilityInfo(prev => ({ ...prev, buildingDangerClass: v }))}
                />

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Bina toplam kullanım alanı (m²)</Text>
                    <TextInput
                        style={styles.input}
                        value={facilityInfo.buildingArea}
                        onChangeText={(v) => setFacilityInfo(prev => ({ ...prev, buildingArea: v }))}
                        placeholder="Bina toplam kullanım alanı (m²)"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Kat sayısı</Text>
                    <TextInput
                        style={styles.input}
                        value={facilityInfo.floorCount}
                        onChangeText={(v) => setFacilityInfo(prev => ({ ...prev, floorCount: v }))}
                        placeholder="Kat sayısı"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                    />
                </View>

                <SelectInput
                    label="Tehlike kategorisi"
                    value={facilityInfo.dangerCategory}
                    options={['O1', 'O2', 'O3', 'O4']}
                    onSelect={(v: any) => setFacilityInfo(prev => ({ ...prev, dangerCategory: v }))}
                />

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Yapı kullanma izin tarihi</Text>
                    <TouchableOpacity
                        style={[styles.input, { justifyContent: 'center' }]}
                        onPress={() => openDatePicker('Yapı kullanma izin tarihi', facilityInfo.permitDate)}
                    >
                        <Text style={{ color: facilityInfo.permitDate ? theme.text : '#9CA3AF', fontSize: 14 }}>
                            {facilityInfo.permitDate || 'GG.AA.YYYY'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Bölüm sayısı</Text>
                    <TextInput
                        style={styles.input}
                        value={facilityInfo.sectionCount}
                        onChangeText={(v) => setFacilityInfo(prev => ({ ...prev, sectionCount: v }))}
                        placeholder="Bölüm sayısı"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Bina yüksekliği/Yapı yüksekliği (m)</Text>
                    <TextInput
                        style={styles.input}
                        value={facilityInfo.buildingHeight}
                        onChangeText={(v) => setFacilityInfo(prev => ({ ...prev, buildingHeight: v }))}
                        placeholder="Bina yüksekliği/Yapı yüksekliği (m)"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Varsa diğer tespitler</Text>
                    <TextInput
                        style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                        value={facilityInfo.otherFindings}
                        onChangeText={(v) => setFacilityInfo(prev => ({ ...prev, otherFindings: v }))}
                        placeholder="Varsa diğer tespitler"
                        placeholderTextColor="#9CA3AF"
                        multiline
                    />
                </View>
            </View>
            <View style={{ height: 100 }} />
        </View>
    );

    const renderVisualInspection = () => (
        <View>
            {VISUAL_INSPECTION_QUESTIONS.map((cat, idx) => (
                <View key={idx} style={styles.section}>
                    <Text style={styles.sectionTitle}>{cat.category}</Text>
                    {cat.questions.map((q) => {
                        // Varsayılan olarak "Uygun" seç
                        const currentValue = visualInspections[q.id] || 'Uygun';

                        return (
                            <View key={q.id} style={styles.questionContainer}>
                                <Text style={styles.questionText}>{q.text}</Text>
                                <View style={styles.optionsRow}>
                                    {EVALUATION_OPTIONS.map((opt) => {
                                        const isSelected = currentValue === opt;
                                        let btnColor = '#E5E7EB';
                                        let textColor = '#374151';
                                        if (isSelected) {
                                            if (opt === 'Uygun') { btnColor = '#059669'; textColor = '#FFF'; }
                                            else if (opt === 'Uygun Değil') { btnColor = '#DC2626'; textColor = '#FFF'; }
                                            else if (opt === 'Uygulanamaz') { btnColor = '#6B7280'; textColor = '#FFF'; }
                                            else { btnColor = '#D97706'; textColor = '#FFF'; } // Hafif Kusur
                                        }

                                        return (
                                            <TouchableOpacity
                                                key={opt}
                                                style={[styles.optionButton, { backgroundColor: btnColor }]}
                                                onPress={() => setVisualInspections((prev: any) => ({ ...prev, [q.id]: opt }))}
                                            >
                                                <Text style={[styles.optionButtonText, { color: textColor }]}>
                                                    {EVALUATION_SHORT[opt as keyof typeof EVALUATION_SHORT] || opt}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        );
                    })}
                </View>
            ))}
            <View style={{ height: 100 }} />
        </View>
    );

    const renderDeviceControls = () => (
        <View>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>5.2. Yangın Algılama ve Uyarı Cihazları Kontrolü ve Testler</Text>
                <Text style={styles.sectionSubtitle}>(Örnekleme yapılmadan tüm ekipmanlar)</Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollView} keyboardShouldPersistTaps="always">
                    <View>
                        <View style={styles.tableHeaderRow}>
                            <View style={[styles.tableHeaderCell, { width: 60 }]}>
                                <Text style={styles.tableHeaderText}>Kod</Text>
                            </View>
                            <View style={[styles.tableHeaderCell, { width: 120 }]}>
                                <Text style={styles.tableHeaderText}>Bölüm Adı</Text>
                            </View>
                            <View style={[styles.tableHeaderCell, { width: 100 }]}>
                                <Text style={styles.tableHeaderText}>Ekipman</Text>
                            </View>
                            <View style={[styles.tableHeaderCell, { width: 45 }]}>
                                <Text style={styles.tableHeaderText}>Prj</Text>
                            </View>
                            <View style={[styles.tableHeaderCell, { width: 45 }]}>
                                <Text style={styles.tableHeaderText}>Eriş</Text>
                            </View>
                            <View style={[styles.tableHeaderCell, { width: 45 }]}>
                                <Text style={styles.tableHeaderText}>Mntj</Text>
                            </View>
                            <View style={[styles.tableHeaderCell, { width: 45 }]}>
                                <Text style={styles.tableHeaderText}>Test</Text>
                            </View>
                            <View style={[styles.tableHeaderCell, { width: 45 }]}>
                                <Text style={styles.tableHeaderText}>Ses</Text>
                            </View>
                            <View style={[styles.tableHeaderCell, { width: 45 }]}>
                                <Text style={styles.tableHeaderText}>Işık</Text>
                            </View>
                            <View style={[styles.tableHeaderCell, { width: 45 }]}>
                                <Text style={styles.tableHeaderText}>Adrs</Text>
                            </View>
                            <View style={[styles.tableHeaderCell, { width: 50 }]}>
                                <Text style={styles.tableHeaderText}>Sil</Text>
                            </View>
                        </View>

                        {deviceControls.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.tableDataRow}
                                onPress={() => { setEditingDevice(item); setTempDevice(item); setModalVisible(true); }}
                            >
                                <View style={[styles.tableDataCell, { width: 60 }]}>
                                    <Text style={styles.tableCellText}>{item.code || '-'}</Text>
                                </View>
                                <View style={[styles.tableDataCell, { width: 120 }]}>
                                    <Text style={styles.tableCellText} numberOfLines={2}>{item.location || '-'}</Text>
                                </View>
                                <View style={[styles.tableDataCell, { width: 100 }]}>
                                    <Text style={styles.tableCellText} numberOfLines={2}>{item.equipment || '-'}</Text>
                                </View>
                                <View style={[styles.tableDataCell, { width: 45 }]}>
                                    <Text style={[styles.tableCellText, getEvalStyle(item.eval_project)]}>{EVALUATION_SHORT[item.eval_project as keyof typeof EVALUATION_SHORT] || '-'}</Text>
                                </View>
                                <View style={[styles.tableDataCell, { width: 45 }]}>
                                    <Text style={[styles.tableCellText, getEvalStyle(item.eval_access)]}>{EVALUATION_SHORT[item.eval_access as keyof typeof EVALUATION_SHORT] || '-'}</Text>
                                </View>
                                <View style={[styles.tableDataCell, { width: 45 }]}>
                                    <Text style={[styles.tableCellText, getEvalStyle(item.eval_mount)]}>{EVALUATION_SHORT[item.eval_mount as keyof typeof EVALUATION_SHORT] || '-'}</Text>
                                </View>
                                <View style={[styles.tableDataCell, { width: 45 }]}>
                                    <Text style={[styles.tableCellText, getEvalStyle(item.eval_test)]}>{EVALUATION_SHORT[item.eval_test as keyof typeof EVALUATION_SHORT] || '-'}</Text>
                                </View>
                                <View style={[styles.tableDataCell, { width: 45 }]}>
                                    <Text style={[styles.tableCellText, getEvalStyle(item.eval_sound)]}>{EVALUATION_SHORT[item.eval_sound as keyof typeof EVALUATION_SHORT] || '-'}</Text>
                                </View>
                                <View style={[styles.tableDataCell, { width: 45 }]}>
                                    <Text style={[styles.tableCellText, getEvalStyle(item.eval_light)]}>{EVALUATION_SHORT[item.eval_light as keyof typeof EVALUATION_SHORT] || '-'}</Text>
                                </View>
                                <View style={[styles.tableDataCell, { width: 45 }]}>
                                    <Text style={[styles.tableCellText, getEvalStyle(item.eval_address)]}>{EVALUATION_SHORT[item.eval_address as keyof typeof EVALUATION_SHORT] || '-'}</Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setDeviceControls((prev) => prev.filter((d) => d.id !== item.id))}
                                    style={[styles.tableDataCell, { width: 50, alignItems: 'center' }]}
                                >
                                    <Ionicons name="trash-outline" size={18} color="#DC2626" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))}

                        {deviceControls.length === 0 && (
                            <View style={styles.emptyTableRow}>
                                <Text style={styles.emptyTableText}>Henüz cihaz eklenmedi</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>

                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => {
                        setEditingDevice(null);
                        setTempDevice({
                            id: Date.now().toString(),
                            code: '',
                            location: '',
                            equipment: '',
                            eval_project: 'Uygun',
                            eval_access: 'Uygun',
                            eval_mount: 'Uygun',
                            eval_test: 'Uygun',
                            eval_sound: 'Uygun',
                            eval_light: 'Uygun',
                            eval_address: 'Uygun'
                        });
                        setModalVisible(true);
                    }}
                >
                    <Ionicons name="add-circle-outline" size={24} color="#059669" />
                    <Text style={styles.addButtonText}>Cihaz Ekle</Text>
                </TouchableOpacity>
            </View>
            <View style={{ height: 100 }} />
        </View>
    );

    const getEvalStyle = (evaluation: string) => {
        switch (evaluation) {
            case 'Uygun': return { color: '#059669', fontWeight: '600' as const };
            case 'Uygun Değil': return { color: '#DC2626', fontWeight: '600' as const };
            case 'Uygulanamaz': return { color: '#6B7280', fontWeight: '600' as const };
            case 'Hafif Kusur': return { color: '#D97706', fontWeight: '600' as const };
            default: return {};
        }
    };

    const renderPhotos = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Ekipman Fotoğrafları</Text>
            <Text style={styles.sectionSubtitle}>Maksimum 6 fotoğraf ekleyebilirsiniz</Text>

            <View style={styles.photosGrid}>
                {photos.map((photo) => (
                    <View key={photo.id} style={styles.photoContainer}>
                        <Image source={{ uri: photo.uri }} style={styles.photo} />
                        <TouchableOpacity
                            style={styles.deletePhotoButton}
                            onPress={() => setPhotos((prev: any) => prev.filter((p: any) => p.id !== photo.id))}
                        >
                            <Ionicons name="close-circle" size={24} color="#DC2626" />
                        </TouchableOpacity>
                    </View>
                ))}
                {photos.length < 6 && (
                    <>
                        <TouchableOpacity style={styles.addPhotoButton} onPress={handleTakePhoto}>
                            <Ionicons name="camera-outline" size={32} color="#9CA3AF" />
                            <Text style={styles.addPhotoText}>Fotoğraf Çek</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.addPhotoButton} onPress={handlePickPhoto}>
                            <Ionicons name="images-outline" size={32} color="#9CA3AF" />
                            <Text style={styles.addPhotoText}>Galeriden Seç</Text>
                        </TouchableOpacity>
                    </>
                )}
            </View>
        </View>
    );

    const renderDefects = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Kusur Açıklamaları</Text>
            <TextInput
                style={[styles.input, { height: 200, textAlignVertical: 'top' }]}
                value={defectDescription}
                onChangeText={setDefectDescription}
                placeholder="Tespit edilen kusurları ve açıklamalarını yazınız..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={10}
            />
        </View>
    );

    const renderNotes = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Notlar</Text>
            <TextInput
                style={[styles.input, { height: 200, textAlignVertical: 'top' }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Genel notlar ve görüşlerinizi yazınız..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={10}
            />
        </View>
    );

    const renderConclusion = () => {
        const resultOptions = [
            'Kullanıma Uygundur',
            'Kısmen Kullanıma Uygundur',
            'Kullanıma Uygun Değildir'
        ];

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>9. Sonuç Ve Kanaat</Text>
                <View style={styles.resultOptionContainer}>
                    {resultOptions.map((option, index) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.resultOption,
                                conclusion === option && styles.resultOptionSelected,
                                index === resultOptions.length - 1 && { borderBottomWidth: 0 }
                            ]}
                            onPress={() => setConclusion(option)}
                        >
                            <Text style={[
                                styles.resultOptionText,
                                conclusion === option && styles.resultOptionTextSelected
                            ]}>
                                {option}
                            </Text>
                            <View style={styles.checkmarkContainer}>
                                {conclusion === option && (
                                    <Ionicons name="checkmark" size={20} color="#059669" />
                                )}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    // --- Helper Functions for Navigation ---
    const getPreviousPage = (): typeof currentPage | null => {
        switch (currentPage) {
            case 'conclusion': return 'notes';
            case 'notes': return 'photos';
            case 'photos': return 'defects';
            case 'defects': return 'device-controls';
            case 'device-controls': return 'visual-inspection';
            case 'visual-inspection': return 'facility-info';
            default: return null;
        }
    };

    const getNextPage = (): typeof currentPage | null => {
        switch (currentPage) {
            case 'facility-info': return 'visual-inspection';
            case 'visual-inspection': return 'device-controls';
            case 'device-controls': return 'defects';
            case 'defects': return 'photos';
            case 'photos': return 'notes';
            case 'notes': return 'conclusion';
            default: return null;
        }
    };

    // --- Main Render ---

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#059669" />

            <ScrollView 
                style={styles.scrollView} 
                showsVerticalScrollIndicator={false} 
                keyboardShouldPersistTaps="always"
                onScrollBeginDrag={() => {
                    console.log('📜 [SCROLL DEBUG] onScrollBeginDrag');
                }}
                onScrollEndDrag={() => {
                    console.log('📜 [SCROLL DEBUG] onScrollEndDrag');
                }}
                onMomentumScrollBegin={() => {
                    console.log('📜 [SCROLL DEBUG] onMomentumScrollBegin');
                }}
                onMomentumScrollEnd={() => {
                    console.log('📜 [SCROLL DEBUG] onMomentumScrollEnd');
                }}
            >
                {currentPage === 'facility-info' && renderFacilityInfo()}
                {currentPage === 'visual-inspection' && renderVisualInspection()}
                {currentPage === 'device-controls' && renderDeviceControls()}
                {currentPage === 'defects' && renderDefects()}
                {currentPage === 'photos' && renderPhotos()}
                {currentPage === 'notes' && renderNotes()}
                {currentPage === 'conclusion' && renderConclusion()}

                {/* Navigation Buttons */}
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

            {/* Device Modal */}
            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{editingDevice ? 'Cihaz Düzenle' : 'Cihaz Ekle'}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalScrollView} keyboardShouldPersistTaps="always">
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Tanım / Kod</Text>
                                <TextInput
                                    style={styles.input}
                                    value={tempDevice.code}
                                    onChangeText={(v) => setTempDevice(prev => ({ ...prev, code: v }))}
                                    placeholder="Örn: D001"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Bölüm Adı / Tanımı</Text>
                                <TextInput
                                    style={styles.input}
                                    value={tempDevice.location}
                                    onChangeText={(v) => setTempDevice(prev => ({ ...prev, location: v }))}
                                    placeholder="Örn: Giriş Kat"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Ekipman Adı/Adedi</Text>
                                <TextInput
                                    style={styles.input}
                                    value={tempDevice.equipment}
                                    onChangeText={(v) => setTempDevice(prev => ({ ...prev, equipment: v }))}
                                    placeholder="Örn: Duman Dedektörü / 5 Adet"
                                    placeholderTextColor="#9CA3AF"
                                />
                            </View>

                            <Text style={styles.modalSectionLabel}>Değerlendirmeler</Text>
                            <Text style={styles.modalHint}>(U: Uygun, UD: Uygun Değil, UG: Uygulanamaz, HF: Hafif Kusur)</Text>

                            <View style={styles.evalItem}>
                                <Text style={styles.evalLabel}>Projede gösterilen yerde mi?</Text>
                                <View style={styles.evalOptionsRow}>
                                    {EVALUATION_OPTIONS.map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.evalOptionBtn, tempDevice.eval_project === opt && styles.evalOptionBtnActive]}
                                            onPress={() => setTempDevice(prev => ({ ...prev, eval_project: opt }))}
                                        >
                                            <Text style={[styles.evalOptionText, tempDevice.eval_project === opt && styles.evalOptionTextActive]}>
                                                {EVALUATION_SHORT[opt as keyof typeof EVALUATION_SHORT]}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.evalItem}>
                                <Text style={styles.evalLabel}>Erişim durumu</Text>
                                <View style={styles.evalOptionsRow}>
                                    {EVALUATION_OPTIONS.map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.evalOptionBtn, tempDevice.eval_access === opt && styles.evalOptionBtnActive]}
                                            onPress={() => setTempDevice(prev => ({ ...prev, eval_access: opt }))}
                                        >
                                            <Text style={[styles.evalOptionText, tempDevice.eval_access === opt && styles.evalOptionTextActive]}>
                                                {EVALUATION_SHORT[opt as keyof typeof EVALUATION_SHORT]}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.evalItem}>
                                <Text style={styles.evalLabel}>Montaj durumu</Text>
                                <View style={styles.evalOptionsRow}>
                                    {EVALUATION_OPTIONS.map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.evalOptionBtn, tempDevice.eval_mount === opt && styles.evalOptionBtnActive]}
                                            onPress={() => setTempDevice(prev => ({ ...prev, eval_mount: opt }))}
                                        >
                                            <Text style={[styles.evalOptionText, tempDevice.eval_mount === opt && styles.evalOptionTextActive]}>
                                                {EVALUATION_SHORT[opt as keyof typeof EVALUATION_SHORT]}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.evalItem}>
                                <Text style={styles.evalLabel}>Test</Text>
                                <View style={styles.evalOptionsRow}>
                                    {EVALUATION_OPTIONS.map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.evalOptionBtn, tempDevice.eval_test === opt && styles.evalOptionBtnActive]}
                                            onPress={() => setTempDevice(prev => ({ ...prev, eval_test: opt }))}
                                        >
                                            <Text style={[styles.evalOptionText, tempDevice.eval_test === opt && styles.evalOptionTextActive]}>
                                                {EVALUATION_SHORT[opt as keyof typeof EVALUATION_SHORT]}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.evalItem}>
                                <Text style={styles.evalLabel}>Sesli uyarı yeterli mi?</Text>
                                <View style={styles.evalOptionsRow}>
                                    {EVALUATION_OPTIONS.map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.evalOptionBtn, tempDevice.eval_sound === opt && styles.evalOptionBtnActive]}
                                            onPress={() => setTempDevice(prev => ({ ...prev, eval_sound: opt }))}
                                        >
                                            <Text style={[styles.evalOptionText, tempDevice.eval_sound === opt && styles.evalOptionTextActive]}>
                                                {EVALUATION_SHORT[opt as keyof typeof EVALUATION_SHORT]}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.evalItem}>
                                <Text style={styles.evalLabel}>Işıklı uyarı yeterli mi?</Text>
                                <View style={styles.evalOptionsRow}>
                                    {EVALUATION_OPTIONS.map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.evalOptionBtn, tempDevice.eval_light === opt && styles.evalOptionBtnActive]}
                                            onPress={() => setTempDevice(prev => ({ ...prev, eval_light: opt }))}
                                        >
                                            <Text style={[styles.evalOptionText, tempDevice.eval_light === opt && styles.evalOptionTextActive]}>
                                                {EVALUATION_SHORT[opt as keyof typeof EVALUATION_SHORT]}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.evalItem}>
                                <Text style={styles.evalLabel}>Adresleme doğru mu?</Text>
                                <View style={styles.evalOptionsRow}>
                                    {EVALUATION_OPTIONS.map((opt) => (
                                        <TouchableOpacity
                                            key={opt}
                                            style={[styles.evalOptionBtn, tempDevice.eval_address === opt && styles.evalOptionBtnActive]}
                                            onPress={() => setTempDevice(prev => ({ ...prev, eval_address: opt }))}
                                        >
                                            <Text style={[styles.evalOptionText, tempDevice.eval_address === opt && styles.evalOptionTextActive]}>
                                                {EVALUATION_SHORT[opt as keyof typeof EVALUATION_SHORT]}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        </ScrollView>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCancel}>
                                <Text style={styles.modalCancelText}>İptal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => {
                                if (editingDevice) {
                                    setDeviceControls((prev) => prev.map((d) => d.id === editingDevice.id ? { ...d, ...tempDevice } as DeviceControlItem : d));
                                } else {
                                    setDeviceControls((prev) => [...prev, { ...tempDevice, id: Date.now().toString() } as DeviceControlItem]);
                                }
                                setModalVisible(false);
                            }} style={styles.modalSave}>
                                <Text style={styles.modalSaveText}>Kaydet</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <CustomAlert visible={alertConfig.visible} title={alertConfig.title} message={alertConfig.message} type={alertConfig.type} onConfirm={alertConfig.onConfirm} />

            {/* Date Picker Modal */}
            <DatePicker
                modal
                open={datePickerVisible}
                date={selectedDate}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={() => setDatePickerVisible(false)}
                title="Tarih Seçin"
                confirmText="Tamam"
                cancelText="İptal"
            />
        </SafeAreaView>
    );
};

export default FireDetectionNavigatorScreen;
