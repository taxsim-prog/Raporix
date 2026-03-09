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
    Image,
    Platform,
    PermissionsAndroid,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { launchCamera, launchImageLibrary, MediaType, ImagePickerResponse, Asset } from 'react-native-image-picker';
import FormsApi from "../../api/forms";
import { useTheme } from "../../theme/ThemeContext";
import CustomAlert from "../../components/CustomAlert";

// Interfaces
interface GeneratorNavigatorScreenProps {
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
    | 'generator-info'
    | 'control-criteria'
    | 'result-section'
    | 'equipment-photos'
    | 'notes'
    | 'conclusion';

type EvaluationType = 'Uygun' | 'Uygun Değil' | 'Uygulanamaz' | 'Hafif Kusur' | '';
type YesNoType = 'Evet' | 'Hayır' | '';
type GeneratorType = 'Dahili' | 'Harici' | '';
type CabinType = 'Kabinli' | 'Kabinsiz' | '';
type VoltageOutputType = 'İzole' | 'Etkin Topraklı' | '';
type ResultType = 'Kullanıma Uygundur' | 'Kısmen Kullanıma Uygundur' | 'Kullanıma Uygun Değildir' | '';

interface GeneratorInfo {
    name: string;              // Jeneratör Adı
    brand: string;             // Markası
    origin: string;            // Menşei
    manufactureYear: string;   // İmal Yılı
    serialNumber: string;      // Seri No
    power: string;             // Gücü (kvA)
    type: GeneratorType;       // Tipi
    voltage: string;           // Gerilimi (V)
    cabinType: CabinType;      // Kabin Tipi
    fuelType: string;          // Yakıt Tipi
    voltageOutput: VoltageOutputType;  // Gerilim Çıkışı
    networkConnectionStatus: string;   // Şebeke Bağlantı Durumu
}

interface PhotoItem {
    uri: string;
    fileName?: string;
    type?: string;
}

const GeneratorNavigatorScreen: React.FC<GeneratorNavigatorScreenProps> = ({ navigation, route }) => {
    const { theme } = useTheme();

    // Current page state
    const [currentPage, setCurrentPage] = useState<PageType>('detected-info');
    const [saving, setSaving] = useState(false);
    const [existingFormId, setExistingFormId] = useState<number | null>(null);
    const [currentGeneratorIndex, setCurrentGeneratorIndex] = useState(0);

    // Alert state
    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{
        title: string;
        message: string;
        type: 'success' | 'error' | 'warning' | 'info';
        onConfirm?: () => void;
    }>({ title: '', message: '', type: 'info' });

    // 2.2 Tespit Edilen Bilgiler
    const [totalGeneratorCount, setTotalGeneratorCount] = useState<string>('1');

    // Jeneratör Bilgileri (dinamik liste)
    const [generators, setGenerators] = useState<GeneratorInfo[]>([{
        name: '',
        brand: '',
        origin: '',
        manufactureYear: '',
        serialNumber: '',
        power: '',
        type: '',
        voltage: '',
        cabinType: '',
        fuelType: '',
        voltageOutput: '',
        networkConnectionStatus: '',
    }]);

    // 5.1 Dahili Tip Jeneratör Denetim Cevapları - Varsayılan Uygun
    const [dahiliAnswers, setDahiliAnswers] = useState<Record<string, EvaluationType>>({
        'd1': 'Uygun',
        'd2': 'Uygun',
        'd3': 'Uygun',
        'd4': 'Uygun',
        'd5': 'Uygun',
        'd6': 'Uygun',
        'd7': 'Uygun',
        'd8': 'Uygun',
        'd9': 'Uygun',
        'd10': 'Uygun',
        'd11': 'Uygun',
        'd12': 'Uygun',
        'd13': 'Uygun',
        'd14': 'Uygun',
    });
    const [dahiliGroundingValue, setDahiliGroundingValue] = useState('');

    // 5.2 Harici Tip Jeneratör Denetim Cevapları - Varsayılan Uygun
    const [hasTankProtectionRelay, setHasTankProtectionRelay] = useState<YesNoType>('');
    const [hariciAnswers, setHariciAnswers] = useState<Record<string, EvaluationType>>({
        'h1_1': 'Uygun',
        'h1_2': 'Uygun',
        'h2': 'Uygun',
        'h3': 'Uygun',
        'h4': 'Uygun',
    });
    const [hariciGroundingValue, setHariciGroundingValue] = useState('');

    // 5.3 Sonuç
    const [observationsAndRecommendations, setObservationsAndRecommendations] = useState('');
    const [finalResult, setFinalResult] = useState<ResultType>('');

    // 6. Ekipman Fotoğrafları
    const [equipmentPhotos, setEquipmentPhotos] = useState<PhotoItem[]>([]);

    // 7. Notlar
    const [generalNotes, setGeneralNotes] = useState('');

    // 8. Sonuç Ve Kanaat
    const [conclusion, setConclusion] = useState('');

    // Evaluation options
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

    // Jeneratör sayısı değiştiğinde jeneratör listesini güncelle
    useEffect(() => {
        const count = parseInt(totalGeneratorCount) || 1;
        if (count > generators.length) {
            const newGenerators = [...generators];
            for (let i = generators.length; i < count; i++) {
                newGenerators.push({
                    name: '',
                    brand: '',
                    origin: '',
                    manufactureYear: '',
                    serialNumber: '',
                    power: '',
                    type: '',
                    voltage: '',
                    cabinType: '',
                    fuelType: '',
                    voltageOutput: '',
                    networkConnectionStatus: '',
                });
            }
            setGenerators(newGenerators);
        } else if (count < generators.length && count >= 1) {
            setGenerators(generators.slice(0, count));
            if (currentGeneratorIndex >= count) {
                setCurrentGeneratorIndex(count - 1);
            }
        }
    }, [totalGeneratorCount]);

    // Load existing data
    useEffect(() => {
        const loadExistingData = async () => {
            if (route?.params?.reportData) {
                const data = route.params.reportData;
                if (data.totalGeneratorCount) setTotalGeneratorCount(data.totalGeneratorCount);
                if (data.generators) setGenerators(data.generators);
                if (data.dahiliAnswers) setDahiliAnswers(data.dahiliAnswers);
                if (data.dahiliGroundingValue) setDahiliGroundingValue(data.dahiliGroundingValue);
                if (data.hasTankProtectionRelay) setHasTankProtectionRelay(data.hasTankProtectionRelay);
                if (data.hariciAnswers) setHariciAnswers(data.hariciAnswers);
                if (data.hariciGroundingValue) setHariciGroundingValue(data.hariciGroundingValue);
                if (data.observationsAndRecommendations) setObservationsAndRecommendations(data.observationsAndRecommendations);
                if (data.finalResult) setFinalResult(data.finalResult);
                if (data.equipmentPhotos) setEquipmentPhotos(data.equipmentPhotos);
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
                form_name: 'generator',
                work_order_id: route?.params?.workOrderId,
                data: {
                    totalGeneratorCount,
                    generators,
                    dahiliAnswers,
                    dahiliGroundingValue,
                    hasTankProtectionRelay,
                    hariciAnswers,
                    hariciGroundingValue,
                    observationsAndRecommendations,
                    finalResult,
                    equipmentPhotos,
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
                message: 'Jeneratör raporu başarıyla kaydedildi.',
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
        totalGeneratorCount,
        generators,
        dahiliAnswers,
        dahiliGroundingValue,
        hasTankProtectionRelay,
        hariciAnswers,
        hariciGroundingValue,
        observationsAndRecommendations,
        finalResult,
        equipmentPhotos,
        generalNotes,
        conclusion,
        existingFormId,
        navigation,
    ]);

    // Update generator info
    const updateGeneratorInfo = useCallback((index: number, field: keyof GeneratorInfo, value: string) => {
        setGenerators(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    }, []);

    // Update dahili answer
    const updateDahiliAnswer = useCallback((key: string, value: EvaluationType) => {
        setDahiliAnswers(prev => ({ ...prev, [key]: value }));
    }, []);

    // Update harici answer
    const updateHariciAnswer = useCallback((key: string, value: EvaluationType) => {
        setHariciAnswers(prev => ({ ...prev, [key]: value }));
    }, []);

    // Get current generator type
    const getCurrentGeneratorType = () => generators[currentGeneratorIndex]?.type || '';

    // Photo handling
    const requestCameraPermission = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: "Kamera İzni",
                        message: "Fotoğraf çekmek için kamera izni gerekiyor",
                        buttonNeutral: "Daha Sonra Sor",
                        buttonNegative: "İptal",
                        buttonPositive: "Tamam"
                    }
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    };

    const handleTakePhoto = async () => {
        if (equipmentPhotos.length >= 6) {
            setAlertConfig({
                title: 'Uyarı',
                message: 'En fazla 6 fotoğraf ekleyebilirsiniz.',
                type: 'warning',
            });
            setAlertVisible(true);
            return;
        }

        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
            setAlertConfig({
                title: 'İzin Gerekli',
                message: 'Fotoğraf çekmek için kamera izni vermeniz gerekiyor.',
                type: 'warning',
            });
            setAlertVisible(true);
            return;
        }

        const options = {
            mediaType: 'photo' as MediaType,
            quality: 0.8 as const,
            saveToPhotos: true,
        };

        launchCamera(options, (response: ImagePickerResponse) => {
            if (response.didCancel) {
                console.log('User cancelled camera');
            } else if (response.errorCode) {
                console.log('Camera Error:', response.errorMessage);
            } else if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                if (asset.uri) {
                    const newPhoto: PhotoItem = {
                        uri: asset.uri,
                        fileName: asset.fileName,
                        type: asset.type,
                    };
                    setEquipmentPhotos(prev => [...prev, newPhoto]);
                }
            }
        });
    };

    const handlePickPhoto = async () => {
        if (equipmentPhotos.length >= 6) {
            setAlertConfig({
                title: 'Uyarı',
                message: 'En fazla 6 fotoğraf ekleyebilirsiniz.',
                type: 'warning',
            });
            setAlertVisible(true);
            return;
        }

        const options = {
            mediaType: 'photo' as MediaType,
            quality: 0.8 as const,
        };

        launchImageLibrary(options, (response: ImagePickerResponse) => {
            if (response.didCancel) {
                console.log('User cancelled gallery');
            } else if (response.errorCode) {
                console.log('Gallery Error:', response.errorMessage);
            } else if (response.assets && response.assets.length > 0) {
                const asset = response.assets[0];
                if (asset.uri) {
                    const newPhoto: PhotoItem = {
                        uri: asset.uri,
                        fileName: asset.fileName,
                        type: asset.type,
                    };
                    setEquipmentPhotos(prev => [...prev, newPhoto]);
                }
            }
        });
    };

    const removePhoto = (index: number) => {
        setEquipmentPhotos(prev => prev.filter((_, i) => i !== index));
    };

    // Header setup
    useLayoutEffect(() => {
        if (navigation?.setOptions) {
            let headerTitle = '';
            switch (currentPage) {
                case 'detected-info':
                    headerTitle = '2.2 Tespit Edilen Bilgiler';
                    break;
                case 'generator-info':
                    headerTitle = `5. Jeneratör ${currentGeneratorIndex + 1} Bilgileri`;
                    break;
                case 'control-criteria':
                    headerTitle = getCurrentGeneratorType() === 'Dahili'
                        ? '5.1 Dahili Tip Denetimler'
                        : '5.2 Harici Tip Denetimler';
                    break;
                case 'result-section':
                    headerTitle = '5.3 Sonuç';
                    break;
                case 'equipment-photos':
                    headerTitle = '6. Ekipman Fotoğrafları';
                    break;
                case 'notes':
                    headerTitle = '7. Notlar';
                    break;
                case 'conclusion':
                    headerTitle = '8. Sonuç Ve Kanaat';
                    break;
                default:
                    headerTitle = '2.2 Tespit Edilen Bilgiler';
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
    }, [navigation, currentPage, handleSave, saving, currentGeneratorIndex]);

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
            color: '#EF4444',
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
        // Evaluation Options (Tek satır)
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
        // Yes/No buttons (Dropdown tarzı)
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
            backgroundColor: '#ECFDF5',
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
        // Option buttons (Dropdown tarzı)
        optionContainer: {
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: theme.border,
            borderRadius: 8,
            overflow: 'hidden',
        },
        optionButton: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        optionButtonSelected: {
            backgroundColor: '#ECFDF5',
        },
        optionButtonText: {
            fontSize: 14,
            color: theme.text,
        },
        optionButtonTextSelected: {
            fontWeight: '600',
            color: '#059669',
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
        // Generator selector
        generatorSelector: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 16,
        },
        generatorTab: {
            paddingVertical: 8,
            paddingHorizontal: 16,
            borderRadius: 20,
            borderWidth: 2,
        },
        generatorTabActive: {
            backgroundColor: '#ECFDF5',
            borderColor: '#059669',
        },
        generatorTabInactive: {
            backgroundColor: theme.surface,
            borderColor: theme.border,
        },
        generatorTabText: {
            fontSize: 12,
            fontWeight: '600',
        },
        // Photo grid
        photoGrid: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 12,
        },
        photoItem: {
            width: '47%',
            aspectRatio: 1,
            borderRadius: 12,
            overflow: 'hidden',
            position: 'relative',
        },
        photoImage: {
            width: '100%',
            height: '100%',
        },
        removePhotoButton: {
            position: 'absolute',
            top: 8,
            right: 8,
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderRadius: 12,
            padding: 4,
        },
        addPhotoButton: {
            width: '47%',
            aspectRatio: 1,
            borderRadius: 12,
            borderWidth: 2,
            borderStyle: 'dashed',
            borderColor: theme.border,
            justifyContent: 'center',
            alignItems: 'center',
        },
        addPhotoText: {
            fontSize: 12,
            color: theme.textSecondary,
            marginTop: 8,
        },
        photoButtonsRow: {
            flexDirection: 'row',
            gap: 12,
            marginTop: 16,
        },
        photoActionButton: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 12,
            borderRadius: 8,
            gap: 8,
        },
        // Result options
        resultOption: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: theme.border,
        },
        resultOptionSelected: {
            backgroundColor: '#ECFDF5',
        },
        resultOptionText: {
            fontSize: 14,
            color: theme.text,
            flex: 1,
        },
        resultOptionTextSelected: {
            fontWeight: '600',
            color: '#059669',
        },
    });

    // Dahili Tip Sorular
    const dahiliQuestions = [
        { key: 'd1', text: 'Jeneratör odasının kapısı kilitlenebiliyor mu? Yetkililerden başka kimsenin girmemesi şeklinde uyarı levhası ve tehlike işaretleri var mı?' },
        { key: 'd2', text: 'Jeneratör odasının kapısı, tavanı, tabanı ve duvarları yangına en az 120 dakika dayanabilecek cinsten mi?' },
        { key: 'd3', text: 'Transfer panosu veya dağıtım panosu önünde izolasyon halısı var mı?' },
        { key: 'd4', text: 'Eşpotansiyel bara var mı, tüm metal aksam irtibatlandırılmış mı?' },
        { key: 'd5', text: 'Jeneratörün egzoz gideri dış ortama uygun bir şekilde verilmiş mi?' },
        { key: 'd6', text: 'Jeneratörü soğutmak için yapılan dış hava giriş düzeneği uygun mu?' },
        { key: 'd7', text: 'Transfer panosunda kullanılan şalt teçhizatı, jeneratör gücüne uygun seçilmiş mi?' },
        { key: 'd8', text: 'Transfer panosunda elektrikî kilitleme yapılmış mı?' },
        { key: 'd9', text: 'Transfer panosunda mekanik kilitleme yapılmış mı?' },
        { key: 'd10', text: 'Jeneratör odasına yangın duman dedektörü ve acil aydınlatma tesis edilmiş mi?' },
        { key: 'd11', text: 'Jeneratör bloğu koruma topraklama sistemine irtibatlandırılmış mı?' },
        { key: 'd12', text: 'Jeneratör devresinde artık akım korumasına yönelik tedbir alınmış mıdır?' },
        { key: 'd13', text: 'Jeneratör devreye girdiğinde kompanzasyon sistemine yönelik tedbir alınmış mıdır?' },
        { key: 'd14', text: 'Bağlantı şemaları mevcut mudur?' },
    ];

    // Harici Tip Sorular
    const hariciQuestions = {
        mainQuestion: 'Tank koruma rölesi var mı?',
        noQuestions: [
            { key: 'h1_1', text: 'Jeneratörün yanına yetkililerden başka kimsenin girmemesine yönelik önlem alınmış mıdır? (Kilitlenebilir bir kapısı var mıdır? Bu konuda uyarı levhası ve tehlike işaretleri var mıdır?)' },
        ],
        yesQuestions: [
            { key: 'h1_2', text: 'Jeneratörün yanına girilmemesi için yapılan engel, jeneratör veya ilgili panolara ulaşma mesafesinde ise bu engeller yalıtılmış mıdır?' },
        ],
        commonQuestions: [
            { key: 'h2', text: 'Transfer panosunda kullanılan şalt teçhizatı uygun olarak seçilmiş midir?' },
            { key: 'h3', text: 'Transfer panosunda elektrikî kilitleme yapılmış mı?' },
            { key: 'h4', text: 'Transfer panosunda mekanik kilitleme yapılmış mı?' },
        ],
    };

    // Render Evaluation Question
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

    // Render Yes/No question (Dropdown style)
    const renderYesNoQuestion = (
        question: string,
        value: YesNoType,
        setValue: (val: YesNoType) => void
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
                            {value === option && <Ionicons name="checkmark" size={14} color="#EF4444" />}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    // Render dropdown options
    const renderOptionDropdown = (
        label: string,
        value: string,
        options: string[],
        setValue: (val: string) => void
    ) => (
        <View style={styles.questionContainer}>
            <Text style={styles.questionText}>{label}</Text>
            <View style={styles.optionContainer}>
                {options.map((option, index) => (
                    <TouchableOpacity
                        key={option}
                        style={[
                            styles.optionButton,
                            value === option && styles.optionButtonSelected,
                            index === options.length - 1 && { borderBottomWidth: 0 },
                        ]}
                        onPress={() => setValue(option)}
                    >
                        <Text
                            style={[
                                styles.optionButtonText,
                                value === option && styles.optionButtonTextSelected,
                            ]}
                        >
                            {option}
                        </Text>
                        <View style={styles.checkmarkContainer}>
                            {value === option && <Ionicons name="checkmark" size={14} color="#EF4444" />}
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    // Render detected info page (2.2)
    const renderDetectedInfoPage = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>2.2 Tespit Edilen Bilgiler</Text>

            <View style={styles.questionContainer}>
                <Text style={styles.questionText}>Tesiste kurulu ve faal olan toplam jeneratör sayısı?</Text>
                <TextInput
                    style={styles.textInput}
                    value={totalGeneratorCount}
                    onChangeText={setTotalGeneratorCount}
                    placeholder="Jeneratör sayısını giriniz..."
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                />
            </View>
        </View>
    );

    // Render generator info page
    const renderGeneratorInfoPage = () => {
        const count = parseInt(totalGeneratorCount) || 1;
        const gen = generators[currentGeneratorIndex] || {};

        return (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Jeneratör Bilgileri</Text>

                {/* Jeneratör seçici */}
                {count > 1 && (
                    <View style={styles.generatorSelector}>
                        {Array.from({ length: count }).map((_, i) => (
                            <TouchableOpacity
                                key={i}
                                style={[
                                    styles.generatorTab,
                                    currentGeneratorIndex === i ? styles.generatorTabActive : styles.generatorTabInactive,
                                ]}
                                onPress={() => setCurrentGeneratorIndex(i)}
                            >
                                <Text style={[
                                    styles.generatorTabText,
                                    { color: currentGeneratorIndex === i ? '#EF4444' : theme.textSecondary }
                                ]}>
                                    Jeneratör {i + 1}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>Jeneratör Adı</Text>
                    <TextInput
                        style={styles.textInput}
                        value={gen.name}
                        onChangeText={(val) => updateGeneratorInfo(currentGeneratorIndex, 'name', val)}
                        placeholder="Jeneratör adını giriniz..."
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>Markası</Text>
                    <TextInput
                        style={styles.textInput}
                        value={gen.brand}
                        onChangeText={(val) => updateGeneratorInfo(currentGeneratorIndex, 'brand', val)}
                        placeholder="Marka..."
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>Menşei</Text>
                    <TextInput
                        style={styles.textInput}
                        value={gen.origin}
                        onChangeText={(val) => updateGeneratorInfo(currentGeneratorIndex, 'origin', val)}
                        placeholder="Menşei..."
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>İmal Yılı</Text>
                    <TextInput
                        style={styles.textInput}
                        value={gen.manufactureYear}
                        onChangeText={(val) => updateGeneratorInfo(currentGeneratorIndex, 'manufactureYear', val)}
                        placeholder="YYYY"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>Seri No</Text>
                    <TextInput
                        style={styles.textInput}
                        value={gen.serialNumber}
                        onChangeText={(val) => updateGeneratorInfo(currentGeneratorIndex, 'serialNumber', val)}
                        placeholder="Seri numarası..."
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>Gücü (kVA)</Text>
                    <TextInput
                        style={styles.textInput}
                        value={gen.power}
                        onChangeText={(val) => updateGeneratorInfo(currentGeneratorIndex, 'power', val)}
                        placeholder="Güç değeri..."
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                    />
                </View>

                {renderOptionDropdown(
                    'Tipi',
                    gen.type,
                    ['Dahili', 'Harici'],
                    (val) => updateGeneratorInfo(currentGeneratorIndex, 'type', val as GeneratorType)
                )}

                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>Gerilimi (V)</Text>
                    <TextInput
                        style={styles.textInput}
                        value={gen.voltage}
                        onChangeText={(val) => updateGeneratorInfo(currentGeneratorIndex, 'voltage', val)}
                        placeholder="Gerilim değeri..."
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                    />
                </View>

                {renderOptionDropdown(
                    'Kabin Tipi',
                    gen.cabinType,
                    ['Kabinli', 'Kabinsiz'],
                    (val) => updateGeneratorInfo(currentGeneratorIndex, 'cabinType', val as CabinType)
                )}

                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>Yakıt Tipi</Text>
                    <TextInput
                        style={styles.textInput}
                        value={gen.fuelType}
                        onChangeText={(val) => updateGeneratorInfo(currentGeneratorIndex, 'fuelType', val)}
                        placeholder="Yakıt tipi..."
                        placeholderTextColor="#9CA3AF"
                    />
                </View>

                {renderOptionDropdown(
                    'Gerilim Çıkışı',
                    gen.voltageOutput,
                    ['İzole', 'Etkin Topraklı'],
                    (val) => updateGeneratorInfo(currentGeneratorIndex, 'voltageOutput', val as VoltageOutputType)
                )}

                <View style={styles.questionContainer}>
                    <Text style={styles.questionText}>Şebeke Bağlantı Durumu</Text>
                    <TextInput
                        style={styles.textInput}
                        value={gen.networkConnectionStatus}
                        onChangeText={(val) => updateGeneratorInfo(currentGeneratorIndex, 'networkConnectionStatus', val)}
                        placeholder="Şebeke bağlantı durumu..."
                        placeholderTextColor="#9CA3AF"
                    />
                </View>
            </View>
        );
    };

    // Render control criteria page
    const renderControlCriteriaPage = () => {
        const genType = getCurrentGeneratorType();

        if (genType === 'Dahili') {
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5.1 Dahili Tip Jeneratör Denetimleri</Text>

                    {dahiliQuestions.map((q) => renderEvaluationQuestion(
                        q.text,
                        dahiliAnswers[q.key],
                        (val) => updateDahiliAnswer(q.key, val)
                    ))}

                    <View style={styles.questionContainer}>
                        <Text style={styles.questionText}>Topraklama Değeri (Ω)</Text>
                        <TextInput
                            style={styles.resistanceInput}
                            value={dahiliGroundingValue}
                            onChangeText={setDahiliGroundingValue}
                            placeholder="Ölçüm değeri (Ω)"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                        />
                    </View>
                </View>
            );
        } else {
            // Harici Tip
            return (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>5.2 Harici Tip Jeneratör Denetimleri</Text>

                    {renderYesNoQuestion(
                        hariciQuestions.mainQuestion,
                        hasTankProtectionRelay,
                        setHasTankProtectionRelay
                    )}

                    {hasTankProtectionRelay === 'Hayır' && (
                        <>
                            <Text style={styles.subsectionTitle}>1.1</Text>
                            {hariciQuestions.noQuestions.map((q) => renderEvaluationQuestion(
                                q.text,
                                hariciAnswers[q.key],
                                (val) => updateHariciAnswer(q.key, val)
                            ))}
                        </>
                    )}

                    {hasTankProtectionRelay === 'Evet' && (
                        <>
                            <Text style={styles.subsectionTitle}>1.2</Text>
                            {hariciQuestions.yesQuestions.map((q) => renderEvaluationQuestion(
                                q.text,
                                hariciAnswers[q.key],
                                (val) => updateHariciAnswer(q.key, val)
                            ))}
                        </>
                    )}

                    {hariciQuestions.commonQuestions.map((q) => renderEvaluationQuestion(
                        q.text,
                        hariciAnswers[q.key],
                        (val) => updateHariciAnswer(q.key, val)
                    ))}

                    <View style={styles.questionContainer}>
                        <Text style={styles.questionText}>Topraklama Değeri (Ω)</Text>
                        <TextInput
                            style={styles.resistanceInput}
                            value={hariciGroundingValue}
                            onChangeText={setHariciGroundingValue}
                            placeholder="Ölçüm değeri (Ω)"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="numeric"
                        />
                    </View>
                </View>
            );
        }
    };

    // Render result section
    const renderResultSectionPage = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>5.3 Sonuç</Text>

            <View style={styles.questionContainer}>
                <Text style={styles.questionText}>Jeneratör Gruplarına İlişkin Gözlemler Ve Öneriler</Text>
                <TextInput
                    style={styles.textArea}
                    value={observationsAndRecommendations}
                    onChangeText={setObservationsAndRecommendations}
                    placeholder="Gözlemler ve önerilerinizi buraya yazınız..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                />
            </View>

            <View style={styles.questionContainer}>
                <Text style={styles.questionText}>Sonuç</Text>
                <View style={styles.optionContainer}>
                    {(['Kullanıma Uygundur', 'Kısmen Kullanıma Uygundur', 'Kullanıma Uygun Değildir'] as ResultType[]).map((option, index) => (
                        <TouchableOpacity
                            key={option}
                            style={[
                                styles.resultOption,
                                finalResult === option && styles.resultOptionSelected,
                                index === 2 && { borderBottomWidth: 0 },
                            ]}
                            onPress={() => setFinalResult(option)}
                        >
                            <Text
                                style={[
                                    styles.resultOptionText,
                                    finalResult === option && styles.resultOptionTextSelected,
                                ]}
                            >
                                {option}
                            </Text>
                            <View style={styles.checkmarkContainer}>
                                {finalResult === option && <Ionicons name="checkmark" size={14} color="#EF4444" />}
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        </View>
    );

    // Render equipment photos page
    const renderEquipmentPhotosPage = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Ekipman Fotoğrafları</Text>
            <Text style={[styles.questionText, { marginBottom: 16 }]}>
                Maksimum 6 fotoğraf ekleyebilirsiniz. ({equipmentPhotos.length}/6)
            </Text>

            <View style={styles.photoGrid}>
                {equipmentPhotos.map((photo, index) => (
                    <View key={index} style={styles.photoItem}>
                        <Image source={{ uri: photo.uri }} style={styles.photoImage} />
                        <TouchableOpacity
                            style={styles.removePhotoButton}
                            onPress={() => removePhoto(index)}
                        >
                            <Ionicons name="close" size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>
                ))}

                {equipmentPhotos.length < 6 && (
                    <TouchableOpacity style={styles.addPhotoButton} onPress={handleTakePhoto}>
                        <Ionicons name="camera" size={32} color={theme.textSecondary} />
                        <Text style={styles.addPhotoText}>Fotoğraf Ekle</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.photoButtonsRow}>
                <TouchableOpacity
                    style={[styles.photoActionButton, { backgroundColor: '#059669' }]}
                    onPress={handleTakePhoto}
                >
                    <Ionicons name="camera" size={20} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>Fotoğraf Çek</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.photoActionButton, { backgroundColor: theme.border }]}
                    onPress={handlePickPhoto}
                >
                    <Ionicons name="image" size={20} color={theme.text} />
                    <Text style={{ color: theme.text, fontWeight: '600' }}>Galeriden Seç</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    // Render notes page
    const renderNotesPage = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>7. Notlar</Text>
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

    // Render conclusion page
    const renderConclusionPage = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>8. Sonuç Ve Kanaat</Text>
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

    // Navigation helper
    const getNextPage = (): PageType | null => {
        switch (currentPage) {
            case 'detected-info':
                return 'generator-info';
            case 'generator-info':
                return 'control-criteria';
            case 'control-criteria':
                return 'result-section';
            case 'result-section':
                return 'equipment-photos';
            case 'equipment-photos':
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
            case 'generator-info':
                return 'detected-info';
            case 'control-criteria':
                return 'generator-info';
            case 'result-section':
                return 'control-criteria';
            case 'equipment-photos':
                return 'result-section';
            case 'notes':
                return 'equipment-photos';
            case 'conclusion':
                return 'notes';
            default:
                return null;
        }
    };

    // Check if can proceed
    const canProceedToNext = (): boolean => {
        if (currentPage === 'generator-info') {
            const gen = generators[currentGeneratorIndex];
            if (!gen?.type) return false;
        }
        return true;
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#059669" />

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {currentPage === 'detected-info' && renderDetectedInfoPage()}
                {currentPage === 'generator-info' && renderGeneratorInfoPage()}
                {currentPage === 'control-criteria' && renderControlCriteriaPage()}
                {currentPage === 'result-section' && renderResultSectionPage()}
                {currentPage === 'equipment-photos' && renderEquipmentPhotosPage()}
                {currentPage === 'notes' && renderNotesPage()}
                {currentPage === 'conclusion' && renderConclusionPage()}

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
                            style={[
                                styles.navButton,
                                styles.navButtonNext,
                                !canProceedToNext() && { opacity: 0.5 }
                            ]}
                            onPress={() => {
                                if (!canProceedToNext()) {
                                    setAlertConfig({
                                        title: 'Uyarı',
                                        message: 'Devam etmek için jeneratör tipini seçmelisiniz.',
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

export default GeneratorNavigatorScreen;
