import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, ThemeMode } from '../../theme/ThemeContext';
import CustomAlert from '../../components/CustomAlert';

type AlertType = 'success' | 'error' | 'warning' | 'info';

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

interface ThemeScreenProps {
  navigation: any;
}

const ThemeScreen = ({ navigation }: ThemeScreenProps) => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeMode>(themeMode);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    title: '',
    message: '',
    type: 'info',
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

  const themes = [
    {
      id: 'light',
      title: 'Açık Tema',
      subtitle: 'Klasik beyaz tema',
      icon: 'sunny',
      preview: '#FFFFFF'
    },
    {
      id: 'dark',
      title: 'Koyu Tema',
      subtitle: 'Gözlerinizi yormuyor',
      icon: 'moon',
      preview: '#1F2937'
    },
    {
      id: 'auto',
      title: 'Otomatik',
      subtitle: 'Sistem ayarını takip eder',
      icon: 'phone-portrait',
      preview: '#6B7280'
    },
  ];

  const handleApplyTheme = async () => {
    if (selectedTheme === themeMode) {
      showAlert({
        title: 'Bilgi',
        message: 'Seçtiğiniz tema zaten aktif.',
        type: 'info',
      });
      return;
    }

    try {
      setLoading(true);
      await setThemeMode(selectedTheme);
      
      showAlert({
        title: 'Başarılı',
        message: 'Tema ayarları başarıyla uygulandı.',
        type: 'success',
        onConfirm: () => navigation.goBack(),
      });
    } catch (error: any) {
      console.error('[ThemeScreen] Tema uygulama hatası:', error);
      showAlert({
        title: 'Hata',
        message: 'Tema ayarları uygulanırken bir hata oluştu.',
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Tema Ayarları</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Tema Seçimi */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tema Modu</Text>
          <View style={[styles.optionsContainer, { backgroundColor: theme.surface }]}>
            {themes.map((themeOption) => (
              <TouchableOpacity
                key={themeOption.id}
                style={[
                  styles.themeOption,
                  { borderBottomColor: theme.divider },
                  selectedTheme === themeOption.id && { backgroundColor: theme.primaryLight + '20' }
                ]}
                onPress={() => setSelectedTheme(themeOption.id as ThemeMode)}
              >
                <View style={styles.themePreview}>
                  <View style={[styles.previewBox, { backgroundColor: themeOption.preview }]}>
                    <Ionicons 
                      name={themeOption.icon as any} 
                      size={24} 
                      color={themeOption.id === 'light' ? '#1F2937' : '#FFFFFF'} 
                    />
                  </View>
                </View>
                <View style={styles.themeInfo}>
                  <Text style={[styles.themeTitle, { color: theme.text }]}>{themeOption.title}</Text>
                  <Text style={[styles.themeSubtitle, { color: theme.textSecondary }]}>{themeOption.subtitle}</Text>
                </View>
                <View style={[styles.radioButton, { borderColor: theme.primary }]}>
                  {selectedTheme === themeOption.id && (
                    <View style={[styles.radioButtonInner, { backgroundColor: theme.primary }]} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Uygula Butonu */}
        <View style={styles.applySection}>
          <TouchableOpacity 
            style={[styles.applyButton, { backgroundColor: theme.primary }, loading && styles.applyButtonDisabled]}
            onPress={handleApplyTheme}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.applyButtonText}>Tema Ayarlarını Uygula</Text>
            )}
          </TouchableOpacity>
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
    marginTop: 20,
  },
  section: {
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  optionsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  themePreview: {
    marginRight: 16,
  },
  previewBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  themeInfo: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeSubtitle: {
    fontSize: 14,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  applySection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  applyButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  applyButtonDisabled: {
    opacity: 0.6,
  },
});

export default ThemeScreen;