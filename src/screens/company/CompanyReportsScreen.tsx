"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, Modal, ActivityIndicator, TextInput, Linking } from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import ReportsApi, { ReportOut } from "../../api/reports"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "../../theme/ThemeContext"
import { useFocusEffect } from "@react-navigation/native"
import CompaniesApi from "../../api/companies"
import CustomAlert from "../../components/CustomAlert"

interface NavigationProp {
  goBack: () => void;
  navigate: (screen: string, params?: any) => void;
}

const CompanyReportsScreen = ({ navigation }: { navigation: NavigationProp }) => {
  const { theme, isDark } = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [reports, setReports] = useState<ReportOut[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<number | null>(null)
  const [selectedReport, setSelectedReport] = useState<ReportOut | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [convertingToPDF, setConvertingToPDF] = useState(false)
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

  const showAlert = (config: typeof alertConfig) => {
    setAlertConfig(config)
    setAlertVisible(true)
  }

  const loadReports = async () => {
    setLoading(true)
    setError(null)
    try {
      // Şirket ID'sini al
      const companies = await CompaniesApi.list({ q: '', limit: 1, offset: 0 })
      if (!companies || companies.length === 0) {
        setError('Şirket bilgisi bulunamadı')
        return
      }
      
      const fetchedCompanyId = parseInt(companies[0].id)
      setCompanyId(fetchedCompanyId)
      
      // Tüm raporları al ve company_id'ye göre filtrele
      const list = await ReportsApi.list()
      const filteredList = list.filter(r => r.company_id === String(fetchedCompanyId))
      setReports(filteredList)
    } catch (e: any) {
      setError(e?.message || 'Raporlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadReports()
    }, [])
  )

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })

  const handleReportPress = (report: ReportOut) => {
    setSelectedReport(report)
    setShowActionModal(true)
  }

  const handleEdit = () => {
    setShowActionModal(false)
    // TODO: Düzenleme sayfasına yönlendir
    showAlert({
      title: 'Bilgi',
      message: 'Rapor düzenleme özelliği yakında eklenecek.',
      type: 'info',
    })
  }

  const handleDelete = () => {
    if (!selectedReport) return
    setShowActionModal(false)
    
    showAlert({
      title: 'Raporu Sil',
      message: `${selectedReport.title} adlı raporu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`,
      type: 'warning',
      showCancel: true,
      confirmText: 'Sil',
      cancelText: 'İptal',
      onConfirm: async () => {
        setDeleting(true)
        try {
          await ReportsApi.delete(selectedReport.id)
          setReports(prev => prev.filter(r => r.id !== selectedReport.id))
          setSelectedReport(null)
          
          showAlert({
            title: 'Başarılı',
            message: 'Rapor başarıyla silindi.',
            type: 'success',
          })
        } catch (error: any) {
          console.error('[CompanyReportsScreen] Silme hatası:', error)
          showAlert({
            title: 'Hata',
            message: error?.message || 'Rapor silinirken bir hata oluştu.',
            type: 'error',
          })
        } finally {
          setDeleting(false)
        }
      },
    })
  }

  const openPDF = (pdfUrl: string, pdfTitle: string) => {
    // Demo: Şimdilik assets içindeki video.pdf'i her durumda önizleme olarak açıyoruz
    console.log('[CompanyReportsScreen] Opening demo PDF preview for:', pdfTitle);
    
    // PDF viewer ekranına yönlendir
    navigation.navigate('PDFViewer', {
      pdfTitle: pdfTitle,
      useLocalAsset: true,
    })
  }

  const handleConvertToPDF = async () => {
    if (!selectedReport) return
    
    setShowActionModal(false)
    setConvertingToPDF(true)
    
    try {
      // Backend'den PDF oluştur
      const response = await ReportsApi.convertToPDF(selectedReport.id)
      
      console.log('[CompanyReportsScreen] PDF Response:', response)
      console.log('[CompanyReportsScreen] PDF URL:', response.pdf_url)
      console.log('[CompanyReportsScreen] PDF Filename:', response.pdf_filename)
      
      if (response.success && response.pdf_url) {
        // Rapor listesini güncelle - PDF bilgilerini ekle
        setReports(prevReports => 
          prevReports.map(r => 
            r.id === selectedReport.id 
              ? { 
                  ...r, 
                  pdf_url: response.pdf_url, 
                  pdf_filename: response.pdf_filename,
                  is_converted_to_pdf: true 
                }
              : r
          )
        )
        
        // Eğer daha önce oluşturulmuşsa bilgi ver
        const message = response.already_converted 
          ? `PDF zaten oluşturulmuş!\n\nDosya: ${response.pdf_filename}`
          : `PDF başarıyla oluşturuldu!\n\nDosya: ${response.pdf_filename}`;
        
        showAlert({
          title: 'Başarılı!',
          message: message,
          type: 'success',
          confirmText: 'PDF\'i Aç',
          showCancel: true,
          cancelText: 'Kapat',
          onConfirm: () => {
            openPDF(response.pdf_url, selectedReport.title)
          },
        })
      } else {
        throw new Error('PDF oluşturulamadı')
      }
    } catch (error: any) {
      console.error('[CompanyReportsScreen] PDF dönüştürme hatası:', error)
      showAlert({
        title: 'Hata',
        message: error?.message || 'PDF dönüştürme sırasında bir hata oluştu.',
        type: 'error',
      })
    } finally {
      setConvertingToPDF(false)
    }
  }

  // Arama filtresi
  const filteredReports = useMemo(() => {
    if (!searchQuery.trim()) return reports
    
    const query = searchQuery.toLowerCase()
    return reports.filter(report => 
      report.title.toLowerCase().includes(query) ||
      (report.description && report.description.toLowerCase().includes(query))
    )
  }, [reports, searchQuery])

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: theme.headerBackground,
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
      color: theme.headerText,
      flex: 1,
      textAlign: "center",
      paddingRight: 40,
    },
    settingsButton: {
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
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.card,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 16,
      color: theme.text,
      marginLeft: 12,
    },
    section: {
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    sectionHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: theme.text,
    },
    generateButton: {
      backgroundColor: theme.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      flexDirection: "row",
      alignItems: "center",
    },
    generateButtonText: {
      color: theme.headerText,
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 4,
    },
    reportsContainer: {
      backgroundColor: theme.card,
      borderRadius: 12,
      overflow: "hidden",
    },
    reportCard: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    reportIcon: {
      width: 48,
      height: 48,
      backgroundColor: isDark ? theme.surfaceVariant : "#F0FDF4",
      borderRadius: 8,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },
    reportInfo: {
      flex: 1,
    },
    reportTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: theme.text,
      marginBottom: 4,
    },
    reportDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 4,
    },
    reportDetails: {
      fontSize: 12,
      color: theme.textTertiary,
    },
    reportActions: {
      alignItems: "flex-end",
    },
    reportStatus: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginBottom: 8,
    },
    reportStatusText: {
      fontSize: 12,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    downloadButton: {
      padding: 4,
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
      padding: 20,
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={theme.headerText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Şirket Raporları</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Rapor ara..."
              placeholderTextColor={theme.inputPlaceholder}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Reports List */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Raporlar</Text>
          </View>

          <View style={styles.reportsContainer}>
            {loading && (
              <View style={[styles.reportCard, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ color: theme.text, marginTop: 12 }}>Yükleniyor...</Text>
              </View>
            )}
            {!!error && !loading && (
              <View style={styles.reportCard}>
                <Text style={{ color: theme.error }}>{error}</Text>
              </View>
            )}
            {!loading && !error && filteredReports.length === 0 && (
              <View style={[styles.reportCard, { justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }]}>
                <Ionicons name="document-text-outline" size={48} color={theme.textTertiary} />
                <Text style={{ color: theme.textSecondary, marginTop: 12, fontSize: 16 }}>
                  {searchQuery ? 'Arama sonuç bulunamadı' : 'Henüz rapor oluşturulmamış'}
                </Text>
              </View>
            )}
            {!loading && !error && filteredReports.length > 0 && filteredReports.map((report) => (
              <TouchableOpacity 
                key={report.id} 
                style={styles.reportCard}
                onPress={() => handleReportPress(report)}
              >
                <View style={styles.reportIcon}>
                  <Ionicons 
                    name={report.is_converted_to_pdf ? "document-text" : "document-outline"} 
                    size={20} 
                    color={report.is_converted_to_pdf ? theme.primary : theme.textSecondary} 
                  />
                </View>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  {!!report.description && <Text style={styles.reportDescription}>{report.description}</Text>}
                  <Text style={styles.reportDetails}>
                    {formatDate(report.created_at)} • {(report.type || '').toUpperCase()} • {report.is_converted_to_pdf ? 'PDF Hazır' : 'PDF Yok'}
                  </Text>
                </View>
                <View style={styles.reportActions}>
                  <View
                    style={[
                      styles.reportStatus,
                      { backgroundColor: report.is_converted_to_pdf ? "#10B981" : "#F59E0B" },
                    ]}
                  >
                    <Text style={styles.reportStatusText}>
                      {report.is_converted_to_pdf ? "PDF Hazır" : "PDF Yok"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
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
              <Text style={[styles.actionModalTitle, { color: theme.text }]}>Rapor İşlemleri</Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionModalBody}>
              {/* PDF Görüntüle veya Dönüştür Butonu */}
              {selectedReport?.is_converted_to_pdf && selectedReport?.pdf_url ? (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={() => {
                    setShowActionModal(false)
                    openPDF(selectedReport.pdf_url!, selectedReport.title)
                  }}
                >
                  <Ionicons name="eye-outline" size={22} color={theme.primary} />
                  <Text style={[styles.actionButtonText, { color: theme.text }]}>PDF'i Görüntüle</Text>
                  <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                  onPress={handleConvertToPDF}
                  disabled={convertingToPDF}
                >
                  {convertingToPDF ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (
                    <>
                      <Ionicons name="document-attach-outline" size={22} color={theme.primary} />
                      <Text style={[styles.actionButtonText, { color: theme.text }]}>PDF'e Dönüştür</Text>
                      <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Düzenle Butonu */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={handleEdit}
              >
                <Ionicons name="create-outline" size={22} color={theme.primary} />
                <Text style={[styles.actionButtonText, { color: theme.text }]}>Düzenle</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </TouchableOpacity>

              {/* Sil Butonu */}
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

      {/* Custom Alert */}
      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          setAlertVisible(false)
          alertConfig.onConfirm?.()
        }}
        onCancel={() => setAlertVisible(false)}
        showCancel={alertConfig.showCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
      />
    </SafeAreaView>
  )
}


export default CompanyReportsScreen
