import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from '../../theme/ThemeContext';
import FeedbackApi from '../../api/feedback';
import CustomAlert from '../../components/CustomAlert';

interface FeedbackScreenProps {
  navigation: any;
}

const FeedbackScreen = ({ navigation }: FeedbackScreenProps) => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    category: '',
    rating: 0,
    title: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);
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

  const feedbackCategories = [
    { id: 'bug', title: 'Hata Bildirimi', icon: 'bug', color: '#EF4444' },
    { id: 'feature', title: 'Özellik İsteği', icon: 'bulb', color: '#F59E0B' },
    { id: 'improvement', title: 'İyileştirme', icon: 'trending-up', color: '#3B82F6' },
    { id: 'general', title: 'Genel Görüş', icon: 'chatbubble', color: '#059669' },
  ];

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const selectCategory = (categoryId: string) => {
    updateFormData('category', categoryId);
  };

  const setRating = (rating: string | number) => {
    updateFormData('rating', rating.toString());
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info', onConfirm?: () => void) => {
    setAlertConfig({ title, message, type, onConfirm });
    setAlertVisible(true);
  };

  const handleSubmitFeedback = async () => {
    if (!formData.category || !formData.title || !formData.description) {
      showAlert('Hata', 'Lütfen tüm zorunlu alanları doldurun', 'error');
      return;
    }

    if (formData.rating === 0) {
      showAlert('Hata', 'Lütfen bir puan verin', 'error');
      return;
    }

    setSubmitting(true);
    
    try {
      await FeedbackApi.create({
        category: formData.category as "bug" | "feature" | "improvement" | "general",
        rating: formData.rating,
        title: formData.title,
        description: formData.description,
      });
      
      showAlert(
        'Teşekkürler!', 
        'Geri bildiriminiz başarıyla gönderildi. En kısa sürede değerlendirip size dönüş yapacağız.',
        'success',
        () => navigation.goBack()
      );
    } catch (error: any) {
      showAlert(
        'Hata',
        error?.message || 'Geri bildirim gönderilemedi. Lütfen tekrar deneyin.',
        'error'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryTitle = (categoryId: string) => {
    const category = feedbackCategories.find(cat => cat.id === categoryId);
    return category ? category.title : '';
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
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Geri Bildirim</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <Ionicons name="heart" size={24} color="#EF4444" />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Görüşleriniz bizim için çok değerli! Uygulamayı daha iyi hale getirmek için 
              fikirlerinizi, önerilerinizi ve karşılaştığınız sorunları bizimle paylaşın.
            </Text>
          </View>
        </View>

        {/* Category Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Kategori Seçin *</Text>
          <View style={styles.categoriesGrid}>
            {feedbackCategories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  { backgroundColor: theme.card, borderColor: formData.category === category.id ? theme.primary : 'transparent' },
                  formData.category === category.id && { backgroundColor: theme.primaryLight + '20' }
                ]}
                onPress={() => selectCategory(category.id)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                  <Ionicons name={category.icon} size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.categoryTitle, { color: theme.text }]}>{category.title}</Text>
                {formData.category === category.id && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rating */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Genel Memnuniyet *</Text>
          <View style={[styles.ratingContainer, { backgroundColor: theme.card }]}>
            <Text style={[styles.ratingLabel, { color: theme.text }]}>Uygulamayı nasıl değerlendiriyorsunuz?</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  style={styles.starButton}
                  onPress={() => setRating(star)}
                >
                  <Ionicons
                    name={star <= formData.rating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= formData.rating ? '#F59E0B' : '#D1D5DB'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            {formData.rating > 0 && (
              <Text style={[styles.ratingText, { color: theme.primary }]}>
                {formData.rating === 1 && 'Çok Kötü'}
                {formData.rating === 2 && 'Kötü'}
                {formData.rating === 3 && 'Orta'}
                {formData.rating === 4 && 'İyi'}
                {formData.rating === 5 && 'Mükemmel'}
              </Text>
            )}
          </View>
        </View>

        {/* Feedback Form */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Detaylar</Text>
          <View style={[styles.formContainer, { backgroundColor: theme.card }]}>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Başlık *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formData.title}
                onChangeText={(value) => updateFormData('title', value)}
                placeholder="Geri bildiriminizin başlığı"
                placeholderTextColor={theme.inputPlaceholder}
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Açıklama *</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                value={formData.description}
                onChangeText={(value) => updateFormData('description', value)}
                placeholder="Detaylı açıklama yazın..."
                placeholderTextColor={theme.inputPlaceholder}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <TouchableOpacity 
            style={[styles.submitButton, { backgroundColor: theme.primary, opacity: submitting ? 0.7 : 1 }]} 
            onPress={handleSubmitFeedback}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.submitButtonText}>
              {submitting ? 'Gönderiliyor...' : 'Geri Bildirim Gönder'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Privacy Note */}
        <View style={styles.privacySection}>
          <Text style={[styles.privacyText, { color: theme.textTertiary }]}>
            Gönderdiğiniz geri bildirimler gizlilik politikamız kapsamında değerlendirilir 
            ve sadece uygulama geliştirme süreçlerinde kullanılır.
          </Text>
        </View>
      </ScrollView>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          setAlertVisible(false);
          alertConfig.onConfirm?.();
        }}
        confirmText="Tamam"
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
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingVertical: 20,
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
    borderRadius: 12,
    padding: 16,
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
    borderWidth: 2,
  },
  selectedCategory: {
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  ratingContainer: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  ratingLabel: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  starButton: {
    marginHorizontal: 4,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600',
  },
  formContainer: {
    borderRadius: 12,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  disabledInput: {
    backgroundColor: '#F3F4F6',
    color: '#9CA3AF',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  submitSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  submitButton: {
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  privacySection: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  privacyText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default FeedbackScreen;