import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Linking,
  Image
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from '../../theme/ThemeContext';

interface AboutScreenProps {
  navigation: any;
}

const AboutScreen = ({ navigation }: AboutScreenProps) => {
  const { theme } = useTheme();
  const appInfo = {
    version: '1.0.4',
    buildNumber: '2025.11.23',
    developer: 'Tor Mühendislik Elektrik San. Ve Tic. Ltd. Şti.',
    website: 'www.tormuhendislik.com',
    email: 'info@tormuhendislik.com',
    phone: '0 (216) 706 40 16',
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  const handleSendEmail = () => {
    Linking.openURL(`mailto:${appInfo.email}`);
  };

  const handleCall = () => {
    Linking.openURL(`tel:${appInfo.phone}`);
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
          <Ionicons name="chevron-back" size={22} color={theme.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Hakkında</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* App Logo & Info */}
        <View style={[styles.appSection, { backgroundColor: theme.card }]}>
          <View style={styles.appIcon}>
            <Image
            source={require('../../assets/raptor2.jpeg')}
            style={styles.logo}
            resizeMode="contain"
          />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>RapTor</Text>
          <Text style={[styles.appVersion, { color: theme.primary }]}>Versiyon {appInfo.version}</Text>
          <Text style={[styles.buildNumber, { color: theme.textSecondary }]}>Build {appInfo.buildNumber}</Text>
        </View>

        {/* Developer Info */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Geliştirici</Text>
          <View style={[styles.developerContainer, { backgroundColor: theme.card }]}>
            <View style={styles.developerInfo}>
              <Text style={[styles.developerName, { color: theme.text }]}>{appInfo.developer}</Text>
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={() => handleOpenLink(`https://${appInfo.website}`)}
              >
                <Ionicons name="globe-outline" size={18} color={theme.primary} />
                <Text style={[styles.contactText, { color: theme.primary }]}>{appInfo.website}</Text>
                <Ionicons name="open-outline" size={14} color={theme.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={handleSendEmail}
              >
                <Ionicons name="mail-outline" size={18} color={theme.primary} />
                <Text style={[styles.contactText, { color: theme.primary }]}>{appInfo.email}</Text>
                <Ionicons name="open-outline" size={14} color={theme.textTertiary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.contactItem}
                onPress={handleCall}
              >
                <Ionicons name="call-outline" size={18} color={theme.primary} />
                <Text style={[styles.contactText, { color: theme.primary }]}>{appInfo.phone}</Text>
                <Ionicons name="open-outline" size={14} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Yasal</Text>
          <View style={[styles.legalContainer, { backgroundColor: theme.card }]}>
            <TouchableOpacity style={[styles.legalItem, { borderBottomColor: theme.border }]}>
              <Text style={[styles.legalText, { color: theme.text }]}>Kullanım Koşulları</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.legalItem, { borderBottomColor: theme.border }]}>
              <Text style={[styles.legalText, { color: theme.text }]}>Gizlilik Politikası</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.legalItem, { borderBottomColor: theme.border }]}>
              <Text style={[styles.legalText, { color: theme.text }]}>Lisans Bilgileri</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Copyright */}
        <View style={styles.copyrightSection}>
          <Text style={[styles.copyrightText, { color: theme.textTertiary }]}>
            © 2025 Tor Mühendislik Elektrik San. Ve Tic. Ltd. Şti.
          </Text>
          <Text style={[styles.copyrightText, { color: theme.textTertiary }]}>
            Tüm hakları saklıdır.
          </Text>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  appSection: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 16,
  },
  appIcon: {
    borderRadius: 16,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  appVersion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  buildNumber: {
    fontSize: 13,
  },
  section: {
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  featuresContainer: {
    borderRadius: 8,
    padding: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureText: {
    fontSize: 14,
    marginLeft: 10,
  },
  developerContainer: {
    borderRadius: 8,
    padding: 16,
  },
  developerInfo: {
    alignItems: 'flex-start',
  },
  developerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    width: '100%',
  },
  contactText: {
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  legalContainer: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  legalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 0.5,
  },
  legalText: {
    fontSize: 14,
  },
  copyrightSection: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  copyrightText: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 4,
  },
  logo: {
    width: 200,
    height: 100,
    borderRadius: 16,
  },
});

export default AboutScreen;