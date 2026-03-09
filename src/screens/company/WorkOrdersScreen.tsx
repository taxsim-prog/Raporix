"use client"

import React, { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import WorkOrdersApi, { WorkOrderOut } from "../../api/workOrders"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "../../theme/ThemeContext"
import CustomAlert from "../../components/CustomAlert"
import { useFocusEffect } from "@react-navigation/native"
import CompaniesApi, { CompanyEmployee } from "../../api/companies"
import StorageService from "../../utils/StorageService"
import ReportsApi from "../../api/reports"

const WorkOrdersScreen = ({ navigation }: { navigation: any }) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [workOrders, setWorkOrders] = useState<WorkOrderOut[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [employees, setEmployees] = useState<CompanyEmployee[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderOut | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [startingWork, setStartingWork] = useState(false)
  const [creatingReport, setCreatingReport] = useState(false)
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

  const loadWorkOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      // Current user bilgisini al
      const currentUser = await StorageService.getItem<{ id: string }>('currentUser')
      if (currentUser?.id) {
        setCurrentUserId(currentUser.id)
      }
      
      // Önce şirket bilgisini al
      const companies = await CompaniesApi.list({ q: '', limit: 1, offset: 0 })
      
      if (!companies || companies.length === 0) {
        setError("Şirket bilgisi bulunamadı")
        setLoading(false)
        return
      }
      
      const companyId = parseInt(companies[0].id)
      
      // Şirket ID'si ile iş emirlerini ve çalışanları paralel yükle
      const [list, employeesResponse] = await Promise.all([
        WorkOrdersApi.list({ company_id: companyId.toString(), sort_by: "created_at", sort_dir: "desc", limit: 100 }),
        CompaniesApi.getEmployees(companyId)
      ])
      
      setWorkOrders(list)
      setEmployees(employeesResponse.employees)
    } catch (e: any) {
      setError(e?.message || "İş emirleri yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    React.useCallback(() => {
      loadWorkOrders()
    }, [])
  )

  const getEmployeeName = (employeeId: string | null | undefined): string => {
    if (!employeeId) return '-'
    const employee = employees.find(emp => emp.id === employeeId)
    return employee?.full_name || employee?.email || employeeId
  }

  const filters = useMemo(() => [
    { id: "all", title: "Tümü", count: workOrders.length },
    { id: "pending", title: "Bekleyen", count: workOrders.filter((w) => w.status === "pending").length },
    { id: "in_progress", title: "Devam Eden", count: workOrders.filter((w) => w.status === "in_progress").length },
    { id: "completed", title: "Tamamlanan", count: workOrders.filter((w) => w.status === "completed").length },
  ], [workOrders])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#F59E0B"
      case "in_progress":
        return "#3B82F6"
      case "urgent":
        return "#EF4444"
      case "completed":
        return "#10B981"
      default:
        return "#6B7280"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Bekleyen"
      case "in_progress":
        return "Devam Eden"
      case "urgent":
        return "Acil"
      case "completed":
        return "Tamamlandı"
      default:
        return "Bilinmiyor"
    }
  }

  const getPriorityIcon = () => "help-circle"

  const filteredWorkOrders = workOrders.filter((order) => {
    const matchesSearch = (order.title || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === "all" || order.status === selectedFilter
    return matchesSearch && matchesFilter
  })

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config)
    setAlertVisible(true)
  }

  const handleAlertConfirm = () => {
    setAlertVisible(false)
    alertConfig.onConfirm?.()
  }

  const handleWorkOrderPress = (order: WorkOrderOut) => {
    setSelectedWorkOrder(order)
    setShowActionModal(true)
  }

  const handleEdit = () => {
    if (selectedWorkOrder?.status === 'in_progress') {
      showAlert({
        title: 'Hata',
        message: 'Devam Eden iş emirleri düzenlenemez.',
        type: 'error',
      })
      return
    }
    setShowActionModal(false)
    if (selectedWorkOrder) {
      navigation.navigate('EditWorkOrder', { workOrderId: selectedWorkOrder.id })
    }
  }

  const handleDelete = () => {
    setShowActionModal(false)
    setAlertConfig({
      title: 'İş Emrini Sil',
      message: 'Bu iş emrini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      type: 'warning',
      onConfirm: confirmDelete,
      showCancel: true,
      confirmText: 'Evet',
      cancelText: 'Hayır',
    })
    setAlertVisible(true)
  }

  const handleStartWork = () => {
    setShowActionModal(false)
    setAlertConfig({
      title: 'İş Emrine Başla',
      message: 'İş emrine başlamak istediğinize emin misiniz? Onayladığınızda iş emri durumu "Devam Ediyor" olarak değişecektir.',
      type: 'info',
      onConfirm: confirmStartWork,
      showCancel: true,
      confirmText: 'Evet',
      cancelText: 'Hayır',
    })
    setAlertVisible(true)
  }

  const handleContinueWork = () => {
    // in_progress durumundaki iş emirleri için direkt yönlendirme (soru sorma)
    setShowActionModal(false)
    if (selectedWorkOrder) {
      navigation.navigate('WorkOrderDetail', { workOrderId: selectedWorkOrder.id })
    }
  }

  const confirmStartWork = async () => {
    if (!selectedWorkOrder) return
    
    setStartingWork(true)
    try {
      await WorkOrdersApi.update(selectedWorkOrder.id, { status: 'in_progress' })
      
      // Başarılı güncelleme sonrası detail sayfasına yönlendir
      navigation.navigate('WorkOrderDetail', { workOrderId: selectedWorkOrder.id })
      
      // Liste yenile
      loadWorkOrders()
    } catch (error: any) {
      console.error('[WorkOrdersScreen] İş emri başlatma hatası:', error)
      showAlert({
        title: 'Hata',
        message: error?.message || 'İş emri başlatılırken bir hata oluştu.',
        type: 'error',
      })
    } finally {
      setStartingWork(false)
    }
  }

  const handleCreateReport = async () => {
    if (!selectedWorkOrder) return
    
    setShowActionModal(false)
    setCreatingReport(true)
    
    try {
      await ReportsApi.create({
        title: `${selectedWorkOrder.title} - Rapor`,
        description: `İş Emri ID: ${selectedWorkOrder.id}`,
        company_id: selectedWorkOrder.company_id ? parseInt(selectedWorkOrder.company_id) : undefined,
        work_order_id: parseInt(selectedWorkOrder.id),
        type: 'pdf',
      })
      
      showAlert({
        title: 'Başarılı',
        message: 'Rapor başarıyla oluşturuldu.',
        type: 'success',
      })
    } catch (error: any) {
      console.error('[WorkOrdersScreen] Rapor oluşturma hatası:', error)
      showAlert({
        title: 'Hata',
        message: error?.message || 'Rapor oluşturulurken bir hata oluştu.',
        type: 'error',
      })
    } finally {
      setCreatingReport(false)
    }
  }

  const confirmDelete = async () => {
    if (!selectedWorkOrder) return
    
    setDeleting(true)
    try {
      await WorkOrdersApi.delete(selectedWorkOrder.id)
      showAlert({
        title: 'Başarılı',
        message: 'İş emri başarıyla silindi.',
        type: 'success',
        onConfirm: () => {
          setSelectedWorkOrder(null)
          loadWorkOrders()
        },
      })
    } catch (error: any) {
      console.error('[WorkOrdersScreen] Silme hatası:', error)
      showAlert({
        title: 'Hata',
        message: error?.message || 'İş emri silinirken bir hata oluştu.',
        type: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={theme.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>İş Emirleri</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('CreateWorkOrder')}>
          <Ionicons name="add" size={22} color={theme.headerText} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="İş emri ara..."
              placeholderTextColor={theme.inputPlaceholder}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filters */}
        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.filtersContainer}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[
                    styles.filterButton,
                    { backgroundColor: theme.card, borderColor: theme.border },
                    selectedFilter === filter.id && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                  onPress={() => setSelectedFilter(filter.id)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      { color: theme.textSecondary },
                      selectedFilter === filter.id && { color: '#FFFFFF' }
                    ]}
                  >
                    {filter.title} ({filter.count})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Work Orders List */}
        <View style={styles.workOrdersSection}>
          <View style={[styles.workOrdersContainer, { backgroundColor: theme.card }]}>
            {loading && (<View style={[styles.workOrderCard, { borderBottomColor: theme.border }]}><Text style={{ color: theme.text }}>Yükleniyor...</Text></View>)}
            {!!error && !loading && (<View style={[styles.workOrderCard, { borderBottomColor: theme.border }]}><Text style={{ color: '#EF4444' }}>{error}</Text></View>)}
            {filteredWorkOrders.map((order) => {
              const isAssignedToMe = currentUserId && order.assigned_to === currentUserId
              
              return (
              <TouchableOpacity 
                key={order.id} 
                style={[
                  styles.workOrderCard, 
                  { borderBottomColor: theme.border },
                  isAssignedToMe && { borderLeftWidth: 4, borderLeftColor: theme.primary }
                ]}
                onPress={() => handleWorkOrderPress(order)}
              >
                <View style={styles.workOrderHeader}>
                  <View style={styles.workOrderInfo}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.workOrderTitle, { color: theme.text }]}>{order.title}</Text>
                    </View>
                    {!!order.company_id && <Text style={[styles.workOrderClient, { color: theme.primary }]}>İletişim: {order.customer_company_phone}</Text>}
                  </View>
                  <View style={styles.workOrderStatus}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}> 
                      <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                    </View>
                    {isAssignedToMe && (
                        <View style={[styles.myWorkBadge, { backgroundColor: theme.primary, marginTop:2 }]}>
                          <Text style={styles.myWorkBadgeText}>Bana Atandı</Text>
                        </View>
                      )}
                  </View>
                </View>

                <View style={styles.workOrderDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={14} color={theme.textSecondary} />
                    <Text style={[styles.detailText, { color: theme.textSecondary }]}>Atanan: {getEmployeeName(order.assigned_to)}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={14} color={theme.textSecondary} />
                    <Text style={[styles.detailText, { color: theme.textSecondary }]}>Adres: {order.customer_company_address}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                    <Text style={[styles.detailText, { color: theme.textSecondary }]}>Oluşturma: {new Date(order.created_at as unknown as string).toLocaleDateString('tr-TR')}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text-outline" size={14} color={theme.textSecondary} />
                    <Text style={[styles.detailText, { color: theme.textSecondary }]}>{order.description || '-'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {filteredWorkOrders.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="clipboard-outline" size={40} color={theme.textTertiary} />
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>İş emri bulunamadı</Text>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>Arama kriterlerinize uygun iş emri bulunmuyor.</Text>
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
          <View style={[styles.actionModalContent, { backgroundColor: theme.background }]}>
            <View style={[styles.actionModalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.actionModalTitle, { color: theme.text }]}>İş Emri İşlemleri</Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionModalBody}>
              {/* Yöneticiye atanan iş emirleri için buton */}
              {selectedWorkOrder && currentUserId && selectedWorkOrder.assigned_to === currentUserId && (
                <>
                  {/* Pending durumunda: "İş Emrine Başla" (alert ile) */}
                  {selectedWorkOrder.status === 'pending' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                      onPress={handleStartWork}
                      disabled={startingWork}
                    >
                      {startingWork ? (
                        <ActivityIndicator size="small" color={theme.primary} />
                      ) : (
                        <>
                          <Ionicons name="play-circle-outline" size={22} color={theme.primary} />
                          <Text style={[styles.actionButtonText, { color: theme.text }]}>İş Emrine Başla</Text>
                          <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  {/* In_progress durumunda: "İş Emrine Devam Et" (direkt yönlendirme) */}
                  {selectedWorkOrder.status === 'in_progress' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                      onPress={handleContinueWork}
                    >
                      <Ionicons name="arrow-forward-circle-outline" size={22} color={theme.primary} />
                      <Text style={[styles.actionButtonText, { color: theme.text }]}>İş Emrine Devam Et</Text>
                      <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    </TouchableOpacity>
                  )}
                </>
              )}

              {/* Tamamlanmış iş emirleri için "Rapor Çıktısını Al" butonu */}
              {selectedWorkOrder && selectedWorkOrder.status === 'completed' && (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={handleCreateReport}
                  disabled={creatingReport}
                >
                  {creatingReport ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <>
                      <Ionicons name="document-text-outline" size={22} color={theme.primary} />
                      <Text style={[styles.actionButtonText, { color: theme.text }]}>Rapor Çıktısını Al</Text>
                      <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    </>
                  )}
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={handleEdit}
              >
                <Ionicons name="create-outline" size={22} color={theme.primary} />
                <Text style={[styles.actionButtonText, { color: theme.text }]}>Düzenle</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                    <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Sil</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: "#F3F4F6",
  },
  header: {
    backgroundColor: "#059669",
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
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
    marginLeft: 12,
  },
  filtersSection: {
    paddingBottom: 16,
  },
  filtersContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
  },
  filterButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterButtonActive: {
    backgroundColor: "#059669",
    borderColor: "#059669",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  workOrdersSection: {
    paddingHorizontal: 20,
  },
  workOrdersContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    overflow: "hidden",
  },
  workOrderCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  workOrderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  workOrderInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  myWorkBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  myWorkBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  workOrderId: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
  },
  workOrderTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1F2937",
  },
  workOrderClient: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },
  workOrderStatus: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  workOrderDetails: {
    paddingLeft: 0,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#6B7280",
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
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
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

export default WorkOrdersScreen
