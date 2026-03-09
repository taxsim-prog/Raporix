// Hazır pano hata listesi
export const PANEL_ERROR_LIST = [
  { code: 'A001', description: 'Topraklama hattı tesis edilmelidir.' },
  { code: 'A002', description: 'Topraklama hattı pano gövdesiyle irtibatlandırılmalıdır.' },
  { code: 'A003', description: 'Pano kapağı topraklama hattı ile irtibatlandırılmalıdır.' },
  { code: 'A004', description: 'Pano saçı topraklama hattı ile irtibatlandırılmalıdır. (Gövdesi metal olmayan pano: plastik)' },
  { code: 'A005', description: 'Toprak ve nötr hatları ayrı olarak tesis edilmelidir.' },
  { code: 'A006', description: 'Topraklama direnç değeri iyileştirilmelidir.' },
  { code: 'A007', description: 'Topraklama barası oluşturulmalıdır.' },
  { code: 'A008', description: 'Nötr hattı pano gövdesinden izole olmalıdır.' },
  { code: 'A009', description: 'Topraklama hattı Pano kapağı ile irtibatlandırılmalıdır.' },
  { code: 'A010', description: 'Kabloların sigorta bağlantılarında kablo yüksükleri veya kablo pabuçları kullanılmalıdır.' },
  { code: 'A011', description: 'Ucu açık kablolar izole edilmelidir.' },
  { code: 'A012', description: 'Bara bağlantıları pabuç kullanılarak yapılmalıdır.' },
  { code: 'A013', description: 'Sigorta barasının kenarları izole edilmelidir.' },
  { code: 'A014', description: 'Sigorta barası, iletkenlere temas edilemeyecek şekilde tümüyle izole edilmelidir.' },
  { code: 'A015', description: 'Sabit kabloların ek bağlantıları klemenste yapılmalı ve klemens sabitlenmelidir.' },
  { code: 'A016', description: 'Ucu izole edilmiş boşta duran kablolar klemensle panoya sabitlenmelidir.' },
  { code: 'A017', description: 'Askıda bulunan klemens panoya sabitlenmelidir.' },
  { code: 'A018', description: 'Nötr dağıtımı kablolar burularak değil klemens veya bara vasıtası ile yapılmalıdır.' },
  { code: 'A019', description: 'Pano kapağı kilitlenebilir olmalıdır.' },
  { code: 'A020', description: 'Eksik olan pano kapağı tamamlanmalıdır.' },
  { code: 'A021', description: 'Faz baralarının önlerinde koruyucu kapak veya pleksi kullanılmalıdır.' },
  { code: 'A022', description: 'Eksik olan pano iç kapakları tamamlanmalı veya faz baralarının önlerinde koruyucu kapak veya fleksi kullanılmalıdır' },
  { code: 'A023', description: 'Pano iç kapağında eksik olan kelebekler tamamlanmalıdır.' },
  { code: 'A024', description: 'TMŞ önüne  koruyucu kapak veya fleksi kullanılmalıdır.' },
  { code: 'A025', description: 'Pano kapağında tek hat şemaları ve ayrıntılı bilgiler bulunmalıdır.' },
  { code: 'A026', description: 'Pano kapağında kişileri elektriksel tehlikelere karşı uyaracak tehlike ve uyarı işaretleri bulunmalıdır.' },
  { code: 'A027', description: 'Elektrik dağıtım panolarında sigorta, şalter, röleler vs. kontrol ettiği nokta veya noktaları açıklayacak şekilde etiketlendirilme yapılmalıdır.' },
  { code: 'A028', description: 'Panoda eksik olan etiketlemeler tamamlanmalıdır.' },
  { code: 'A029', description: 'Tesis panolarında kabloların renk kodlamasına uyulmalıdır. (Nötr: Mavi, Toprak: Sarı-Yeşil) Faz bağlantıları bu iki renklendirme harici bir renkle yapılmalıdır.' },
  { code: 'A030', description: 'Deprem etkilerine önlem olarak pano sabitlenmelidir.' },
  { code: 'A031', description: 'Pano önünde çalışma esnasında, standartlara uygun (kol mesafesini sağlayan) izolasyon paspası kullanılmalıdır.' },
  { code: 'A032', description: 'Pano önünde kullanılan paspas yetersizdir, standartlara uygun (kol mesafesini sağlayan) izolasyon paspası kullanılmalıdır.' },
  { code: 'A033', description: 'Mevcut bulunan paspas tehlikeli bir durumun oluşmaması için pano önüne konulmalıdır.' },
  { code: 'A034', description: 'PVC izolasyonu deforme olan kablolar yenilenmelidir.' },
  { code: 'A035', description: 'Pano ulaşılabilir bir noktada konumlandırılmalıdır.' },
  { code: 'A036', description: 'Panoya gelen faz baralarının elektriksel olmayan tesislere yaklaşması engellenmelidir.' },
  { code: 'A037', description: 'Termal inceleme raporunda belirtilen uyarılar dikkate alınmalıdır.' },
  { code: 'A038', description: 'Pano içerisinde ilgisiz malzeme bulunmamalıdır.' },
  { code: 'A039', description: 'Pano önünde ilgisiz malzeme bulunmamalıdır.' },
  { code: 'A040', description: 'Panoya ön kapağından giren kablo  mekanik korumayı ve kablo yol uygunluğunu bozmaktadır. Bu kablo pano altındaki  kanaldan  geçirilerek pano ile irtibatlandırılmalıdır.' },
  { code: 'A041', description: 'Kablo yollarını uygunluğunu bozan saçaklı kablolar, kablo kanalı kullanılarak ilgili sigortalara taşınmalıdır.' },
  { code: 'A042', description: 'Bara ve sigortalardaki kesik kablo parçaları temizlenmelidir' },
  { code: 'A043', description: 'Panoya üstten giren kablo grubu  mekanik korumayı ve kablo yol uygunluğunu bozmaktadır. Bu kablo grubu kanaldan  geçirilerek ilgili sigortalara taşınmalıdır.' },
  { code: 'A044', description: 'Tozlu ortamdan dolayı mevcut pano, uygun IP kodlu (IP5X ve ya IP6X) pano ile değiştirilmelidir' },
  { code: 'A045', description: 'Pano alt kısmında, kablo yol uygunluğunu bozan saçaklı kablolar kablo kanalı kullanılarak ilgili sigortalara taşınmalıdır.' },
  { code: 'A046', description: 'Ortam sıcaklığının düşürülmesi gerekmektedir. Havalandırma klima vb. kullanılmalıdır.' },
  { code: 'A047', description: 'Ortam nemli ve rutubetlidir. Pano izole edilmelidir.' },
  { code: 'A048', description: 'Artık akım koruma düzeneği (kaçak akım rölesi) devre dışı bırakılmamalıdır.' },
  { code: 'A049', description: 'Uygun değerde artık akım koruma düzeneği (kaçak akım rölesi) kullanılmalıdır.' },
  { code: 'A050', description: 'Arızalı olan artık akım koruma düzeneği (kaçak akım rölesi) değiştirilmelidir.' },
  { code: 'A051', description: 'Arızalı parafudrlar değiştirilmelidir.' },
  { code: 'A052', description: 'Oda prizinde voltaj yok.' },
  { code: 'A053', description: 'Oda priz topraklaması düzenlenmelidir.' },
  { code: 'A054', description: 'Bara ve şalter gözlerinde perde sacı haricinde dış kapak kullanılmalıdır.' },
  { code: 'A055', description: 'Panonun gözle kontrol kriterleri kapsamında uygun olduğu tespit edilmiştir.' },
];
"use client"

import React, { useState, useLayoutEffect, useEffect } from "react"
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native"
import Ionicons from "react-native-vector-icons/Ionicons"
import { useTheme } from "../../theme/ThemeContext"
import PanolarApi, { PanoOut } from "../../api/panolar"
import FormsApi from "../../api/forms"
import CustomAlert from "../../components/CustomAlert"

interface Panel {
  id: string
  name: string
  description?: string
  location?: string
  lastInspection?: string
}

interface AlertConfig {
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  onConfirm?: () => void
  showCancel?: boolean
  confirmText?: string
  cancelText?: string
}

interface PanelListScreenProps {
  navigation?: any
  route?: {
    params: {
      workOrderId: number
      reportTypeId: number
    }
  }
}

const PanelListScreen: React.FC<PanelListScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme()
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [newPanelName, setNewPanelName] = useState("")
  const [newPanelDescription, setNewPanelDescription] = useState("")
  const [newPanelLocation, setNewPanelLocation] = useState("")
  const [panels, setPanels] = useState<PanoOut[]>([])
  const [formId, setFormId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [alertVisible, setAlertVisible] = useState(false)
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    title: '',
    message: '',
    type: 'info',
  })
  const [deleting, setDeleting] = useState(false)
  const [adding, setAdding] = useState(false)

  // Form ID'yi work_order_id'den bul
  useEffect(() => {
    const loadForm = async () => {
      const workOrderId = route?.params?.workOrderId
      if (!workOrderId) return

      try {
        // Work order'a ait "Genel Bilgiler" formunu bul
        const forms = await FormsApi.list({ 
          form_name: 'general_info',
          work_order_id: workOrderId 
        })
        console.log("forms", forms)
        if (forms && forms.length > 0) {
          setFormId(forms[0].id)
        }
      } catch (e: any) {
        console.error('[PanelListScreen] Form yükleme hatası:', e)
      }
    }
    loadForm()
  }, [route?.params?.workOrderId])

  // Panoları yükle
  useEffect(() => {
    if (formId) {
      loadPanels()
    }
  }, [formId])

  const loadPanels = async () => {
    if (!formId) return
    
    setLoading(true)
    setError(null)
    try {
      const data = await PanolarApi.list(formId)
      // Panoları oluşturulma tarihine göre sırala (en eski üstte, en yeni altta)
      const sortedPanels = data.sort((a: PanoOut, b: PanoOut) => {
        const dateA = new Date(a.created_at || 0).getTime()
        const dateB = new Date(b.created_at || 0).getTime()
        return dateA - dateB
      })
      setPanels(sortedPanels)
      console.log('[PanelListScreen] Panolar sıralandı:', sortedPanels.length)
    } catch (e: any) {
      console.error('[PanelListScreen] Pano yükleme hatası:', e)
      setError(e?.message || 'Panolar yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const showAlert = (config: AlertConfig) => {
    setAlertConfig(config)
    setAlertVisible(true)
  }

  React.useLayoutEffect(() => {
    navigation?.setOptions({
      title: "Pano Listesi",
      headerStyle: { backgroundColor: theme.headerBackground },
      headerTintColor: theme.headerText,
      headerTitleStyle: { fontSize: 16, fontWeight: "bold" },
      headerLeft: () => (
        <TouchableOpacity 
          onPress={() => {
            const workOrderId = route?.params?.workOrderId;
            navigation?.navigate("WorkOrderDetail", { workOrderId });
          }}
          style={{ padding: 8, marginLeft: 4 }}
        >
          <Ionicons name="arrow-back" size={24} color={theme.headerText} />
        </TouchableOpacity>
      ),
    })
  }, [navigation, theme, route?.params?.workOrderId])

  const handlePanelPress = (panel: PanoOut) => {
    const reportTypeId = route?.params?.reportTypeId;
    const params = {
      workOrderId: route?.params?.workOrderId,
      reportTypeId: reportTypeId,
      panelId: panel.id,
      panelName: panel.data.name,
    };

    // Rapor türüne göre ilgili navigatöre yönlendir
    if (reportTypeId === 2) {
      // Topraklama
      navigation?.navigate("GroundingNavigator", params);
    } else if (reportTypeId === 3) {
      // Yıldırımdan Korunma Tesisatı (henüz hazır değil, ReportControlNavigator kullanılır)
      navigation?.navigate("ReportControlNavigator", params);
    } else {
      // Gözle Kontrol (varsayılan)
      navigation?.navigate("ReportControlNavigator", params);
    }
  }

  const handleAddPanel = async () => {
    if (!newPanelName.trim()) {
      showAlert({
        title: 'Hata',
        message: 'Pano adı boş olamaz',
        type: 'error',
      })
      return
    }

    setAdding(true)
    try {
      let currentFormId = formId

      // Eğer form yoksa, otomatik olarak boş bir "Genel Bilgiler" formu oluştur
      if (!currentFormId) {
        const workOrderId = route?.params?.workOrderId
        if (!workOrderId) {
          throw new Error('İş emri ID bulunamadı')
        }

        console.log('[PanelListScreen] Genel Bilgiler formu bulunamadı, otomatik oluşturuluyor...')
        const newForm = await FormsApi.create({
          form_name: 'general_info',
          work_order_id: workOrderId,
          data: {
            // Boş genel bilgiler - kullanıcı daha sonra doldurabilir
            customerCompanyTitle: '',
            customerCompanyAddress: '',
            customerCompanyPhone: '',
            customerAuthorizedPerson: '',
            customerPeriodicControlAddress: '',
            taxNumber: '',
            taxOffice: '',
          }
        })
        
        currentFormId = newForm.id
        setFormId(currentFormId)
        console.log('[PanelListScreen] Genel Bilgiler formu oluşturuldu:', currentFormId)
      }

      await PanolarApi.create(currentFormId, {
        data: {
          name: newPanelName.trim(),
          description: newPanelDescription.trim(),
          location: newPanelLocation.trim(),
        }
      })

      setNewPanelName("")
      setNewPanelDescription("")
      setNewPanelLocation("")
      setIsModalVisible(false)

      showAlert({
        title: 'Başarılı',
        message: 'Yeni pano eklendi',
        type: 'success',
        onConfirm: () => loadPanels(),
      })
    } catch (e: any) {
      console.error('[PanelListScreen] Pano ekleme hatası:', e)
      showAlert({
        title: 'Hata',
        message: e?.message || 'Pano eklenirken hata oluştu',
        type: 'error',
      })
    } finally {
      setAdding(false)
    }
  }

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "Henüz kontrol edilmedi"
    const date = new Date(dateString)
    return date.toLocaleDateString("tr-TR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handleDeletePanel = (panelId: string) => {
    showAlert({
      title: 'Pano Sil',
      message: 'Bu panoyu silmek istediğinize emin misiniz?',
      type: 'warning',
      showCancel: true,
      confirmText: 'Sil',
      cancelText: 'İptal',
      onConfirm: () => confirmDelete(panelId),
    })
  }

  const confirmDelete = async (panelId: string) => {
    setDeleting(true)
    try {
      await PanolarApi.delete(panelId)
      showAlert({
        title: 'Başarılı',
        message: 'Pano başarıyla silindi',
        type: 'success',
        onConfirm: () => loadPanels(),
      })
    } catch (e: any) {
      console.error('[PanelListScreen] Pano silme hatası:', e)
      showAlert({
        title: 'Hata',
        message: e?.message || 'Pano silinirken hata oluştu',
        type: 'error',
      })
    } finally {
      setDeleting(false)
    }
  }

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    content: { flex: 1, padding: 16 },
    countContainer: { backgroundColor: theme.card, padding: 12, borderRadius: 8, marginBottom: 16, borderWidth: 1, borderColor: theme.border },
    countText: { fontSize: 14, fontWeight: "600", color: theme.text, textAlign: "center" },
    panelsList: { flex: 1 },
    panelsListContent: { paddingBottom: 16 },
    panelCard: { backgroundColor: theme.card, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
    panelIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.surfaceVariant, alignItems: "center", justifyContent: "center", marginRight: 12 },
    panelInfo: { flex: 1 },
    panelName: { fontSize: 16, fontWeight: "600", color: theme.text, marginBottom: 4 },
    panelDescription: { fontSize: 13, color: theme.textSecondary, marginBottom: 4 },
    locationContainer: { flexDirection: "row", alignItems: "center", marginTop: 4 },
    locationText: { fontSize: 12, color: theme.textSecondary, marginLeft: 4 },
    inspectionContainer: { flexDirection: "row", alignItems: "center", marginTop: 4 },
    inspectionText: { fontSize: 12, color: theme.textSecondary, marginLeft: 4 },
    addButton: { backgroundColor: theme.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 16, borderRadius: 12, marginTop: 16 },
    addButtonText: { color: theme.headerText, fontSize: 16, fontWeight: "600", marginLeft: 8 },
    modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.5)", justifyContent: "flex-end" },
    modalContent: { backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: "80%" },
    modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
    modalTitle: { fontSize: 20, fontWeight: "bold", color: theme.text },
    modalForm: { marginBottom: 16 },
    inputContainer: { marginBottom: 16 },
    label: { fontSize: 14, fontWeight: "600", color: theme.text, marginBottom: 8 },
    textInput: { backgroundColor: theme.surface, borderWidth: 1, borderColor: theme.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: theme.text },
    modalButtons: { flexDirection: "row", gap: 12 },
    cancelButton: { flex: 1, backgroundColor: theme.surface, padding: 16, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: theme.border },
    cancelButtonText: { color: theme.text, fontSize: 16, fontWeight: "600" },
    submitButton: { flex: 1, backgroundColor: theme.primary, padding: 16, borderRadius: 12, alignItems: "center" },
    submitButtonText: { color: theme.headerText, fontSize: 16, fontWeight: "600" },
  })

  const renderPanelItem = ({ item, index }: { item: PanoOut, index: number }) => (
    <View style={[styles.panelCard, { flexDirection: 'row', alignItems: 'center' }]}> 
      <Text style={{ width: 24, fontWeight: 'bold', color: theme.primary, fontSize: 16, marginRight: 8 }}>{index + 1}</Text>
      <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }} onPress={() => handlePanelPress(item)}>
        <View style={styles.panelIcon}>
          <Ionicons name="easel" size={20} color={theme.primary} />
        </View>
        <View style={styles.panelInfo}>
          <Text style={styles.panelName}>{item.data.name}</Text>
          {item.data.description && <Text style={styles.panelDescription}>{item.data.description}</Text>}
          {item.data.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location" size={12} color={theme.textSecondary} />
              <Text style={styles.locationText}>{item.data.location}</Text>
            </View>
          )}
          <View style={styles.inspectionContainer}>
            <Ionicons name="calendar" size={12} color={theme.textSecondary} />
            <Text style={styles.inspectionText}>Oluşturma: {formatDate(item.created_at)}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleDeletePanel(item.id)} style={{ marginLeft: 8, padding: 4 }}>
        <Ionicons name="trash" size={20} color="#EF4444" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      <View style={styles.content}>

        {/* Panel Count */}
        <View style={styles.countContainer}>
          <Text style={styles.countText}>{panels.length} Pano Listelendi</Text>
        </View>

        {loading && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={{ color: theme.textSecondary, marginTop: 8 }}>Panolar yükleniyor...</Text>
          </View>
        )}

        {error && (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: '#EF4444', textAlign: 'center' }}>{error}</Text>
          </View>
        )}

        {/* Panels List */}
        {!loading && !error && (
        <FlatList
          data={panels}
          renderItem={({ item, index }) => renderPanelItem({ item, index })}
          keyExtractor={(item) => item.id}
          style={styles.panelsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.panelsListContent}
        />
        )}

        {/* Add Panel Button */}
        <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
          <Ionicons name="add" size={24} color={theme.headerText} />
          <Text style={styles.addButtonText}>Yeni Pano Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Add Panel Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yeni Pano Ekle</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Pano Adı *</Text>
                <TextInput
                  style={styles.textInput}
                  value={newPanelName}
                  onChangeText={setNewPanelName}
                  placeholder="Pano adını girin"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Açıklama</Text>
                <TextInput
                  style={styles.textInput}
                  value={newPanelDescription}
                  onChangeText={setNewPanelDescription}
                  placeholder="Pano açıklamasını girin (isteğe bağlı)"
                  placeholderTextColor={theme.textTertiary}
                  multiline
                  numberOfLines={2}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Konum</Text>
                <TextInput
                  style={styles.textInput}
                  value={newPanelLocation}
                  onChangeText={setNewPanelLocation}
                  placeholder="Pano konumunu girin (isteğe bağlı)"
                  placeholderTextColor={theme.textTertiary}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.submitButton, adding && { opacity: 0.6 }]} 
                onPress={handleAddPanel}
                disabled={adding}
              >
                {adding ? (
                  <ActivityIndicator size="small" color={theme.headerText} />
                ) : (
                  <Text style={styles.submitButtonText}>Ekle</Text>
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

export default PanelListScreen
