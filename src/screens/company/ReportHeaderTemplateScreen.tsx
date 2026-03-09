import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { NavigationProp, useFocusEffect } from "@react-navigation/native";
import { launchImageLibrary, ImagePickerResponse } from "react-native-image-picker";

import ReportHeaderTemplateApi, { ReportHeaderTemplateOut } from "../../api/reportHeaderTemplate";
import CompaniesApi from "../../api/companies";
import CustomAlert from "../../components/CustomAlert";
import { useTheme } from "../../theme/ThemeContext";
import { SafeAreaView } from "react-native-safe-area-context";

type AlertType = "success" | "error" | "warning" | "info";

type AlertConfig = {
  title: string;
  message: string;
  type: AlertType;
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
};

// API Base URL for image display
const API_BASE_URL = "http://192.168.1.108:8000";

const ReportHeaderTemplateScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const { theme } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [companyId, setCompanyId] = useState<number | null>(null);
  
  const [template, setTemplate] = useState<ReportHeaderTemplateOut | null>(null);
  const [qrCodeData, setQrCodeData] = useState("");
  const [addressInfo, setAddressInfo] = useState("");
  
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (config: AlertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  const handleAlertConfirm = () => {
    setAlertVisible(false);
    alertConfig.onConfirm?.();
  };

  const handleAlertCancel = () => {
    setAlertVisible(false);
    alertConfig.onCancel?.();
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Önce şirket bilgisini al
      const companies = await CompaniesApi.list({ limit: 1 });
      if (!companies || companies.length === 0) {
        showAlert({
          title: "Hata",
          message: "Şirket bilgisi bulunamadı.",
          type: "error",
        });
        navigation.goBack();
        return;
      }
      
      const cId = parseInt(companies[0].id);
      setCompanyId(cId);
      
      // Template'i yükle
      const templateData = await ReportHeaderTemplateApi.get(cId);
      setTemplate(templateData);
      setQrCodeData(templateData.qr_code_data || "");
      setAddressInfo(templateData.address_info || "");
      
    } catch (error: any) {
      console.error("Load error:", error);
      showAlert({
        title: "Hata",
        message: error.message || "Veriler yüklenemedi.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSave = async () => {
    if (!companyId) return;
    
    setSaving(true);
    try {
      const updatedTemplate = await ReportHeaderTemplateApi.save(companyId, {
        qr_code_data: qrCodeData,
        address_info: addressInfo,
      });
      
      setTemplate(updatedTemplate);
      
      showAlert({
        title: "Başarılı",
        message: "Rapor başlık taslağı kaydedildi.",
        type: "success",
      });
    } catch (error: any) {
      console.error("Save error:", error);
      showAlert({
        title: "Hata",
        message: error.message || "Kaydetme başarısız.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const result: ImagePickerResponse = await launchImageLibrary({
        mediaType: "photo",
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        showAlert({
          title: "Hata",
          message: result.errorMessage || "Resim seçilemedi.",
          type: "error",
        });
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        showAlert({
          title: "Hata",
          message: "Resim seçilemedi.",
          type: "error",
        });
        return;
      }

      // Upload the image
      await uploadLogo(asset.uri, asset.fileName || "logo.jpg", asset.type || "image/jpeg");
      
    } catch (error: any) {
      console.error("Image picker error:", error);
      showAlert({
        title: "Hata",
        message: error.message || "Resim seçilemedi.",
        type: "error",
      });
    }
  };

  const uploadLogo = async (uri: string, name: string, type: string) => {
    if (!companyId) return;
    
    setUploading(true);
    try {
      const response = await ReportHeaderTemplateApi.uploadLogo(companyId, {
        uri,
        name,
        type,
      });
      
      // Template'i güncelle
      setTemplate(prev => prev ? { ...prev, logo_path: response.logo_path } : null);
      
      showAlert({
        title: "Başarılı",
        message: "Logo yüklendi.",
        type: "success",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      showAlert({
        title: "Hata",
        message: error.message || "Logo yüklenemedi.",
        type: "error",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = () => {
    showAlert({
      title: "Logo Sil",
      message: "Logoyu silmek istediğinizden emin misiniz?",
      type: "warning",
      showCancel: true,
      confirmText: "Sil",
      cancelText: "İptal",
      onConfirm: async () => {
        if (!companyId) return;
        
        try {
          await ReportHeaderTemplateApi.deleteLogo(companyId);
          setTemplate(prev => prev ? { ...prev, logo_path: null } : null);
          
          showAlert({
            title: "Başarılı",
            message: "Logo silindi.",
            type: "success",
          });
        } catch (error: any) {
          console.error("Delete logo error:", error);
          showAlert({
            title: "Hata",
            message: error.message || "Logo silinemedi.",
            type: "error",
          });
        }
      },
    });
  };

  const getLogoUri = () => {
    if (!template?.logo_path) return null;
    // Eğer path zaten http ile başlıyorsa olduğu gibi kullan
    if (template.logo_path.startsWith("http")) {
      return template.logo_path;
    }
    // Değilse API base URL'e ekle
    return `${API_BASE_URL}${template.logo_path}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Rapor Başlık Taslağı</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Logo Bölümü */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Şirket Logosu</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Raporların başlığında görünecek şirket logonuzu yükleyin.
          </Text>
          
          <View style={styles.logoContainer}>
            {template?.logo_path ? (
              <View style={styles.logoPreviewContainer}>
                <Image 
                  source={{ uri: getLogoUri() || undefined }} 
                  style={styles.logoPreview}
                  resizeMode="contain"
                />
                <TouchableOpacity 
                  style={[styles.deleteLogoButton, { backgroundColor: theme.error }]}
                  onPress={handleDeleteLogo}
                >
                  <Ionicons name="trash-outline" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.logoPlaceholder, { borderColor: theme.border }]}>
                <Ionicons name="image-outline" size={48} color={theme.textTertiary} />
                <Text style={[styles.logoPlaceholderText, { color: theme.textTertiary }]}>
                  Logo yüklenmedi
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={[styles.uploadButton, { backgroundColor: theme.primary }]}
              onPress={handlePickImage}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
                  <Text style={styles.uploadButtonText}>
                    {template?.logo_path ? "Logo Değiştir" : "Logo Yükle"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* QR Kod Bölümü */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>QR Kod Verisi</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            QR kod içinde gösterilecek veriyi girin. Bu veri ile otomatik olarak QR kod oluşturulacaktır.
          </Text>
          
          <TextInput
            style={[styles.textInput, styles.multilineInput, { 
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: theme.border,
            }]}
            value={qrCodeData}
            onChangeText={setQrCodeData}
            placeholder="Örn: https://sirketiniz.com veya şirket bilgileri..."
            placeholderTextColor={theme.textTertiary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <View style={styles.qrPreviewInfo}>
            <Ionicons name="qr-code-outline" size={24} color={theme.primary} />
            <Text style={[styles.qrPreviewText, { color: theme.textSecondary }]}>
              QR kod, PDF oluşturulurken bu veriden otomatik oluşturulacaktır.
            </Text>
          </View>
        </View>

        {/* Adres Bilgileri Bölümü */}
        <View style={[styles.section, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Adres Bilgileri</Text>
          <Text style={[styles.sectionDescription, { color: theme.textSecondary }]}>
            Rapor başlığında görünecek şirket adres bilgilerini girin.
          </Text>
          
          <TextInput
            style={[styles.textInput, styles.multilineInput, { 
              backgroundColor: theme.inputBackground,
              color: theme.text,
              borderColor: theme.border,
            }]}
            value={addressInfo}
            onChangeText={setAddressInfo}
            placeholder="Şirket adres bilgilerini girin...&#10;Örn:&#10;ABC Mühendislik Ltd. Şti.&#10;Örnek Mah. Test Sok. No:1&#10;Kadıköy / İstanbul&#10;Tel: 0216 123 45 67"
            placeholderTextColor={theme.textTertiary}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* Kaydet Butonu */}
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#FFF" />
              <Text style={styles.saveButtonText}>Kaydet</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        onConfirm={handleAlertConfirm}
        onCancel={handleAlertCancel}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  logoContainer: {
    alignItems: "center",
  },
  logoPreviewContainer: {
    position: "relative",
    marginBottom: 16,
  },
  logoPreview: {
    width: 200,
    height: 100,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  deleteLogoButton: {
    position: "absolute",
    top: -8,
    right: -8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  logoPlaceholder: {
    width: 200,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  logoPlaceholderText: {
    marginTop: 8,
    fontSize: 12,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  multilineInput: {
    minHeight: 100,
  },
  qrPreviewInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    padding: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 8,
  },
  qrPreviewText: {
    flex: 1,
    fontSize: 12,
    marginLeft: 12,
    lineHeight: 18,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default ReportHeaderTemplateScreen;
