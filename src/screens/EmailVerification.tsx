import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useTheme } from "../theme/ThemeContext";
import CustomAlert from "../components/CustomAlert";
import AuthApi from "../api/auth"; // default import, AppNavigator ile aynı

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

interface EmailVerificationProps {
  navigation: any;
  route: any; // navigation.navigate("EmailVerification", { email })
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const email: string = route?.params?.email || "";

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);

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

  const handleCheckStatus = async () => {
    if (!email) {
      showAlert({
        title: "Hata",
        message: "E-posta bilgisi bulunamadı. Lütfen tekrar giriş yapın.",
        type: "error",
      });
      return;
    }

    setChecking(true);
    try {
      const status = await AuthApi.checkMailVerification(email);

      if (status.is_email_verified) {
        showAlert({
          title: "Başarılı",
          message: "E-posta adresiniz doğrulandı. Devam edebilirsiniz.",
          type: "success",
          confirmText: "Devam et",
          onConfirm: () => {
            // Doğrulandıktan sonra şirket bilgisi ekranına alalım
            navigation.navigate("CompanyInfo");
          },
        });
      } else {
        showAlert({
          title: "Henüz doğrulanmadı",
          message:
            "E-posta adresiniz henüz doğrulanmamış görünüyor. Lütfen e-posta kutunuzu kontrol edin.",
          type: "info",
        });
      }
    } catch (e: any) {
      console.error("[EmailVerification] Durum kontrolü hata:", e);
      showAlert({
        title: "Hata",
        message:
          e?.message ||
          "E-posta doğrulama durumu kontrol edilirken bir hata oluştu. Lütfen tekrar deneyin.",
        type: "error",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      showAlert({
        title: "Hata",
        message: "E-posta bilgisi bulunamadı. Lütfen tekrar giriş yapın.",
        type: "error",
      });
      return;
    }

    setResending(true);
    try {
      await AuthApi.sendMailVerification(email);
      showAlert({
        title: "Gönderildi",
        message:
          "Doğrulama e-postası tekrar gönderildi. Lütfen e-posta kutunuzu ve spam klasörünü kontrol edin.",
        type: "success",
      });
    } catch (e: any) {
      console.error("[EmailVerification] Mail yeniden gönderilemedi:", e);
      showAlert({
        title: "Hata",
        message:
          e?.message ||
          "Doğrulama e-postası gönderilirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
        type: "error",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>E-posta Doğrulama</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.iconContainer}>
            <Ionicons name="mail-open-outline" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.title, { color: theme.text }]}>Doğrulama E-postası Gönderildi</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            <Text style={{ fontWeight: "600" }}>
              {email || "E-posta adresiniz"}
            </Text>{" "}
            adresine bir doğrulama e-postası gönderdik. Lütfen e-postadaki bağlantıya
            tıklayarak hesabınızı doğrulayın.
          </Text>
        </View>

        <View style={[styles.actionsCard, { backgroundColor: theme.card }]}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: theme.primary },
              checking && styles.actionButtonDisabled,
            ]}
            onPress={handleCheckStatus}
            disabled={checking}
          >
            {checking ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Doğrulama Durumunu Kontrol Et</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { borderColor: theme.primary },
              resending && styles.actionButtonDisabled,
            ]}
            onPress={handleResendEmail}
            disabled={resending}
          >
            {resending ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <>
                <Ionicons name="mail-outline" size={18} color={theme.primary} />
                <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
                  Doğrulama E-postasını Tekrar Gönder
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.goBack()}>
            <Text style={[styles.linkButtonText, { color: theme.textSecondary }]}>
              Geri dön
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  card: {
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    alignItems: "center",
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  actionsCard: {
    borderRadius: 12,
    padding: 20,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 8,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  linkButton: {
    marginTop: 8,
    alignItems: "center",
  },
  linkButtonText: {
    fontSize: 13,
    textDecorationLine: "underline",
  },
});

export default EmailVerification;
