import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { NavigationProp, useFocusEffect } from "@react-navigation/native";

import CompaniesApi, { CompanyOut } from "../api/companies";
import CustomAlert from "../components/CustomAlert";
import { useTheme } from "../theme/ThemeContext";
import StorageService from "../utils/StorageService";
import AuthApi from "../api/auth";

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

const CompanyScreen = ({ navigation }: { navigation: NavigationProp<any> }) => {
  const { theme } = useTheme();
  const [companyInfo, setCompanyInfo] = useState<CompanyOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    title: "",
    message: "",
    type: "info",
  });

  const [userEmail, setUserEmail] = useState<string | null>(null);

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

  const loadCompanyData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("[CompanyScreen] Şirket bilgileri yükleniyor...");
      const list = await CompaniesApi.list({
        q: "",
        limit: 1,
        offset: 0,
      });
      console.log("[CompanyScreen] Şirket bilgileri başarıyla yüklendi:", list);
      setCompanyInfo(list[0] || null);

      if (!list || list.length === 0) {
        console.warn("[CompanyScreen] Şirket bulunamadı");
      }
    } catch (e: any) {
      console.error("[CompanyScreen] Şirket bilgileri yüklenirken hata:", e);

      let errorMessage = "Şirket bilgileri yüklenemedi.";

      if (e?.message) {
        if (e.message.includes("zaman aşımı") || e.message.includes("timeout")) {
          errorMessage = "İstek zaman aşımına uğradı. Lütfen tekrar deneyin.";
        } else if (e.message.includes("bağlanılamadı") || e.message.includes("network")) {
          errorMessage = "Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.";
        } else if (e.message.includes("401") || e.message.includes("Unauthorized")) {
          errorMessage = "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.";
        } else if (e.message.includes("Kullanıcı e-postası")) {
          errorMessage = "Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.";
        } else {
          errorMessage = e.message;
        }
      }

      setError(errorMessage);
      showAlert({
        title: "Hata",
        message: errorMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
      console.log("[CompanyScreen] Yükleme işlemi tamamlandı");
    }
  }, []);

  const loadUserEmail = useCallback(async () => {
    try {
      const emailFromStorage = await StorageService.getItem<string>("userEmail");
      const currentUser = await StorageService.getItem<{ email?: string }>("currentUser");

      const email = emailFromStorage || currentUser?.email || null;

      console.log("[CompanyScreen] Storage'tan email bulundu:", email);
      setUserEmail(email);
    } catch (e) {
      console.log("[CompanyScreen] Kullanıcı email yüklenirken hata:", e);
      setUserEmail(null);
    }
  }, []);

  // Ekran her odaklandığında (focus) şirket ve kullanıcı email bilgilerini yeniden yükle
  useFocusEffect(
    useCallback(() => {
      console.log("[CompanyScreen] Ekran odaklandı, veriler yeniden yükleniyor...");
      loadCompanyData();
      loadUserEmail();
    }, [loadCompanyData, loadUserEmail])
  );

  const handleCompanyInfoPress = async () => {
    try {
      if (!userEmail) {
        showAlert({
          title: "Hata",
          message: "Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.",
          type: "error",
        });
        return;
      }

      // 1) Verification durumu sor
      const status = await AuthApi.checkMailVerification(userEmail);
      const verified = status.is_email_verified;

      if (!verified) {
        // 2) Mail gönder
        try {
          await AuthApi.sendMailVerification(userEmail);
        } catch (e) {
          console.log("[CompanyScreen] Doğrulama maili gönderilemedi:", e);
        }

        // 3) Verification ekranına yönlendir
        navigation.navigate("EmailVerification", { email: userEmail });
        return;
      }

      // 👍 doğrulanmışsa normal geçiş
      navigation.navigate("CompanyInfo");
    } catch (e) {
      console.error("[CompanyScreen] Mail verification kontrolü hata:", e);
      showAlert({
        title: "Hata",
        message: "E-posta doğrulama kontrolü yapılamadı.",
        type: "error",
      });
    }
  };

  const menuItems = [
    { id: 1, title: "Çalışanlar", icon: "people-outline", screen: "Employees" },
    { id: 2, title: "İş Emirleri", icon: "clipboard-outline", screen: "WorkOrders" },
    { id: 3, title: "Raporlar", icon: "document-text-outline", screen: "CompanyReports" },
    { id: 4, title: "Ekipmanlar", icon: "construct-outline", screen: "Equipment" },
    { id: 5, title: "Yetki Belgeleri", icon: "shield-checkmark-outline", screen: "Certificates" },
    { id: 6, title: "Rapor Başlık Taslağı", icon: "newspaper-outline", screen: "ReportHeaderTemplate" },
  ];

  const handleMenuPress = (screen: string) => {
    if (!companyInfo) {
      showAlert({
        title: "Uyarı",
        message: "Lütfen önce şirket bilgilerini girin.",
        type: "warning",
      });
      return;
    }
    console.log(`[CompanyScreen] Menü seçildi: ${screen}`);
    navigation.navigate(screen);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Uyarı Banner - Şirket bilgisi yoksa */}
        {!companyInfo && !loading && (
          <View
            style={[
              styles.warningBanner,
              { backgroundColor: "#FEF3C7", borderColor: "#F59E0B" },
            ]}
          >
            <View style={styles.warningContent}>
              <Ionicons name="warning" size={24} color="#F59E0B" />
              <View style={styles.warningTextContainer}>
                <Text style={[styles.warningTitle, { color: "#92400E" }]}>
                  Şirket Bilgileri Eksik
                </Text>
                <Text style={[styles.warningText, { color: "#92400E" }]}>
                  Henüz şirket bilgilerini girmediniz. Özellikleri kullanabilmek için şirket
                  bilgilerini girmeniz gerekmektedir.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.warningButton, { backgroundColor: "#F59E0B" }]}
              onPress={handleCompanyInfoPress}
            >
              <Text style={styles.warningButtonText}>Şirket Bilgilerini Gir</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* Şirket Bilgi Kartı */}
        {companyInfo && (
          <View style={[styles.companyCard, { backgroundColor: theme.primary }]}>
            <View style={styles.companyHeader}>
              <View style={styles.companyIcon}>
                <Ionicons name="business" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.companyDetails}>
                <Text style={styles.companyName}>{companyInfo?.name || "-"}</Text>
                <Text style={styles.companyAddress}>{companyInfo?.address || "-"}</Text>
              </View>
            </View>
            <View style={styles.contactRow}>
              <View style={styles.contactItem}>
                <Ionicons name="call" size={14} color="#FFFFFF" />
                <Text style={styles.contactText}>{companyInfo?.phone || "-"}</Text>
              </View>
              <View style={styles.contactItem}>
                <Ionicons name="globe" size={14} color="#FFFFFF" />
                <Text style={styles.contactText}>{""}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => navigation.navigate('EditCompany', { companyId: companyInfo.id })}
            >
              <Ionicons name="create-outline" size={16} color="#FFFFFF" />
              <Text style={styles.editButtonText}>Şirket Bilgilerini Düzenle</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* İşlemler Menüsü */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>İşlemler</Text>
          <View style={[styles.menuContainer, { backgroundColor: theme.card }]}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  { borderBottomColor: theme.border },
                  !companyInfo && styles.menuItemDisabled,
                ]}
                onPress={() => handleMenuPress(item.screen)}
                disabled={!companyInfo && !loading}
              >
                <View style={styles.menuItemLeft}>
                  <Ionicons
                    name={item.icon}
                    size={18}
                    color={!companyInfo ? theme.textTertiary : theme.primary}
                  />
                  <Text
                    style={[
                      styles.menuTitle,
                      { color: !companyInfo ? theme.textTertiary : theme.text },
                    ]}
                  >
                    {item.title}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
  scrollView: {
    flex: 1,
    padding: 16,
  },
  companyCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  companyHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  companyIcon: {
    width: 48,
    height: 48,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  companyDetails: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  companyAddress: {
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.9,
    lineHeight: 18,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  contactText: {
    fontSize: 13,
    color: "#FFFFFF",
    opacity: 0.9,
    marginLeft: 6,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 6,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  menuContainer: {
    borderRadius: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 0.5,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 12,
  },
  menuItemDisabled: {
    opacity: 0.5,
  },
  warningBanner: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
  },
  warningContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  warningTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
  },
  warningButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  warningButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 8,
  },
});

export default CompanyScreen;
