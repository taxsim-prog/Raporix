"use client"

import React, { useEffect, useState } from "react"
import { View, Text, StyleSheet, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import WorkOrdersApi, { WorkOrderOut } from "../../api/workOrders"
import { useTheme } from "../../theme/ThemeContext"
import CustomAlert from "../../components/CustomAlert"

type WorkOrderDetail = WorkOrderOut

interface ReportType {
  id: number
  name: string
  count: number
  icon: string
  color: string
}

interface WorkOrderDetailScreenProps {
  navigation?: any
  route?: {
    params: {
      workOrderId: number
    }
  }
}

const WorkOrderDetailScreen: React.FC<WorkOrderDetailScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme()
  const [workOrderDetail, setWorkOrderDetail] = useState<WorkOrderDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completing, setCompleting] = useState(false)
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
  }>({ title: '', message: '', type: 'info' })

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config);
    setAlertVisible(true);
  };

  useEffect(() => {
    const load = async () => {
      const idParam = route?.params?.workOrderId
      if (!idParam) return
      setLoading(true)
      setError(null)
      try {
        const data = await WorkOrdersApi.get(String(idParam))
        console.log('[WorkOrderDetail] Loaded data:', JSON.stringify(data, null, 2))
        setWorkOrderDetail(data)
      } catch (e: any) {
        console.error('[WorkOrderDetail] Error:', e)
        setError(e?.message || "Detay yüklenemedi")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [route?.params?.workOrderId])

  // Rapor türleri konfigürasyonu
  const reportTypeConfig: Record<string, { id: number; icon: string; color: string }> = {
    'Gözle Kontrol': { id: 1, icon: 'eye', color: '#059669' },
    'Topraklama': { id: 2, icon: 'flash', color: '#F59E0B' },
    'Yıldırımdan Korunma Tesisatı': { id: 3, icon: 'thunderstorm', color: '#8B5CF6' },
    'Jeneratör': { id: 4, icon: 'hardware-chip', color: '#EF4444' },
    'Yangın Algılama': { id: 5, icon: 'flame', color: '#DC2626' },
  };

  // İş emrinin tasks'larına göre dinamik rapor türleri oluştur
  const reportTypes: ReportType[] = (workOrderDetail?.tasks || [])
    .filter(task => reportTypeConfig[task.task_name])
    .map(task => ({
      id: reportTypeConfig[task.task_name].id,
      name: task.task_name,
      count: task.quantity,
      icon: reportTypeConfig[task.task_name].icon,
      color: reportTypeConfig[task.task_name].color,
    }));

  const getPriorityInfo = () => ({ title: "Normal", color: "#9CA3AF" })

  const getStatusInfo = (status: WorkOrderDetail["status"]) => {
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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      weekday: "long",
    })
  }

  // İş emri tamamlandı mı kontrol et
  const isCompleted = workOrderDetail?.status === 'completed';

  // Genel Bilgiler alanına tıklama fonksiyonu
  const handleGeneralInfoPress = () => {
    if (!workOrderDetail || isCompleted) return
    navigation?.navigate("ReportGeneralInfo", { workOrderId: workOrderDetail.id })
  }

  // Ana pano alanına tıklama fonksiyonu
  const handleMainPanelPress = () => {
    if (!workOrderDetail || isCompleted) return
    navigation?.navigate("MainPanelControl", { workOrderId: workOrderDetail.id })
  }

  const priorityInfo = getPriorityInfo()
  const statusInfo = workOrderDetail ? getStatusInfo(workOrderDetail.status) : { title: "-", color: "#9CA3AF", icon: "help-circle" }

  React.useLayoutEffect(() => {
    navigation?.setOptions({
      title: "İş Emri Detayı",
      headerStyle: { backgroundColor: theme.headerBackground },
      headerTintColor: theme.headerText,
      headerTitleStyle: { fontSize: 16, fontWeight: "bold" },
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => navigation?.navigate("WorkOrders")}
          style={{ padding: 8, marginLeft: 4 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.headerText} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme]);

  const handleReportTypePress = async (reportType: ReportType) => {
    if (!route?.params?.workOrderId) return;

    try {
      // İlgili form verilerini yükle
      const FormsApi = (await import('../../api/forms')).default;
      let formName = '';
      
      switch (reportType.id) {
        case 2:
          formName = 'grounding';
          break;
        case 3:
          formName = 'lightning_protection';
          break;
        case 4:
          formName = 'generator';
          break;
        case 5:
          formName = 'fire_detection';
          break;
        default:
          formName = '';
      }

      let existingFormData = null;
      
      if (formName) {
        try {
          const forms = await FormsApi.list({
            work_order_id: route.params.workOrderId,
            form_name: formName,
          });
          
          if (forms && forms.length > 0) {
            existingFormData = forms[0];
            console.log(`[WorkOrderDetail] Loaded ${formName} form:`, existingFormData);
          }
        } catch (error) {
          console.log(`[WorkOrderDetail] No existing ${formName} form found`);
        }
      }

      // Navigate with data
      if (reportType.id === 2) {
        navigation.navigate("GroundingNavigator", {
          workOrderId: route.params.workOrderId,
          reportData: existingFormData?.data || null,
        });
      } else if (reportType.id === 3) {
        navigation.navigate("LightningProtectionNavigator", {
          workOrderId: route.params.workOrderId,
          reportData: existingFormData?.data || null,
        });
      } else if (reportType.id === 4) {
        navigation.navigate("GeneratorNavigator", {
          workOrderId: route.params.workOrderId,
          reportData: existingFormData?.data || null,
        });
      } else if (reportType.id === 5) {
        navigation.navigate("FireDetectionNavigator", {
          workOrderId: route.params.workOrderId,
          reportData: existingFormData?.data || null,
        });
      } else {
        // Gözle Kontrol için PanelList'e git
        navigation.navigate("PanelList", {
          workOrderId: route.params.workOrderId,
          reportTypeId: reportType.id,
        });
      }
    } catch (error) {
      console.error('[WorkOrderDetail] Error loading form data:', error);
      showAlert({
        title: 'Hata',
        message: 'Form verileri yüklenirken hata oluştu',
        type: 'error',
      });
    }
  }

  const handleCompleteWorkOrder = async () => {
    showAlert({
      title: 'İş Emrini Tamamla',
      message: 'Bu iş emrini tamamlamak istediğinize emin misiniz? Bu işlem geri alınamaz.',
      type: 'warning',
      onConfirm: async () => {
        setCompleting(true);
        try {
          await WorkOrdersApi.update(String(route?.params?.workOrderId), {
            status: 'completed',
          });

          showAlert({
            title: 'Başarılı',
            message: 'İş emri başarıyla tamamlandı!',
            type: 'success',
            onConfirm: () => {
              // Detayları yeniden yükle
              const load = async () => {
                try {
                  const data = await WorkOrdersApi.get(String(route?.params?.workOrderId));
                  setWorkOrderDetail(data);
                } catch (e: any) {
                  console.error('[WorkOrderDetail] Reload error:', e);
                }
              };
              load();
            },
          });
        } catch (e: any) {
          console.error('[WorkOrderDetail] Complete error:', e);
          showAlert({
            title: 'Hata',
            message: e?.message || 'İş emri tamamlanırken hata oluştu',
            type: 'error',
          });
        } finally {
          setCompleting(false);
        }
      },
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    infoCard: {
      backgroundColor: theme.card,
      margin: 16,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
    },
    cardHeader: {
      marginBottom: 16,
    },
    titleSection: {
      marginBottom: 12,
    },
    workOrderTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    companyName: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    badgesSection: {
      flexDirection: "row",
      gap: 6,
    },
    priorityBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 16,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 16,
      gap: 4,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    detailsSection: {
      gap: 10,
    },
    detailRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    detailText: {
      fontSize: 13,
      color: theme.text,
      flex: 1,
      lineHeight: 16,
    },
    section: {
      marginHorizontal: 16,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 10,
      letterSpacing: 0.3,
    },
    descriptionCard: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    descriptionText: {
      fontSize: 13,
      color: theme.text,
      lineHeight: 18,
    },
    reportTypesContainer: {
      gap: 10,
    },
    reportTypeCard: {
      backgroundColor: theme.card,
      borderRadius: 8,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.border,
    },
    reportTypeIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    reportTypeInfo: {
      flex: 1,
    },
    reportTypeName: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 2,
      lineHeight: 18,
    },
    reportTypeCount: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    generalInfoCard: {
      backgroundColor: theme.card,
      borderRadius: 8,
      marginHorizontal: 16,
      marginBottom: 20,
      padding: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: theme.border,
    },
    generalInfoContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    generalInfoText: {
      fontSize: 14,
      fontWeight: "600",
      color: theme.primary,
    },
    disabledCard: {
      opacity: 0.5,
    },
    disabledText: {
      color: theme.textSecondary,
    },
    completeButton: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    completeButtonText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    completedBadge: {
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    completedBadgeText: {
      fontSize: 14,
      fontWeight: "600",
      color: "#FFFFFF",
    },
  })

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={styles.infoCard}><Text style={{ color: theme.text }}>Yükleniyor...</Text></View>
        )}
        {!!error && !loading && (
          <View style={styles.infoCard}><Text style={{ color: theme.error }}>{error}</Text></View>
        )}
        {/* Work Order Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <View style={styles.titleSection}>
              <Text style={styles.workOrderTitle}>{workOrderDetail?.title || '-'}</Text>
              {!!workOrderDetail?.company_id && <Text style={styles.companyName}>İletişim: {workOrderDetail.customer_company_phone}</Text>}
            </View>
            <View style={styles.badgesSection}>
              <View style={[styles.priorityBadge, { backgroundColor: priorityInfo.color }]}>
                <Text style={styles.badgeText}>{priorityInfo.title}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
                <Ionicons name={statusInfo.icon} size={12} color="#FFFFFF" />
                <Text style={styles.badgeText}>{statusInfo.title}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Ionicons name="person-outline" size={16} color={theme.textSecondary} />
              <Text style={styles.detailText}>Müşteri: {workOrderDetail?.customer_authorized_person || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={16} color={theme.textSecondary} />
              <Text style={styles.detailText}>Adres: {workOrderDetail?.customer_company_address || '-'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
              {!!workOrderDetail?.created_at && (
                <Text style={styles.detailText}>Oluşturma: {formatDate(workOrderDetail.created_at)}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Açıklama</Text>
          <View style={styles.descriptionCard}>
            {workOrderDetail?.isg_katip_id && (
              <Text style={styles.descriptionText}>ISG Katip ID: {workOrderDetail.isg_katip_id}</Text>
            )}
            {!workOrderDetail?.isg_katip_id && !workOrderDetail?.description && (
              <Text style={styles.descriptionText}>-</Text>
            )}
          </View>
        </View>

        {/* Genel Bilgiler alanı */}
        <TouchableOpacity
          style={[styles.generalInfoCard, isCompleted && styles.disabledCard]}
          onPress={handleGeneralInfoPress}
          disabled={isCompleted}
        >
          <View style={styles.generalInfoContent}>
            <Ionicons
              name="document-text-outline"
              size={20}
              color={isCompleted ? theme.textSecondary : theme.primary}
            />
            <Text style={[styles.generalInfoText, isCompleted && styles.disabledText]}>
              Genel Bilgiler
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        {/* Ana Pano alanı */}
        <TouchableOpacity
          style={[styles.generalInfoCard, isCompleted && styles.disabledCard]}
          onPress={handleMainPanelPress}
          disabled={isCompleted}
        >
          <View style={styles.generalInfoContent}>
            <Ionicons
              name="easel"
              size={20}
              color={isCompleted ? theme.textSecondary : theme.primary}
            />
            <Text style={[styles.generalInfoText, isCompleted && styles.disabledText]}>
              Ana Pano
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={theme.textSecondary}
          />
        </TouchableOpacity>

        {/* Report Types */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Yapılacak Kontroller</Text>
          <View style={styles.reportTypesContainer}>
            {reportTypes.map((reportType) => (
              <TouchableOpacity
                key={reportType.id}
                onPress={() => handleReportTypePress(reportType)}
                disabled={isCompleted}
                style={isCompleted && styles.disabledCard}
              >
                <View style={styles.reportTypeCard}>
                  <View style={[styles.reportTypeIcon, { backgroundColor: isCompleted ? theme.textSecondary : reportType.color }]}>
                    <Ionicons name={reportType.icon} size={18} color="#FFFFFF" />
                  </View>
                  <View style={styles.reportTypeInfo}>
                    <Text style={[styles.reportTypeName, isCompleted && styles.disabledText]}>{reportType.name}</Text>
                    <Text style={[styles.reportTypeCount, isCompleted && styles.disabledText]}>{reportType.count} Adet</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* İş Emrini Tamamla Butonu */}
        {workOrderDetail && workOrderDetail.status !== 'completed' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.completeButton, { backgroundColor: theme.primary }]}
              onPress={handleCompleteWorkOrder}
              disabled={completing}
            >
              {completing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-done-circle" size={24} color="#FFFFFF" />
                  <Text style={styles.completeButtonText}>İş Emrini Tamamla</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {workOrderDetail && workOrderDetail.status === 'completed' && (
          <View style={styles.section}>
            <View style={[styles.completedBadge, { backgroundColor: '#10B981' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.completedBadgeText}>Bu iş emri tamamlanmıştır</Text>
            </View>
          </View>
        )}
      </ScrollView>

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          setAlertVisible(false);
          alertConfig.onConfirm?.();
        }}
        onCancel={() => setAlertVisible(false)}
        showCancel={alertConfig.type === 'warning'}
        confirmText={alertConfig.type === 'warning' ? 'Evet, Tamamla' : 'Tamam'}
        cancelText="İptal"
      />
    </SafeAreaView>
  )
}

export default WorkOrderDetailScreen
