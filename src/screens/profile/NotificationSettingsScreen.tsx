import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from '../../theme/ThemeContext';

const NotificationSettingsScreen = ({ navigation }: { navigation: any }) => {
  const { theme } = useTheme();
  const [settings, setSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    controlReminders: true,
    reportNotifications: true,
    systemUpdates: true,
    marketingEmails: false,
    weeklyReports: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const notificationSections = [
    {
      title: 'Genel Bildirimler',
      items: [
        {
          key: 'pushNotifications' as keyof typeof settings,
          title: 'Push Bildirimleri',
          subtitle: 'Mobil cihazınıza anlık bildirimler',
          icon: 'notifications'
        },
      ]
    },
    {
      title: 'İş Bildirimleri',
      items: [
        {
          key: 'controlReminders' as keyof typeof settings,
          title: 'Kontrol Hatırlatmaları',
          subtitle: 'Yaklaşan periyodik kontroller',
          icon: 'alarm'
        },
        {
          key: 'reportNotifications' as keyof typeof settings,
          title: 'Rapor Bildirimleri',
          subtitle: 'Yeni raporlar hazır olduğunda',
          icon: 'document-text'
        },
        {
          key: 'systemUpdates' as keyof typeof settings,
          title: 'Sistem Güncellemeleri',
          subtitle: 'Uygulama ve sistem haberleri',
          icon: 'refresh'
        },
      ]
    },
  ];

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
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Bildirim Ayarları</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {notificationSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{section.title}</Text>
            <View style={[styles.settingsContainer, { backgroundColor: theme.card }]}>
              {section.items.map((item) => (
                <View key={item.key} style={[styles.settingItem, { borderBottomColor: theme.border }]}>
                  <View style={[styles.settingIcon, { backgroundColor: theme.primaryLight + '20' }]}>
                    <Ionicons name={item.icon} size={20} color={theme.primary} />
                  </View>
                  <View style={styles.settingInfo}>
                    <Text style={[styles.settingTitle, { color: theme.text }]}>{item.title}</Text>
                    <Text style={[styles.settingSubtitle, { color: theme.textSecondary }]}>{item.subtitle}</Text>
                  </View>
                  <Switch
                    value={settings[item.key]}
                    onValueChange={() => toggleSetting(item.key)}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={settings[item.key] ? '#FFFFFF' : '#FFFFFF'}
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Bildirim ayarlarınızı istediğiniz zaman değiştirebilirsiniz. 
              Acil durumlar için kritik bildirimler her zaman aktif kalacaktır.
            </Text>
          </View>
        </View>
      </ScrollView>
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
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  settingsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  infoCard: {
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginLeft: 12,
    flex: 1,
  },
});

export default NotificationSettingsScreen;