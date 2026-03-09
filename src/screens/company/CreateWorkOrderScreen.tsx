"use client"

import { useState, useEffect, useCallback } from "react"
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useFocusEffect } from "@react-navigation/native"
import Ionicons from "react-native-vector-icons/Ionicons"
import * as DocumentPicker from '@react-native-documents/picker'
import { useTheme } from "../../theme/ThemeContext"
import CustomAlert from "../../components/CustomAlert"
import CompaniesApi, { CompanyEmployee } from "../../api/companies"
import WorkOrdersApi from "../../api/workOrders"
import { WorkOrderOut } from "../../api/workOrders"
import StorageService from "../../utils/StorageService"

interface CreateWorkOrderScreenProps {
  navigation: any
}

const CreateWorkOrderScreen = ({ navigation }: CreateWorkOrderScreenProps) => {
  const { theme } = useTheme();

  const [formData, setFormData] = useState({
    contractId: '',
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    authorizedPerson: '',
    taxNumber: '',
    taxOffice: '',
    sgkSicilNo: '',
    inspectionAddresses: [''],
    assignedEmployeeId: '',
    assignedEmployeeName: '',
  });

  // Ölçüm tipleri ve seçim durumları
  const [measurementSelections, setMeasurementSelections] = useState<Record<string, { selected: boolean; count: string }>>({
    'Gözle Kontrol': { selected: false, count: '' },
    'Topraklama': { selected: false, count: '' },
    'Yıldırımdan Korunma Tesisatı': { selected: false, count: '' },
    'Jeneratör': { selected: false, count: '' },
    'Yangın Algılama': { selected: false, count: '' },
  });

  const [selectedPDF, setSelectedPDF] = useState<{
    uri: string;
    name: string;
    type: string;
  } | null>(null);

  const [employees, setEmployees] = useState<CompanyEmployee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showEmployeePicker, setShowEmployeePicker] = useState(false);
  const [companyId, setCompanyId] = useState<number | null>(null);

  // Kayıtlı firmalar modal state
  const [showSavedCompanies, setShowSavedCompanies] = useState(false);
  const [savedCompanies, setSavedCompanies] = useState<WorkOrderOut[]>([]);
  const [loadingSavedCompanies, setLoadingSavedCompanies] = useState(false);

  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  const handleAlertConfirm = () => {
    setAlertVisible(false);
    alertConfig.onConfirm?.();
  };

  // Kayıtlı firmaları yükle
  const loadSavedCompanies = async () => {
    setLoadingSavedCompanies(true);
    try {
      const workOrders = await WorkOrdersApi.list({ limit: 100, sort_by: 'created_at', sort_dir: 'desc' });
      
      // Benzersiz firmaları filtrele (customer_company_title'a göre)
      const uniqueCompanies = workOrders.reduce((acc: WorkOrderOut[], current) => {
        const exists = acc.find(item => item.customer_company_title === current.customer_company_title);
        if (!exists && current.customer_company_title) {
          acc.push(current);
        }
        return acc;
      }, []);
      
      setSavedCompanies(uniqueCompanies);
    } catch (error) {
      console.error('[CreateWorkOrderScreen] Kayıtlı firmalar yüklenemedi:', error);
      showAlert({
        title: 'Hata',
        message: 'Kayıtlı firmalar yüklenirken bir hata oluştu.',
        type: 'error',
      });
    } finally {
      setLoadingSavedCompanies(false);
    }
  };

  // Kayıtlı firma seç ve formu doldur
  const selectSavedCompany = (workOrder: WorkOrderOut) => {
    setFormData(prev => ({
      ...prev,
      contractId: workOrder.isg_katip_id || '',
      companyName: workOrder.customer_company_title || '',
      companyAddress: workOrder.customer_company_address || '',
      companyPhone: workOrder.customer_company_phone || '',
      authorizedPerson: workOrder.customer_authorized_person || '',
      taxNumber: workOrder.tax_number || '',
      taxOffice: workOrder.tax_office || '',
      sgkSicilNo: workOrder.sgk_sicil_no || '',
      inspectionAddresses: workOrder.customer_periodic_control_address 
        ? workOrder.customer_periodic_control_address.split(' | ').filter((addr: string) => addr.trim() !== '')
        : [''],
    }));
    setShowSavedCompanies(false);
    
    showAlert({
      title: 'Başarılı',
      message: 'Firma bilgileri otomatik olarak dolduruldu.',
      type: 'success',
    });
  };

  useFocusEffect(
    useCallback(() => {
      const loadEmployees = async () => {
        setLoadingEmployees(true);
        try {
          console.log('[CreateWorkOrderScreen] Çalışanlar yükleniyor...');

          // Şirket ID'sini al
          const companies = await CompaniesApi.list({ q: '', limit: 1, offset: 0 });
          if (!companies || companies.length === 0) {
            throw new Error('Şirket bilgisi bulunamadı');
          }

          const fetchedCompanyId = parseInt(companies[0].id);
          setCompanyId(fetchedCompanyId);

          // Şirketin çalışanlarını getir (yönetici dahil tüm kullanıcılar)
          const response = await CompaniesApi.getEmployees(fetchedCompanyId);

          setEmployees(response.employees);
          console.log('[CreateWorkOrderScreen] Çalışanlar yüklendi:', response.employees.length);
        } catch (error: any) {
          console.error('[CreateWorkOrderScreen] Çalışan yükleme hatası:', error);
        } finally {
          setLoadingEmployees(false);
        }
      };
      loadEmployees();
    }, [])
  );

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addInspectionAddress = () => {
    showAlert({
      title: 'Uyarı',
      message: 'En fazla 1 adres girebilirsiniz!',
      type: 'warning',
      onConfirm: () => {
        setAlertVisible(false);
      },
    });
    return;
  };

  const removeInspectionAddress = (index: number) => {
    if (formData.inspectionAddresses.length > 1) {
      setFormData(prev => ({
        ...prev,
        inspectionAddresses: prev.inspectionAddresses.filter((_, i) => i !== index)
      }));
    }
  };

  const updateInspectionAddress = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      inspectionAddresses: prev.inspectionAddresses.map((addr, i) => i === index ? value : addr)
    }));
  };

  // Ölçüm tipleri listesi ve ikonları
  const measurementTypes = [
    { name: 'Gözle Kontrol', icon: 'eye-outline' },
    { name: 'Topraklama', icon: 'flash-outline' },
    { name: 'Yıldırımdan Korunma Tesisatı', icon: 'thunderstorm-outline' },
    { name: 'Jeneratör', icon: 'hardware-chip-outline' },
    { name: 'Yangın Algılama', icon: 'flame-outline' },
  ];

  const toggleMeasurementSelection = (typeName: string) => {
    setMeasurementSelections(prev => ({
      ...prev,
      [typeName]: {
        ...prev[typeName],
        selected: !prev[typeName].selected,
        count: !prev[typeName].selected ? prev[typeName].count : '', // Seçim kaldırılınca count'u sıfırla
      },
    }));
  };

  const updateMeasurementCount = (typeName: string, count: string) => {
    setMeasurementSelections(prev => ({
      ...prev,
      [typeName]: {
        ...prev[typeName],
        count,
      },
    }));
  };

  const selectEmployee = (employee: CompanyEmployee) => {
    setFormData(prev => ({
      ...prev,
      assignedEmployeeId: employee.id,
      assignedEmployeeName: employee.full_name || employee.email,
    }));
    setShowEmployeePicker(false);
  };

  const selectPDF = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.pdf],
        allowMultiSelection: false,
      });

      if (result && result.length > 0) {
        const file = result[0];
        setSelectedPDF({
          uri: file.uri,
          name: file.name || 'document.pdf',
          type: file.type || 'application/pdf',
        });
      }
    } catch (error: any) {
      console.log("Error:", error)
      // User cancelled the picker - this is not an error
      if (error?.message === 'User canceled document picker') {
        return;
      }
      showAlert({
        title: 'Hata',
        message: 'Dosya seçilirken bir hata oluştu.',
        type: 'error',
      });
    }
  };

  const handleSubmit = async () => {
    // Validasyon
    if (!formData.contractId || !formData.companyName || !formData.companyAddress ||
      !formData.companyPhone || !formData.authorizedPerson || !formData.taxNumber ||
      !formData.taxOffice || !formData.assignedEmployeeId) {
      showAlert({
        title: 'Uyarı',
        message: 'Lütfen tüm zorunlu alanları doldurun.',
        type: 'warning',
      });
      return;
    }

    // Ölçüm bilgisi kontrolü - seçili ve geçerli adetli olanları al
    const selectedMeasurements = Object.entries(measurementSelections)
      .filter(([_, value]) => value.selected && value.count.trim() !== '')
      .map(([typeName, value]) => ({
        task_name: typeName,
        quantity: parseInt(value.count) || 0,
      }));

    if (selectedMeasurements.length === 0) {
      showAlert({
        title: 'Uyarı',
        message: 'En az bir ölçüm tipi seçip adet girmelisiniz.',
        type: 'warning',
      });
      return;
    }

    // Adet kontrolü
    const hasInvalidQuantity = selectedMeasurements.some(m => m.quantity <= 0);
    if (hasInvalidQuantity) {
      showAlert({
        title: 'Uyarı',
        message: 'Seçilen ölçüm tiplerinin adet sayısı 0\'dan büyük olmalıdır.',
        type: 'warning',
      });
      return;
    }

    // Adres kontrolü
    const validAddresses = formData.inspectionAddresses.filter(addr => addr.trim() !== '');
    if (validAddresses.length === 0) {
      showAlert({
        title: 'Uyarı',
        message: 'En az bir periyodik kontrol adresi girmelisiniz.',
        type: 'warning',
      });
      return;
    }

    // Company ID kontrolü
    if (!companyId) {
      showAlert({
        title: 'Hata',
        message: 'Şirket bilgisi bulunamadı. Lütfen sayfayı yenileyin.',
        type: 'error',
      });
      return;
    }

    setLoading(true);
    try {
      // Backend API yapısına göre request oluştur
      const workOrderRequest = {
        title: `${formData.companyName}`,
        description: `İSG Katip ID: ${formData.contractId}`,
        status: 'pending' as const,
        company_id: companyId,
        assigned_to: formData.assignedEmployeeId,
        isg_katip_id: formData.contractId,
        customer_company_title: formData.companyName,
        customer_company_address: formData.companyAddress,
        customer_company_phone: formData.companyPhone,
        customer_authorized_person: formData.authorizedPerson,
        customer_periodic_control_address: validAddresses.join(' | '),
        tax_number: formData.taxNumber,
        tax_office: formData.taxOffice,
        sgk_sicil_no: formData.sgkSicilNo || undefined,
        tasks: selectedMeasurements,
      };

      console.log('[CreateWorkOrderScreen] İş emri oluşturuluyor:', workOrderRequest);

      const result = await WorkOrdersApi.create(workOrderRequest);
      console.log('[CreateWorkOrderScreen] İş emri oluşturuldu:', result);

      // PDF yükleme varsa yükle
      if (selectedPDF) {
        try {
          const pdfFile = {
            uri: selectedPDF.uri,
            type: selectedPDF.type,
            name: selectedPDF.name,
          } as any;

          await WorkOrdersApi.uploadServiceContract(result.id, pdfFile);
          console.log('[CreateWorkOrderScreen] PDF yüklendi');
        } catch (pdfError: any) {
          console.error('[CreateWorkOrderScreen] PDF yükleme hatası:', pdfError);
          // PDF yükleme hatası iş emri oluşturulmasını engellemez
        }
      }

      showAlert({
        title: 'Başarılı',
        message: 'İş emri başarıyla oluşturuldu.',
        type: 'success',
        onConfirm: () => navigation.goBack(),
      });
    } catch (error: any) {
      console.error('[CreateWorkOrderScreen] Hata:', error);
      showAlert({
        title: 'Hata',
        message: error?.message || 'İş emri oluşturulurken bir hata oluştu.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={theme.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>İş Emri Oluştur</Text>
        <TouchableOpacity 
          style={styles.savedCompaniesButton} 
          onPress={() => {
            setShowSavedCompanies(true);
            loadSavedCompanies();
          }}
        >
          <Ionicons name="business-outline" size={20} color={theme.headerText} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
          <Ionicons name="information-circle" size={20} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>
            Tüm zorunlu alanları (*) doldurunuz.
          </Text>
        </View>

        {/* Firma Bilgileri */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Firma Bilgileri</Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>İSG Katip Sözleşme ID *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
              value={formData.contractId}
              onChangeText={(value) => updateFormData('contractId', value)}
              placeholder="Örn: ISG-2024-001"
              placeholderTextColor={theme.inputPlaceholder}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Firma Ünvanı *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
              value={formData.companyName}
              onChangeText={(value) => updateFormData('companyName', value)}
              placeholder="Firma adı"
              placeholderTextColor={theme.inputPlaceholder}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Firma Merkez Adresi *</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
              value={formData.companyAddress}
              onChangeText={(value) => updateFormData('companyAddress', value)}
              placeholder="Tam adres"
              placeholderTextColor={theme.inputPlaceholder}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Firma Telefonu *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
              value={formData.companyPhone}
              onChangeText={(value) => updateFormData('companyPhone', value)}
              placeholder="Örn: +90 555 555 55 55"
              placeholderTextColor={theme.inputPlaceholder}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Firma Yetkili Kişi Adı Soyadı *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
              value={formData.authorizedPerson}
              onChangeText={(value) => updateFormData('authorizedPerson', value)}
              placeholder="Ad Soyad"
              placeholderTextColor={theme.inputPlaceholder}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Vergi Numarası *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
              value={formData.taxNumber}
              onChangeText={(value) => updateFormData('taxNumber', value)}
              placeholder="10 haneli vergi numarası"
              placeholderTextColor={theme.inputPlaceholder}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Vergi Dairesi *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
              value={formData.taxOffice}
              onChangeText={(value) => updateFormData('taxOffice', value)}
              placeholder="Vergi dairesi adı"
              placeholderTextColor={theme.inputPlaceholder}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Firma SGK Sicil No</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
              value={formData.sgkSicilNo}
              onChangeText={(value) => updateFormData('sgkSicilNo', value)}
              placeholder="SGK sicil numarası"
              placeholderTextColor={theme.inputPlaceholder}
            />
          </View>
        </View>

        {/* Periyodik Kontrol Adresleri */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Periyodik Kontrol Adresleri</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={addInspectionAddress}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Adres Ekle</Text>
            </TouchableOpacity>
          </View>

          {formData.inspectionAddresses.map((address, index) => (
            <View key={index} style={styles.addressContainer}>
              <View style={styles.addressHeader}>
                <Text style={[styles.label, { color: theme.text }]}>Adres {index + 1} *</Text>
                {formData.inspectionAddresses.length > 1 && (
                  <TouchableOpacity onPress={() => removeInspectionAddress(index)}>
                    <Ionicons name="trash-outline" size={18} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={address}
                onChangeText={(value) => updateInspectionAddress(index, value)}
                placeholder="Kontrol yapılacak adres"
                placeholderTextColor={theme.inputPlaceholder}
                multiline
                numberOfLines={2}
              />
            </View>
          ))}
        </View>

        {/* Ölçüm Bilgisi */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Ölçüm Tipleri *</Text>
          <Text style={[styles.helperText, { color: theme.textSecondary, marginBottom: 12 }]}>
            Yapılacak kontrol tiplerini seçin ve her biri için adet girin.
          </Text>

          {measurementTypes.map((measurementType) => {
            const selection = measurementSelections[measurementType.name];
            return (
              <View
                key={measurementType.name}
                style={[
                  styles.measurementTypeCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: selection.selected ? theme.primary : theme.border,
                    borderWidth: selection.selected ? 2 : 1,
                  }
                ]}
              >
                <TouchableOpacity
                  style={styles.measurementTypeRow}
                  onPress={() => toggleMeasurementSelection(measurementType.name)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.checkbox,
                    { borderColor: selection.selected ? theme.primary : theme.border },
                    selection.selected && { backgroundColor: theme.primary }
                  ]}>
                    {selection.selected && (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Ionicons
                    name={measurementType.icon}
                    size={22}
                    color={selection.selected ? theme.primary : theme.textSecondary}
                    style={{ marginRight: 10 }}
                  />
                  <Text style={[
                    styles.measurementTypeName,
                    { color: selection.selected ? theme.text : theme.textSecondary }
                  ]}>
                    {measurementType.name}
                  </Text>
                </TouchableOpacity>

                {selection.selected && (
                  <View style={styles.measurementCountRow}>
                    <Text style={[styles.label, { color: theme.text, marginBottom: 0 }]}>Adet:</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.countInputSmall,
                        {
                          backgroundColor: theme.inputBackground,
                          borderColor: theme.inputBorder,
                          color: theme.inputText
                        }
                      ]}
                      value={selection.count}
                      onChangeText={(value) => updateMeasurementCount(measurementType.name, value)}
                      placeholder="0"
                      placeholderTextColor={theme.inputPlaceholder}
                      keyboardType="numeric"
                    />
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Atama */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Atama</Text>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>İşi Yapacak Çalışan *</Text>
            <TouchableOpacity
              style={[styles.input, styles.pickerButton, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder }]}
              onPress={() => setShowEmployeePicker(true)}
            >
              <Text style={[styles.pickerButtonText, { color: formData.assignedEmployeeName ? theme.text : theme.inputPlaceholder }]}>
                {formData.assignedEmployeeName || 'Çalışan seçiniz'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hizmet Sözleşmesi */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Hizmet Sözleşmesi</Text>
          
          <TouchableOpacity
            style={[styles.pdfUploadButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={selectPDF}
          >
            <Ionicons name="document-outline" size={24} color={theme.primary} />
            <View style={styles.pdfUploadContent}>
              <Text style={[styles.pdfUploadTitle, { color: theme.text }]}>
                {selectedPDF ? selectedPDF.name : 'PDF Yükle'}
              </Text>
              <Text style={[styles.pdfUploadSubtitle, { color: theme.textSecondary }]}>
                {selectedPDF ? 'Değiştirmek için tıklayın' : 'Hizmet sözleşmesi PDF dosyası seçin'}
              </Text>
            </View>
            <Ionicons name="cloud-upload-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: theme.primary }, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>İş Emri Oluştur</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={handleAlertConfirm}
        onCancel={() => setAlertVisible(false)}
      />

      {/* Saved Companies Modal (Bottom Sheet) */}
      <Modal
        visible={showSavedCompanies}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSavedCompanies(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => setShowSavedCompanies(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
              <View style={styles.modalHandle} />
              <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Kayıtlı Firmalar</Text>
                <TouchableOpacity onPress={() => setShowSavedCompanies(false)}>
                  <Ionicons name="close" size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {loadingSavedCompanies ? (
                  <View style={styles.modalLoading}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.modalLoadingText, { color: theme.textSecondary }]}>Firmalar yükleniyor...</Text>
                  </View>
                ) : savedCompanies.length === 0 ? (
                  <View style={styles.modalEmpty}>
                    <Ionicons name="business-outline" size={40} color={theme.textTertiary} />
                    <Text style={[styles.modalEmptyText, { color: theme.textSecondary }]}>Kayıtlı firma bulunamadı</Text>
                    <Text style={[styles.modalEmptySubtext, { color: theme.textTertiary }]}>
                      İlk iş emrinizi oluşturun
                    </Text>
                  </View>
                ) : (
                  savedCompanies.map((workOrder) => (
                    <TouchableOpacity
                      key={workOrder.id}
                      style={[styles.companyItem, { borderBottomColor: theme.border, backgroundColor: theme.card }]}
                      onPress={() => selectSavedCompany(workOrder)}
                    >
                      <View style={[styles.companyIcon, { backgroundColor: theme.primary }]}>
                        <Ionicons name="business" size={20} color="#FFFFFF" />
                      </View>
                      <View style={styles.companyDetails}>
                        <Text style={[styles.companyName, { color: theme.text }]}>
                          {workOrder.customer_company_title}
                        </Text>
                        {workOrder.customer_authorized_person && (
                          <Text style={[styles.companyPerson, { color: theme.textSecondary }]}>
                            <Ionicons name="person-outline" size={12} color={theme.textSecondary} /> {workOrder.customer_authorized_person}
                          </Text>
                        )}
                        {workOrder.customer_company_phone && (
                          <Text style={[styles.companyPhone, { color: theme.textTertiary }]}>
                            <Ionicons name="call-outline" size={12} color={theme.textTertiary} /> {workOrder.customer_company_phone}
                          </Text>
                        )}
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Employee Picker Modal */}
      <Modal
        visible={showEmployeePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmployeePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Çalışan Seçin</Text>
              <TouchableOpacity onPress={() => setShowEmployeePicker(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {loadingEmployees ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <Text style={[styles.modalLoadingText, { color: theme.textSecondary }]}>Çalışanlar yükleniyor...</Text>
                </View>
              ) : employees.length === 0 ? (
                <View style={styles.modalEmpty}>
                  <Ionicons name="people-outline" size={40} color={theme.textTertiary} />
                  <Text style={[styles.modalEmptyText, { color: theme.textSecondary }]}>Çalışan bulunamadı</Text>
                </View>
              ) : (
                employees.map((employee) => (
                  <TouchableOpacity
                    key={employee.id}
                    style={[styles.employeeItem, { borderBottomColor: theme.border }]}
                    onPress={() => selectEmployee(employee)}
                  >
                    <View style={[styles.employeeAvatar, { backgroundColor: theme.primary }]}>
                      <Text style={styles.employeeAvatarText}>
                        {(employee.full_name || employee.email)
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.employeeDetails}>
                      <Text style={[styles.employeeName, { color: theme.text }]}>
                        {employee.full_name || employee.email}
                      </Text>
                      <Text style={[styles.employeeRole, { color: theme.textSecondary }]}>
                        {employee.role === 'admin' ? 'Yönetici' : 'Çalışan'}
                      </Text>
                      {employee.department && (
                        <Text style={[styles.employeeDepartment, { color: theme.textTertiary }]}>
                          {employee.department}
                        </Text>
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
  },
  savedCompaniesButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  addressContainer: {
    marginBottom: 16,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  measurementContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  measurementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  measurementRow: {
    gap: 12,
  },
  measurementTypeContainer: {
    marginBottom: 12,
  },
  typeButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  measurementCountContainer: {
    flex: 1,
  },
  countInput: {
    minWidth: 80,
  },
  measurementTypeCard: {
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  measurementTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  measurementTypeName: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  measurementCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    gap: 12,
  },
  countInputSmall: {
    width: 80,
    textAlign: 'center',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 14,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '100%',
    paddingBottom: 0,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalBody: {
    paddingBottom: 20,
  },
  modalLoading: {
    padding: 40,
    alignItems: 'center',
  },
  modalLoadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  modalEmpty: {
    padding: 40,
    alignItems: 'center',
  },
  modalEmptyText: {
    marginTop: 12,
    fontSize: 14,
  },
  modalEmptySubtext: {
    marginTop: 4,
    fontSize: 12,
  },
  companyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    borderBottomWidth: 1,
  },
  companyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  companyDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  companyPerson: {
    fontSize: 13,
    marginBottom: 2,
  },
  companyPhone: {
    fontSize: 12,
  },
  employeeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  employeeAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  employeeAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  employeeRole: {
    fontSize: 12,
    marginBottom: 2,
  },
  employeeDepartment: {
    fontSize: 11,
  },
  pdfUploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
  },
  pdfUploadContent: {
    flex: 1,
    marginLeft: 12,
  },
  pdfUploadTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  pdfUploadSubtitle: {
    fontSize: 12,
  },
});

export default CreateWorkOrderScreen;
