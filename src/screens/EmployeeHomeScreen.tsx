"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, TextInput } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import WorkOrdersApi, { WorkOrderOut } from "../api/workOrders"
import CompaniesApi from "../api/companies"
import { useTheme } from "../theme/ThemeContext"
import StorageService from "../utils/StorageService"
import CustomAlert from "../components/CustomAlert"

type WorkOrder = WorkOrderOut

interface Tab {
  id: string
  title: string
  count: number
}

interface StatusInfo {
  title: string
  color: string
  icon: string
}

interface PriorityInfo {
  title: string
  color: string
}

interface EmployeeHomeScreenProps {
  navigation?: any
}

const EmployeeHomeScreen: React.FC<EmployeeHomeScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme()
  const [selectedTab, setSelectedTab] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [alertVisible, setAlertVisible] = useState(false)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        // Kullanıcı bilgisini al
        const currentUser = await StorageService.getItem<{ id?: string; full_name?: string; email?: string }>('currentUser')
        if (currentUser?.full_name) {
          setUserName(currentUser.full_name)
        } else if (currentUser?.email) {
          setUserName(currentUser.email.split('@')[0])
        }
        
        // Kullanıcı ID'sini sakla
        if (currentUser?.id) {
          setCurrentUserId(currentUser.id)
        }

        // Önce şirket bilgisini al
        const companies = await CompaniesApi.list({ q: '', limit: 1, offset: 0 })
        
        if (companies && companies.length > 0) {
          const companyId = parseInt(companies[0].id)
          // Şirket ID'si ile iş emirlerini listele
          const list = await WorkOrdersApi.list({ 
            company_id: companyId.toString(), 
            sort_by: "created_at", 
            sort_dir: "desc", 
            limit: 50 
          })
          
          // Sadece bu kullanıcıya atanan iş emirlerini filtrele
          if (currentUser?.id) {
            const myWorkOrders = list.filter(wo => wo.assigned_to === currentUser.id)
            setWorkOrders(myWorkOrders)
          } else {
            setWorkOrders(list)
          }
        }
      } catch (e: any) {
        setError(e?.message || "İş emirleri yüklenemedi")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const tabs: Tab[] = useMemo(() => [
    { id: "all", title: "Tümü", count: workOrders.length },
    { id: "pending", title: "Bekleyen", count: workOrders.filter((wo) => wo.status === "pending").length },
    { id: "in_progress", title: "Devam Eden", count: workOrders.filter((wo) => wo.status === "in_progress").length },
    { id: "completed", title: "Tamamlanan", count: workOrders.filter((wo) => wo.status === "completed").length },
  ], [workOrders])

  const getFilteredWorkOrders = (): WorkOrder[] => {
    let filtered = workOrders

    if (selectedTab !== "all") {
      filtered = filtered.filter((wo) => wo.status === selectedTab)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter((wo) => (wo.title || "").toLowerCase().includes(q))
    }

    return filtered
  }

  const getStatusInfo = (status: WorkOrder["status"]): StatusInfo => {
    switch (status) {
      case "pending":
        return { title: "Bekleyen", color: "#F59E0B", icon: "time" }
      case "in_progress":
        return { title: "Devam Eden", color: "#3B82F6", icon: "play-circle" }
      case "completed":
        return { title: "Tamamlandı", color: "#10B981", icon: "checkmark-circle" }
      default:
        return { title: "Bilinmiyor", color: "#9CA3AF", icon: "help-circle" }
    }
  }

  const getPriorityInfo = (): PriorityInfo => {
    // Backend veri modelinde priority yok; status'e göre renk verebiliriz
    return { title: "Normal", color: "#9CA3AF" }
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handleWorkOrderPress = (workOrder: WorkOrder) => {
    // Eğer iş emri zaten devam ediyorsa, direkt detay sayfasına git
    if (workOrder.status === "in_progress" || workOrder.status === "completed") {
      navigation?.navigate("WorkOrderDetail", { workOrderId: workOrder.id })
      return
    }
    
    // Pending durumundaysa onay iste
    setSelectedWorkOrder(workOrder)
    setAlertVisible(true)
  }

  const handleConfirmStart = async () => {
    if (!selectedWorkOrder) return
    
    setAlertVisible(false)
    
    try {
      // İş emrini "in_progress" olarak güncelle
      await WorkOrdersApi.update(selectedWorkOrder.id, {
        status: "in_progress"
      })
      
      // Detay sayfasına yönlendir
      navigation?.navigate("WorkOrderDetail", { workOrderId: selectedWorkOrder.id })
      
      // Listeyi yenile
      const companies = await CompaniesApi.list({ q: '', limit: 1, offset: 0 })
      if (companies && companies.length > 0 && currentUserId) {
        const companyId = parseInt(companies[0].id)
        const list = await WorkOrdersApi.list({ 
          company_id: companyId.toString(), 
          sort_by: "created_at", 
          sort_dir: "desc", 
          limit: 50 
        })
        const myWorkOrders = list.filter(wo => wo.assigned_to === currentUserId)
        setWorkOrders(myWorkOrders)
      }
    } catch (e: any) {
      console.error("İş emri güncellenemedi:", e)
    }
  }

  // İstatistikler - Tek satırda 4 kart (küçük)
  const stats = useMemo(() => [
    { 
      title: "Toplam", 
      value: workOrders.length.toString(), 
      color: "#3B82F6", 
      icon: "document-text" as const,
      bgColor: isDark ? "#1E3A8A20" : "#DBEAFE"
    },
    { 
      title: "Bekleyen", 
      value: workOrders.filter(wo => wo.status === "pending").length.toString(), 
      color: "#F59E0B", 
      icon: "time" as const,
      bgColor: isDark ? "#92400E20" : "#FEF3C7"
    },
    { 
      title: "Devam Eden", 
      value: workOrders.filter(wo => wo.status === "in_progress").length.toString(), 
      color: "#8B5CF6", 
      icon: "play-circle" as const,
      bgColor: isDark ? "#5B21B620" : "#EDE9FE"
    },
    { 
      title: "Tamamlanan", 
      value: workOrders.filter(wo => wo.status === "completed").length.toString(), 
      color: "#10B981", 
      icon: "checkmark-circle" as const,
      bgColor: isDark ? "#065F4620" : "#D1FAE5"
    },
  ], [workOrders, isDark])

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 5,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.headerText,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.headerText,
      opacity: 0.9,
    },
    notificationButton: {
      position: "relative",
    },
    notificationBadge: {
      position: "absolute",
      top: -8,
      right: -8,
      backgroundColor: "#EF4444",
      borderRadius: 8,
      width: 24,
      height: 24,
      justifyContent: "center",
      alignItems: "center",
    },
    notificationBadgeText: {
      color: "#FFFFFF",
      fontSize: 12,
    },
    statsSection: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    statsGrid: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 6,
    },
    statCard: {
      backgroundColor: theme.card,
      borderRadius: 10,
      padding: 8,
      flex: 1,
      flexDirection: "column",
      alignItems: "center",
    },
    statIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 6,
    },
    statInfo: {
      alignItems: "center",
    },
    statValue: {
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 2,
    },
    statTitle: {
      fontSize: 9,
      fontWeight: "500",
      color: theme.textSecondary,
      textAlign: "center",
    },
    searchSection: {
      paddingHorizontal: 20,
      paddingBottom: 12,
    },
    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.surface,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchInput: {
      flex: 1,
      marginLeft: 8,
      fontSize: 14,
      color: theme.text,
    },
    tabsContainer: {
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: theme.background,
    },
    tab: {
      flexDirection: "row",
      alignItems: "center",
      marginRight: 16,
      paddingVertical: 8,
    },
    activeTab: {
      borderBottomWidth: 2,
      borderBottomColor: theme.primary,
    },
    tabText: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    activeTabText: {
      fontWeight: "600",
      color: theme.text,
    },
    tabBadge: {
      marginLeft: 6,
      backgroundColor: theme.surfaceVariant,
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    activeTabBadge: {
      backgroundColor: theme.primary,
    },
    tabBadgeText: {
      fontSize: 11,
      color: theme.textSecondary,
      fontWeight: "600",
    },
    activeTabBadgeText: {
      color: theme.headerText,
    },
    workOrdersList: {
      flex: 1,
      paddingHorizontal: 20,
    },
    workOrderCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    workOrderHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    workOrderTitleSection: {
      flex: 1,
    },
    workOrderTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      lineHeight: 20,
    },
    workOrderCompany: {
      fontSize: 13,
      color: theme.textSecondary,
      marginTop: 2,
    },
    priorityBadge: {
      backgroundColor: "#EF4444",
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },
    priorityBadgeText: {
      fontSize: 11,
      color: "#FFFFFF",
      fontWeight: "600",
    },
    workOrderDetails: {
      marginTop: 12,
    },
    workOrderDetailRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
    },
    workOrderDetailText: {
      fontSize: 13,
      color: theme.textSecondary,
      marginLeft: 6,
    },
    workOrderFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "#F59E0B",
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 3,
    },
    statusBadgeText: {
      fontSize: 11,
      color: "#FFFFFF",
      marginLeft: 4,
      fontWeight: "600",
    },
    actionButton: {
      flexDirection: "row",
      alignItems: "center",
    },
    actionButtonText: {
      fontSize: 13,
      color: "#059669",
      marginRight: 6,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 12,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.textTertiary,
      marginTop: 12,
    },
    emptyStateText: {
      fontSize: 14,
      color: theme.textTertiary,
      marginTop: 6,
      textAlign: "center",
      lineHeight: 18,
    },
  })

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      {/* Header */}
      <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle}>Hoş Geldiniz{userName ? `, ${userName}` : ''}</Text>
                  <Text style={styles.headerSubtitle}>
                    {new Date().toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => navigation?.navigate('Profile')}>
                  <Ionicons name="settings-outline" size={28} color={theme.headerText} />
                </TouchableOpacity>
              </View>
            </View>

      {/* İstatistikler */}
      <View style={styles.statsSection}>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: stat.bgColor }]}>
                <Ionicons name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Arama */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.textTertiary} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="İş emri ara..."
            placeholderTextColor={theme.textTertiary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={theme.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, selectedTab === tab.id && styles.activeTab]}
              onPress={() => setSelectedTab(tab.id)}
            >
              <Text style={[styles.tabText, selectedTab === tab.id && styles.activeTabText]}>{tab.title}</Text>
              <View style={[styles.tabBadge, selectedTab === tab.id && styles.activeTabBadge]}>
                <Text style={[styles.tabBadgeText, selectedTab === tab.id && styles.activeTabBadgeText]}>
                  {tab.count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Work Orders List */}
      <ScrollView style={styles.workOrdersList} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.emptyState}>
            <Ionicons name="refresh" size={32} color={theme.textTertiary} />
            <Text style={styles.emptyStateText}>Yükleniyor...</Text>
          </View>
        )}
        {!!error && !loading && (
          <View style={styles.emptyState}>
            <Ionicons name="warning-outline" size={32} color={theme.error} />
            <Text style={styles.emptyStateTitle}>Hata</Text>
            <Text style={styles.emptyStateText}>{error}</Text>
          </View>
        )}
        {getFilteredWorkOrders().map((workOrder) => {
          const statusInfo = getStatusInfo(workOrder.status)
          const priorityInfo = getPriorityInfo()

          return (
            <TouchableOpacity key={workOrder.id} style={styles.workOrderCard} onPress={() => handleWorkOrderPress(workOrder)}>
              <View style={styles.workOrderHeader}>
                <View style={styles.workOrderTitleSection}>
                  <Text style={styles.workOrderTitle}>{workOrder.title}</Text>
                  {!!workOrder.company_id && (
                    <Text style={styles.workOrderCompany}>İletişim: {workOrder.customer_company_phone}</Text>
                  )}
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: priorityInfo.color }]}> 
                  <Text style={styles.priorityBadgeText}>{priorityInfo.title}</Text>
                </View>
              </View>

              <View style={styles.workOrderDetails}>
                <View style={styles.workOrderDetailRow}>
                  <Ionicons name="person-outline" size={14} color="#6B7280" />
                  <Text style={styles.workOrderDetailText}>Müşteri: {workOrder.customer_authorized_person}</Text>
                </View>
                <View style={styles.workOrderDetailRow}>
                  <Ionicons name="location-outline" size={14} color="#6B7280" />
                  <Text style={styles.workOrderDetailText}>Adres: {workOrder.customer_company_address || "-"}</Text>
                </View>
                <View style={styles.workOrderDetailRow}>
                  <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                  <Text style={styles.workOrderDetailText}>Oluşturma: {formatDate(workOrder.created_at)}</Text>
                </View>
              </View>

              <View style={styles.workOrderFooter}>
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                  <Ionicons name={statusInfo.icon} size={14} color="#FFFFFF" />
                  <Text style={styles.statusBadgeText}>{statusInfo.title}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )
        })}

        {getFilteredWorkOrders().length === 0 && !loading && !error && (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color={theme.textTertiary} />
            <Text style={styles.emptyStateTitle}>İş emri bulunamadı</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? "Arama kriterlerinize uygun iş emri bulunamadı."
                : "Bu kategoride henüz iş emri bulunmuyor."}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Confirm Alert */}
      <CustomAlert
        visible={alertVisible}
        title="İş Emrine Başla"
        message="İş emrine başlamak istediğinize emin misiniz? Onayladığınızda iş emri durumu devam ediyor olarak değişecektir."
        type="warning"
        onConfirm={handleConfirmStart}
        onCancel={() => setAlertVisible(false)}
        confirmText="Evet"
        cancelText="Hayır"
        showCancel={true}
      />
    </SafeAreaView>
  )
}

export default EmployeeHomeScreen
