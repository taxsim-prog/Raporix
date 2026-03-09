import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import UsersApi from '../api/users';
import StorageService from '../utils/StorageService';
import CustomAlert from '../components/CustomAlert';
import { useTheme } from '../theme/ThemeContext';

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

// Add navigation prop interface
interface ProfileScreenProps {
  navigation: any;
  onLogout?: () => Promise<void> | void;
}

const ProfileScreen = ({ navigation, onLogout }: ProfileScreenProps) => {
  const { theme } = useTheme();
  const [userInfo, setUserInfo] = useState<{ name: string; email: string; role: string; department?: string; position?: string; phone_number?: string } | null>(null);
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

  useFocusEffect(
    useCallback(() => {
      console.log("[ProfileScreen] useFocusEffect çağırılıyor...")
      const load = async () => {
        setLoading(true);
        try {
          console.log("[ProfileScreen] Kullanıcı bilgileri yükleniyor...");
          
          // Storage'dan currentUser'ı al
          const currentUser = await StorageService.getItem<{ id: string; email: string; full_name?: string; role: string }>('currentUser');
          console.log("[ProfileScreen] currentUser:", currentUser);
          
          if (!currentUser || !currentUser.id) {
            throw new Error('Kullanıcı bilgisi bulunamadı. Lütfen tekrar giriş yapın.');
          }
          
          // API'ye user_id'yi gönder
          const me = await UsersApi.me(currentUser.id);
          console.log("[ProfileScreen] Kullanıcı bilgileri başarıyla yüklendi:", me);
          setUserInfo({ 
            name: me.full_name || me.email, 
            email: me.email, 
            role: me.role, 
            department: me.department || undefined, 
            position: me.position || undefined, 
            phone_number: me.phone_number || undefined 
          });
        } catch (e: any) {
          console.error("[ProfileScreen] Kullanıcı bilgileri yüklenirken hata:", e);
          
          let errorMessage = 'Profil bilgileri yüklenemedi.';
          
          if (e?.message) {
            if (e.message.includes('zaman aşımı') || e.message.includes('timeout')) {
              errorMessage = 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
            } else if (e.message.includes('bağlanılamadı') || e.message.includes('network')) {
              errorMessage = 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edin.';
            } else if (e.message.includes('401') || e.message.includes('Unauthorized')) {
              errorMessage = 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
            } else {
              errorMessage = e.message;
            }
          }

          showAlert({
            title: 'Hata',
            message: errorMessage,
            type: 'error',
          });
        } finally {
          setLoading(false);
          console.log("[ProfileScreen] Yükleme işlemi tamamlandı");
        }
      };
      load();
    }, [])
  );

  const menuSections = [
    {
      title: 'Hesap',
      items: [
        { id: 1, title: 'Profil Bilgilerini Düzenle', icon: 'create-outline', onPress: () => handleMenuPress(1) },
        { id: 2, title: 'Şifre Değiştir', icon: 'lock-closed-outline', onPress: () => handleMenuPress(2) },
        { id: 3, title: 'Bildirim Ayarları', icon: 'notifications-outline', onPress: () => handleMenuPress(3) },
      ]
    },
    {
      title: 'Uygulama',
      items: [
        { id: 4, title: 'Tema', icon: 'color-palette-outline', onPress: () => handleMenuPress(5) },
        { id: 5, title: 'Hakkında', icon: 'information-circle-outline', onPress: () => handleMenuPress(6) },
      ]
    },
    {
      title: 'Destek',
      items: [
        { id: 6, title: 'Yardım Merkezi', icon: 'help-circle-outline', onPress: () => handleMenuPress(7) },
        { id: 7, title: 'Geri Bildirim', icon: 'chatbubble-outline', onPress: () => handleMenuPress(9) },
      ]
    }
  ];

  const handleLogout = () => {
    showAlert({
      title: 'Çıkış Yap',
      message: 'Hesabınızdan çıkış yapmak istediğinizden emin misiniz?',
      type: 'error',
      showCancel: true,
      confirmText: 'Evet',
      cancelText: 'Hayır',
      onConfirm: async () => {
        try {
          console.log("[ProfileScreen] Çıkış işlemi başlatılıyor...");
          if (onLogout) {
            await onLogout();
          } else {
            await StorageService.removeItem('userToken');
            await StorageService.removeItem('currentUser');
            await StorageService.removeItem('userEmail');
          }
          console.log("[ProfileScreen] Çıkış başarılı");
        } catch (error: any) {
          console.error('[ProfileScreen] Çıkış hatası:', error);
          showAlert({
            title: 'Hata',
            message: 'Çıkış yapılırken bir hata oluştu. Lütfen tekrar deneyin.',
            type: 'error',
          });
        }
      },
    });
  };

  const handleMenuPress = (itemId: number) => {
    switch(itemId) {
      case 1: // Profil Bilgilerini Düzenle
        navigation.navigate('EditProfile');
        break;
      case 2: // Şifre Değiştir
        navigation.navigate('ChangePassword');
        break;
      case 3: // Bildirim Ayarları
        navigation.navigate('NotificationSettings');
        break;
      case 5: // Tema
        navigation.navigate('Theme');
        break;
      case 6: // Hakkında
        navigation.navigate('About');
        break;
      case 7: // Yardım Merkezi
        navigation.navigate('HelpCenter');
        break;
      case 9: // Geri Bildirim
        navigation.navigate('Feedback');
        break;
      default:
        console.log('Menu item pressed:', itemId);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Profil Kartı */}
        <View style={[styles.profileCard, { backgroundColor: theme.card }]}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>
                {(userInfo?.name || 'U').split(' ').map(n => n[0]).join('')}
              </Text>
            </View>
          </View>
          <Text style={[styles.userName, { color: theme.text }]}>{userInfo?.name || '-'}</Text>
          <Text style={[styles.userRole, { color: theme.primary }]}>{userInfo?.role === "admin" ? "Yönetici" : "Çalışan"}</Text>
          <View style={styles.userDetails}>
            <View style={styles.userDetailRow}>
              <Ionicons name="mail-outline" size={14} color={theme.textSecondary} />
              <Text style={[styles.userDetailText, { color: theme.textSecondary }]}>{userInfo?.email || '-'}</Text>
            </View>
            {userInfo?.department && (
              <View style={styles.userDetailRow}>
                <Ionicons name="briefcase-outline" size={14} color={theme.textSecondary} />
                <Text style={[styles.userDetailText, { color: theme.textSecondary }]}>{userInfo.department}</Text>
              </View>
            )}
            {userInfo?.position && (
              <View style={styles.userDetailRow}>
                <Ionicons name="person-outline" size={14} color={theme.textSecondary} />
                <Text style={[styles.userDetailText, { color: theme.textSecondary }]}>{userInfo.position}</Text>
              </View>
            )}
            {userInfo?.phone_number && (
              <View style={styles.userDetailRow}>
                <Ionicons name="call-outline" size={14} color={theme.textSecondary} />
                <Text style={[styles.userDetailText, { color: theme.textSecondary }]}>{userInfo.phone_number}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Menü Bölümleri */}
        {menuSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            <View style={[styles.menuContainer, { backgroundColor: theme.card }]}>
              {section.items.map((item) => (
                <TouchableOpacity 
                  key={item.id} 
                  style={[styles.menuItem, { borderBottomColor: theme.border }]}
                  onPress={item.onPress}
                >
                  <View style={styles.menuItemLeft}>
                    <Ionicons name={item.icon} size={18} color={theme.primary} />
                    <Text style={[styles.menuTitle, { color: theme.text }]}>{item.title}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Çıkış Butonu */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
        </TouchableOpacity>

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
  profileCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  userDetails: {
    alignItems: 'center',
  },
  userDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  userDetailText: {
    fontSize: 13,
    marginLeft: 6,
    lineHeight: 16,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  menuContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 0.5,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    lineHeight: 18,
  },
  logoutButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 32,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default ProfileScreen;