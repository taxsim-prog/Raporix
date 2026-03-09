import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from '../../theme/ThemeContext';

const HelpCenterScreen = ({ navigation }: { navigation: any }) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    {
      id: 1,
      question: 'Nasıl yeni bir periyodik kontrol başlatabilirim?',
      answer: 'Anasayfada bulunan "Yeni Kontrol" butonuna tıklayarak yeni bir periyodik kontrol işlemi başlatabilirsiniz. Gerekli bilgileri doldurduktan sonra kontrol süreci otomatik olarak başlayacaktır.'
    },
    {
      id: 2,
      question: 'Raporlarımı nasıl indirebilirim?',
      answer: 'Raporlar sayfasından istediğiniz raporu seçip "İndir" butonuna tıklayabilirsiniz. Raporlar PDF formatında cihazınıza kaydedilecektir.'
    },
    {
      id: 3,
      question: 'Şirket bilgilerimi nasıl güncelleyebilirim?',
      answer: 'Şirket sayfasından "Şirket Bilgilerini Düzenle" seçeneğini kullanarak tüm şirket bilgilerinizi güncelleyebilirsiniz.'
    },
    {
      id: 4,
      question: 'Bildirimleri nasıl yönetebilirim?',
      answer: 'Profil > Bildirim Ayarları bölümünden hangi bildirimleri almak istediğinizi seçebilirsiniz.'
    },
    {
      id: 5,
      question: 'Şifremi unuttum, ne yapmalıyım?',
      answer: 'Giriş sayfasında "Şifremi Unuttum" linkine tıklayarak e-posta adresinize şifre sıfırlama bağlantısı gönderebilirsiniz.'
    },
  ];

  const toggleFaq = (faqId: number) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  const filteredFaqs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Yardım Merkezi</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
            <Ionicons name="search" size={20} color={theme.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Yardım konularında ara..."
              placeholderTextColor={theme.inputPlaceholder}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Sık Sorulan Sorular</Text>
          <View style={[styles.faqContainer, { backgroundColor: theme.card }]}>
            {filteredFaqs.map((faq) => (
              <View key={faq.id} style={[styles.faqItem, { borderBottomColor: theme.border }]}>
                <TouchableOpacity 
                  style={styles.faqQuestion}
                  onPress={() => toggleFaq(faq.id)}
                >
                  <Text style={[styles.faqQuestionText, { color: theme.text }]}>{faq.question}</Text>
                  <Ionicons 
                    name={expandedFaq === faq.id ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color={theme.textTertiary} 
                  />
                </TouchableOpacity>
                {expandedFaq === faq.id && (
                  <View style={styles.faqAnswer}>
                    <Text style={[styles.faqAnswerText, { color: theme.textSecondary }]}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            ))}
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
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
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
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  categorySubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  faqContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  faqItem: {
    borderBottomWidth: 1,
  },
  faqQuestion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  faqAnswerText: {
    fontSize: 14,
    lineHeight: 20,
  },
  supportContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  supportCard: {
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  supportSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  supportButton: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  supportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default HelpCenterScreen;