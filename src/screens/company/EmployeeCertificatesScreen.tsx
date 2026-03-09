"use client"

import React, { useState, useCallback } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, StatusBar, Modal } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { SafeAreaView } from "react-native-safe-area-context"
import Ionicons from "react-native-vector-icons/Ionicons"
import { useTheme } from "../../theme/ThemeContext"
import CertificatesApi, { CertificateOut } from "../../api/certificates"
import CustomAlert from "../../components/CustomAlert"

interface EmployeeCertificatesScreenProps {
  navigation: any;
  route: {
    params: {
      employeeId: string;
      employeeName: string;
      companyId: number;
    };
  };
}

const EmployeeCertificatesScreen = ({ navigation, route }: EmployeeCertificatesScreenProps) => {
  const { theme } = useTheme();
  const { employeeId, employeeName, companyId } = route.params;
  
  const [certificates, setCertificates] = useState<CertificateOut[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<CertificateOut | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    showCancel?: boolean;
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
  }>({
    title: '',
    message: '',
    type: 'info',
  })

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config)
    setAlertVisible(true)
  }

  const handleAlertConfirm = () => {
    setAlertVisible(false)
    alertConfig.onConfirm?.()
  }

  const handleAlertCancel = () => {
    setAlertVisible(false)
  }

  useFocusEffect(
    useCallback(() => {
      loadCertificates()
    }, [])
  )

  const loadCertificates = async () => {
    setLoading(true)
    try {
      const certs = await CertificatesApi.listByUser(parseInt(employeeId), companyId);
      setCertificates(certs);
    } catch (e: any) {
      console.error("[EmployeeCertificatesScreen] Hata:", e);
      showAlert({
        title: 'Hata',
        message: e?.message || 'Belgeler yüklenemedi',
        type: 'error',
      });
    } finally {
      setLoading(false)
    }
  }

  const handleAddCertificate = () => {
    navigation.navigate('CreateCertificate', {
      employeeId,
      employeeName,
      companyId,
    });
  }

  const handleCertificatePress = (cert: CertificateOut) => {
    setSelectedCertificate(cert)
    setShowActionModal(true)
  }

  const handleDelete = () => {
    setShowActionModal(false)
    showAlert({
      title: 'Belgeyi Sil',
      message: `${selectedCertificate?.certificate_name} belgesini silmek istediğinizden emin misiniz?`,
      type: 'warning',
      showCancel: true,
      confirmText: 'Evet',
      cancelText: 'Hayır',
      onConfirm: confirmDelete,
    });
  }

  const confirmDelete = async () => {
    if (!selectedCertificate) return;
    
    setDeleting(true)
    try {
      await CertificatesApi.delete(selectedCertificate.id);
      showAlert({
        title: 'Başarılı',
        message: 'Belge başarıyla silindi',
        type: 'success',
      });
      loadCertificates();
    } catch (e: any) {
      showAlert({
        title: 'Hata',
        message: e?.message || 'Belge silinemedi',
        type: 'error',
      });
    } finally {
      setDeleting(false)
      setSelectedCertificate(null)
    }
  }

  const getExpiryStatus = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    if (expiry < now) {
      return { status: 'expired', color: '#EF4444', text: 'Süresi Dolmuş' };
    } else if (expiry <= thirtyDaysLater) {
      return { status: 'expiring', color: '#F59E0B', text: 'Süresi Yaklaşıyor' };
    } else {
      return { status: 'active', color: '#10B981', text: 'Aktif' };
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  if (loading && certificates.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.primary} />
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{employeeName}</Text>
          <View style={styles.addButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.primary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{employeeName}</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCertificate}>
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats Card */}
        <View style={styles.statsSection}>
          <View style={[styles.statsCard, { backgroundColor: theme.card }]}>
            <View style={styles.statItem}>
              <Ionicons name="document-text" size={24} color={theme.primary} />
              <Text style={[styles.statValue, { color: theme.text }]}>{certificates.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Toplam Belge</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {certificates.filter(c => getExpiryStatus(c.expiry_date).status === 'active').length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Aktif</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <Ionicons name="warning" size={24} color="#F59E0B" />
              <Text style={[styles.statValue, { color: theme.text }]}>
                {certificates.filter(c => getExpiryStatus(c.expiry_date).status === 'expiring').length}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Yaklaşan</Text>
            </View>
          </View>
        </View>

        {/* Certificates List */}
        <View style={styles.certificatesSection}>
          {certificates.map((cert) => {
            const expiryInfo = getExpiryStatus(cert.expiry_date);
            
            return (
              <TouchableOpacity
                key={cert.id}
                style={[styles.certificateCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => handleCertificatePress(cert)}
              >
                <View style={styles.certificateHeader}>
                  <View style={[styles.certificateIcon, { backgroundColor: expiryInfo.color + '20' }]}>
                    <Ionicons name="document-text" size={24} color={expiryInfo.color} />
                  </View>
                  <View style={styles.certificateInfo}>
                    <Text style={[styles.certificateName, { color: theme.text }]}>
                      {cert.certificate_name}
                    </Text>
                    {cert.certificate_type && (
                      <Text style={[styles.certificateType, { color: theme.textSecondary }]}>
                        {cert.certificate_type}
                      </Text>
                    )}
                  </View>
                  <Ionicons name="ellipsis-vertical" size={20} color={theme.textSecondary} />
                </View>

                <View style={styles.certificateDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
                    <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                      Geçerlilik: {formatDate(cert.expiry_date)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: expiryInfo.color }]}>
                    <Text style={styles.statusText}>{expiryInfo.text}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {certificates.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Henüz belge yok</Text>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              Bu çalışan için henüz yetki belgesi eklenmemiş.
            </Text>
            <TouchableOpacity
              style={[styles.emptyStateButton, { backgroundColor: theme.primary }]}
              onPress={handleAddCertificate}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.emptyStateButtonText}>İlk Belgeyi Ekle</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowActionModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowActionModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {selectedCertificate?.certificate_name}
              </Text>
            </View>
            
            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowActionModal(false)
                // PDF görüntüleme fonksiyonu eklenebilir
                showAlert({
                  title: 'Bilgi',
                  message: 'PDF görüntüleme özelliği yakında eklenecek',
                  type: 'info',
                });
              }}
            >
              <Ionicons name="eye-outline" size={22} color={theme.text} />
              <Text style={[styles.modalOptionText, { color: theme.text }]}>Görüntüle</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.modalOptionDanger]}
              onPress={handleDelete}
            >
              <Ionicons name="trash-outline" size={22} color="#EF4444" />
              <Text style={[styles.modalOptionText, { color: "#EF4444" }]}>Sil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.modalOptionCancel]}
              onPress={() => setShowActionModal(false)}
            >
              <Text style={[styles.modalOptionText, { color: theme.textSecondary }]}>İptal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Custom Alert */}
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
  )
}

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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  addButton: {
    width: 40,
    alignItems: "flex-end",
  },
  scrollView: {
    flex: 1,
  },
  statsSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  statsCard: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    marginHorizontal: 8,
  },
  certificatesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  certificateCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  certificateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  certificateIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  certificateInfo: {
    flex: 1,
  },
  certificateName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  certificateType: {
    fontSize: 14,
  },
  certificateDetails: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  modalOptionDanger: {
    borderTopWidth: 1,
    borderTopColor: "#FEE2E2",
  },
  modalOptionCancel: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    justifyContent: "center",
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
})

export default EmployeeCertificatesScreen
