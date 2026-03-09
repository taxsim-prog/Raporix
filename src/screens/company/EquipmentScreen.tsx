"use client"

import React, { useState, useCallback } from "react"
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "../../theme/ThemeContext"
import { useFocusEffect } from "@react-navigation/native"
import CustomAlert from "../../components/CustomAlert"
import EquipmentApi, { EquipmentOut } from "../../api/equipment"
import CompaniesApi from "../../api/companies"

interface EquipmentScreenProps {
  navigation: any
}

const EquipmentScreen = ({ navigation }: EquipmentScreenProps) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("")
  const [equipment, setEquipment] = useState<EquipmentOut[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentOut | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
    showCancel?: boolean;
    confirmText?: string;
    cancelText?: string;
  }>({
    title: '',
    message: '',
    type: 'info',
  })

  const loadEquipment = async () => {
    setLoading(true)
    setError(null)
    try {
      const companies = await CompaniesApi.list({ q: '', limit: 1, offset: 0 })
      if (companies && companies.length > 0) {
        const companyId = parseInt(companies[0].id)
        const list = await EquipmentApi.list({ company_id: companyId, limit: 100 })
        setEquipment(list)
      }
    } catch (e: any) {
      setError(e?.message || "Ekipmanlar yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadEquipment()
    }, [])
  )

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config)
    setAlertVisible(true)
  }

  const handleAlertConfirm = () => {
    setAlertVisible(false)
    alertConfig.onConfirm?.()
  }

  const handleEquipmentPress = (item: EquipmentOut) => {
    setSelectedEquipment(item)
    setShowActionModal(true)
  }

  const handleEdit = () => {
    setShowActionModal(false)
    if (selectedEquipment) {
      navigation.navigate('EditEquipment', { equipmentId: selectedEquipment.id })
    }
  }

  const handleDelete = () => {
    setShowActionModal(false)
    showAlert({
      title: 'Ekipmanı Sil',
      message: 'Bu ekipmanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      type: 'warning',
      onConfirm: confirmDelete,
      showCancel: true,
      confirmText: 'Evet',
      cancelText: 'Hayır',
    })
  }

  const confirmDelete = async () => {
    if (!selectedEquipment) return
    
    setDeleting(true)
    try {
      await EquipmentApi.delete(selectedEquipment.id)
      showAlert({
        title: 'Başarılı',
        message: 'Ekipman başarıyla silindi.',
        type: 'success',
        onConfirm: () => {
          setSelectedEquipment(null)
          loadEquipment()
        },
      })
    } catch (error: any) {
      console.error('[EquipmentScreen] Silme hatası:', error)
      showAlert({
        title: 'Hata',
        message: error?.message || 'Ekipman silinirken bir hata oluştu.',
        type: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  const getEquipmentTypeIcon = (type: string) => {
    if (type.toLowerCase().includes('topraklama')) {
      return 'flash'
    } else if (type.toLowerCase().includes('termal')) {
      return 'thermometer'
    }
    return 'construct'
  }

  const getEquipmentTypeColor = (type: string) => {
    if (type.toLowerCase().includes('topraklama')) {
      return theme.primary
    } else if (type.toLowerCase().includes('termal')) {
      return '#F59E0B'
    }
    return '#6B7280'
  }

  const isCalibrationExpired = (date: string | null | undefined) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch =
      item.equipment_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.equipment_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.serial_number.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.primary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ekipmanlar</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateEquipment')}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Ekipman ara..."
              placeholderTextColor={theme.textSecondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Loading */}
        {loading && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.loadingText, { color: theme.textSecondary }]}>Yükleniyor...</Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              onPress={loadEquipment}
            >
              <Text style={styles.retryButtonText}>Tekrar Dene</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Equipment List */}
        {!loading && !error && (
          <View style={styles.equipmentSection}>
            <View style={[styles.equipmentContainer, { backgroundColor: theme.card }]}>
              {filteredEquipment.map((item) => {
                const isExpired = isCalibrationExpired(item.calibration_expiry_date)
                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={[styles.equipmentCard, { borderBottomColor: theme.border }]}
                    onPress={() => handleEquipmentPress(item)}
                  >
                    <View style={styles.equipmentHeader}>
                      <View style={[styles.equipmentIcon, { backgroundColor: theme.background }]}>
                        <Ionicons 
                          name={getEquipmentTypeIcon(item.equipment_type)} 
                          size={20} 
                          color={getEquipmentTypeColor(item.equipment_type)} 
                        />
                      </View>
                      <View style={styles.equipmentInfo}>
                        <Text style={[styles.equipmentId, { color: theme.textSecondary }]}>
                          #{item.id}
                        </Text>
                        <Text style={[styles.equipmentName, { color: theme.text }]}>
                          {item.equipment_name}
                        </Text>
                        <Text style={[styles.equipmentType, { color: theme.textSecondary }]}>
                          {item.equipment_type}
                        </Text>
                        <Text style={[styles.equipmentModel, { color: theme.primary }]}>
                          SN: {item.serial_number}
                        </Text>
                      </View>
                      {isExpired && (
                        <View style={styles.expiredBadge}>
                          <Ionicons name="warning" size={16} color="#FFFFFF" />
                          <Text style={styles.expiredText}>Süresi Dolmuş</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.equipmentDetails}>
                      <View style={styles.detailRow}>
                        <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                        <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                          Kalibrasyon: {item.calibration_expiry_date 
                            ? new Date(item.calibration_expiry_date).toLocaleDateString('tr-TR')
                            : '-'
                          }
                        </Text>
                      </View>
                      {item.calibration_certificate_path && (
                        <View style={styles.detailRow}>
                          <Ionicons name="document-text-outline" size={14} color={theme.textSecondary} />
                          <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                            Belge Mevcut
                          </Text>
                        </View>
                      )}
                      <View style={styles.detailRow}>
                        <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                        <Text style={[styles.detailText, { color: theme.textSecondary }]}>
                          Oluşturma: {new Date(item.created_at).toLocaleDateString('tr-TR')}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!loading && !error && filteredEquipment.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={64} color={theme.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Ekipman bulunamadı</Text>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              {searchQuery ? 'Arama kriterlerinize uygun ekipman bulunmuyor.' : 'Henüz ekipman eklenmemiş.'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity 
                style={[styles.addFirstButton, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('CreateEquipment')}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addFirstButtonText}>İlk Ekipmanı Ekle</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Modal */}
      <Modal
        visible={showActionModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowActionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.actionModalContent, { backgroundColor: theme.card }]}>
            <View style={[styles.actionModalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.actionModalTitle, { color: theme.text }]}>İşlem Seç</Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.actionModalBody}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={handleEdit}
              >
                <Ionicons name="create-outline" size={24} color={theme.primary} />
                <Text style={[styles.actionButtonText, { color: theme.text }]}>Düzenle</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: theme.background, borderColor: theme.border }]}
                onPress={handleDelete}
                disabled={deleting}
              >
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
                <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Sil</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={handleAlertConfirm}
        onCancel={() => setAlertVisible(false)}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    fontSize: 18,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
  },
  addButton: {
    width: 40,
    alignItems: "flex-end",
  },
  scrollView: {
    flex: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  equipmentSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  equipmentContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  equipmentCard: {
    padding: 16,
    borderBottomWidth: 1,
  },
  equipmentHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  equipmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  equipmentInfo: {
    flex: 1,
  },
  equipmentId: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  equipmentType: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 2,
  },
  equipmentModel: {
    fontSize: 14,
    fontWeight: "600",
  },
  expiredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  expiredText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  equipmentDetails: {
    paddingLeft: 60,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  addFirstButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  actionModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  actionModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  actionModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  actionModalBody: {
    padding: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginLeft: 12,
  },
})

export default EquipmentScreen
