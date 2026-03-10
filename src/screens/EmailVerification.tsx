import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../theme/ThemeContext";
import CustomAlert from "../components/CustomAlert";
import AuthApi from "../api/auth";
import api from "../api/client";

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
  route: any;
}

const EmailVerification: React.FC<EmailVerificationProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const email: string = route?.params?.email || "";

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
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

  const handleVerifyCode = async () => {
    if (!code || code.length < 6) {
      showAlert({
        title: "Uyarı",
        message: "Lütfen 6 haneli doğrulama kodunu girin.",
        type: "warning",
      });
      return;
    }

    setVerifying(true);
    try {
      await api.post("/auth/verify_code", { email, code });
      showAlert({
        title: "Başarılı",
        message: "E-posta adresiniz doğrulandı!",
        type: "success",
        confirmText: "Devam et",
        onConfirm: () => {
          navigation.navigate("Login");
        },
      });
    } catch (e: any) {
      showAlert({
        title: "Hata",
        message: e?.message || "Kod hatalı veya süresi dolmuş.",
        type: "error",
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      showAlert({
        title: "Hata",
        message: "E-posta bilgisi bulunamadı.",
        type: "error",
      });
      return;
    }

    setResending(true);
    try {
      await AuthApi.sendMailVerification(email);
      showAlert({
        title: "Gönderildi",
        message: "Yeni doğrulama kodu e-posta adresinize gönderildi.",
        type: "success",
      });
    } catch (e: any) {
      showAlert({
        title: "Hata",
        message: e?.message || "Kod gönderilemedi.",
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
        {/* Info Card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.title, { color: theme.text }]}>Doğrulama Kodu</Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            <Text style={{ fontWeight: "600" }}>{email}</Text> adresine 6 haneli doğrulama kodu gönderdik.
          </Text>
        </View>

        {/* Code Input Card */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <Text style={[styles.label, { color: theme.text }]}>Doğrulama Kodu</Text>
          <TextInput
            style={[styles.codeInput, {
              backgroundColor: theme.inputBackground,
              borderColor: theme.inputBorder,
              color: theme.inputText,
            }]}
            value={code}
            onChangeText={setCode}
            placeholder="6 haneli kodu girin"
            placeholderTextColor={theme.inputPlaceholder}
            keyboardType="number-pad"
            maxLength={6}
          />

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }, verifying && styles.disabled]}
            onPress={handleVerifyCode}
            disabled={verifying}
          >
            {verifying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>Kodu Doğrula</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.primary }, resending && styles.disabled]}
            onPress={handleResendEmail}
            disabled={resending}
          >
            {resending ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <Text style={[styles.secondaryButtonText, { color: theme.primary }]}>
                Kodu Tekrar Gönder
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => navigation.goBack()}>
            <Text style={[styles.linkButtonText, { color: theme.textSecondary }]}>Geri dön</Text>
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
  container: { flex: 1 },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  content: { flex: 1, padding: 20 },
  card: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  description: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  codeInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 24,
    textAlign: "center",
    letterSpacing: 8,
    marginBottom: 16,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  actionButtonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  secondaryButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 8,
  },
  secondaryButtonText: { fontSize: 14, fontWeight: "600" },
  disabled: { opacity: 0.7 },
  linkButton: { marginTop: 8, alignItems: "center" },
  linkButtonText: { fontSize: 13, textDecorationLine: "underline" },
});

export default EmailVerification;
