"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { View, Text, StyleSheet, StatusBar, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import Ionicons from "react-native-vector-icons/Ionicons"
import CompaniesApi, { CompanyEmployee } from "../../api/companies"
import UsersApi from "../../api/users"
import { SafeAreaView } from "react-native-safe-area-context"
import { useTheme } from "../../theme/ThemeContext"
import StorageService from "../../utils/StorageService"
import CustomAlert from "../../components/CustomAlert"

interface EmployeesScreenProps {
  navigation: any
}

const EmployeesScreen = ({ navigation }: EmployeesScreenProps) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedFilter, setSelectedFilter] = useState("all")
  const [employees, setEmployees] = useState<CompanyEmployee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState<string>("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<CompanyEmployee | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState({ full_name: '', phone_number: '', department: '', position: '' })
  const [updating, setUpdating] = useState(false)
  
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
      console.log("[EmployeesScreen] useFocusEffect çağırılıyor...");
      const load = async () => {
        setLoading(true)
        setError(null)
        try {
          console.log("[EmployeesScreen] Şirket bilgileri alınıyor...");
          
          // Oturum açmış kullanıcının ID'sini al
          const currentUser = await StorageService.getItem<{ id: string }>('currentUser');
          if (currentUser?.id) {
            setCurrentUserId(currentUser.id);
            console.log("[EmployeesScreen] Oturum açmış kullanıcı ID:", currentUser.id);
          }
          
          // Önce şirket ID'sini al
          const companies = await CompaniesApi.list({ q: '', limit: 1, offset: 0 });
          if (!companies || companies.length === 0) {
            throw new Error("Şirket bilgisi bulunamadı");
          }
          
          const companyId = parseInt(companies[0].id);
          console.log("[EmployeesScreen] Şirket ID:", companyId);
          
          // Şirketin çalışanlarını getir
          const response = await CompaniesApi.getEmployees(companyId);
          console.log("[EmployeesScreen] Çalışanlar yüklendi:", response);
          
          // Oturum açmış kullanıcıyı listeden çıkar
          const filteredEmployees = response.employees.filter(
            emp => emp.id !== currentUser?.id
          );
          console.log("[EmployeesScreen] Filtrelenmiş çalışanlar:", filteredEmployees.length);
          
          setEmployees(filteredEmployees);
          setCompanyName(response.company_name);
        } catch (e: any) {
          console.error("[EmployeesScreen] Hata:", e);
          setError(e?.message || "Çalışanlar yüklenemedi")
        } finally {
          setLoading(false)
        }
      }
      load()
    }, [])
  )

  const handleEmployeePress = (employee: CompanyEmployee) => {
    setSelectedEmployee(employee)
    setShowActionModal(true)
  }

  const handleEdit = () => {
    if (!selectedEmployee) return
    setEditFormData({
      full_name: selectedEmployee.full_name || '',
      phone_number: selectedEmployee.phone_number || '',
      department: selectedEmployee.department || '',
      position: selectedEmployee.position || '',
    })
    setShowActionModal(false)
    setShowEditModal(true)
  }

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return
    
    setUpdating(true)
    try {
      await UsersApi.update(selectedEmployee.id, {
        full_name: editFormData.full_name || null,
        phone_number: editFormData.phone_number || null,
        department: editFormData.department || null,
        position: editFormData.position || null,
      })
      
      // Listede güncelle
      setEmployees(prev => prev.map(emp => 
        emp.id === selectedEmployee.id 
          ? { 
              ...emp, 
              full_name: editFormData.full_name,
              phone_number: editFormData.phone_number,
              department: editFormData.department, 
              position: editFormData.position 
            }
          : emp
      ))
      
      setShowEditModal(false)
      setSelectedEmployee(null)
      
      showAlert({
        title: 'Başarılı',
        message: 'Çalışan bilgileri başarıyla güncellendi.',
        type: 'success',
      })
    } catch (error: any) {
      console.error('[EmployeesScreen] Güncelleme hatası:', error)
      showAlert({
        title: 'Hata',
        message: error?.message || 'Çalışan güncellenirken bir hata oluştu.',
        type: 'error',
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = () => {
    if (!selectedEmployee) return
    setShowActionModal(false)
    
    showAlert({
      title: 'Çalışanı Sil',
      message: `${selectedEmployee.full_name || selectedEmployee.email} adlı çalışanı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`,
      type: 'warning',
      showCancel: true,
      confirmText: 'Sil',
      cancelText: 'İptal',
      onConfirm: async () => {
        try {
          console.log('[EmployeesScreen] Çalışan siliniyor:', selectedEmployee.id)
          await UsersApi.delete(selectedEmployee.id)
          
          // Listeden çıkar
          setEmployees(prev => prev.filter(emp => emp.id !== selectedEmployee.id))
          setSelectedEmployee(null)
          
          showAlert({
            title: 'Başarılı',
            message: 'Çalışan başarıyla silindi.',
            type: 'success',
          })
        } catch (error: any) {
          console.error('[EmployeesScreen] Silme hatası:', error)
          showAlert({
            title: 'Hata',
            message: error?.message || 'Çalışan silinirken bir hata oluştu.',
            type: 'error',
          })
        }
      },
    })
  }

  const filters = useMemo(() => [
    { id: "all", title: "Tümü", count: employees.length },
    // Backend'te status alanı yok; role üzerinden ayırmak isterseniz burada uyarlayabilirsiniz
  ], [employees])

  const filteredEmployees = employees.filter((employee) => {
    const name = (employee.full_name || employee.email || "").toLowerCase()
    const matchesSearch = name.includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === "all"
    return matchesSearch && matchesFilter
  })

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={theme.headerText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.headerText }]}>Çalışanlar</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddEmployee')}>
          <Ionicons name="add" size={22} color={theme.headerText} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
            <Ionicons name="search" size={18} color={theme.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Çalışan ara..."
              placeholderTextColor={theme.inputPlaceholder}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={theme.textTertiary} />
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

        {/* Employees List */}
        <View style={styles.employeesSection}>
          <View style={[styles.employeesContainer, { backgroundColor: theme.card }]}>
            {loading && (
              <View style={[styles.employeeCard, { borderBottomColor: theme.border, alignItems: 'center', justifyContent: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ color: theme.text, marginTop: 12 }}>Çalışanlar yükleniyor...</Text>
              </View>
            )}
            {!!error && !loading && (
              <View style={[styles.employeeCard, { borderBottomColor: theme.border }]}><Text style={{ color: '#EF4444' }}>{error}</Text></View>
            )}
            {!loading && filteredEmployees.map((employee) => (
              <TouchableOpacity 
                key={employee.id} 
                style={[styles.employeeCard, { borderBottomColor: theme.border }]}
                onPress={() => handleEmployeePress(employee)}
              >
                <View style={styles.employeeHeader}>
                  <View style={[styles.employeeAvatar, { backgroundColor: theme.primary }]}>
                    <Text style={styles.employeeAvatarText}>
                      {(employee.full_name || employee.email)
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </Text>
                  </View>
                  <View style={styles.employeeInfo}>
                    <Text style={[styles.employeeName, { color: theme.text }]}>{employee.full_name || employee.email}</Text>
                    <Text style={[styles.employeePosition, { color: theme.primary }]}>{employee.role === "admin" ? "Yönetici" : "Çalışan"}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
                </View>

                <View style={styles.employeeDetails}>
                  <View style={styles.contactRow}>
                    <Ionicons name="call-outline" size={14} color={theme.textSecondary} />
                    <Text style={[styles.contactText, { color: theme.textSecondary }]}>
                      {employee.phone_number}
                    </Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Ionicons name="mail-outline" size={14} color={theme.textSecondary} />
                    <Text style={[styles.contactText, { color: theme.textSecondary }]}>{employee.email}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Ionicons name="business-outline" size={14} color={theme.textSecondary} />
                    <Text style={[styles.contactText, { color: theme.textSecondary }]}>{employee.department}</Text>
                  </View>
                  <View style={styles.contactRow}>
                    <Ionicons name="briefcase-outline" size={14} color={theme.textSecondary} />
                    <Text style={[styles.contactText, { color: theme.textSecondary }]}>{employee.position}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {!loading && filteredEmployees.length === 0 && !error && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={40} color={theme.textTertiary} />
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Çalışan bulunamadı</Text>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              {searchQuery ? 'Arama kriterlerinize uygun çalışan bulunmuyor.' : 'Henüz çalışan eklenmemiş.'}
            </Text>
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
              <Text style={[styles.actionModalTitle, { color: theme.text }]}>Çalışan İşlemleri</Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionModalBody}>
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
              >
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
                <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Sil</Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textTertiary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.editModalContent, { backgroundColor: theme.background }]}>
            <View style={[styles.editModalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.editModalTitle, { color: theme.text }]}>Çalışan Düzenle</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.editModalBody}>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.text }]}>Ad Soyad</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                  value={editFormData.full_name}
                  onChangeText={(value) => setEditFormData(prev => ({ ...prev, full_name: value }))}
                  placeholder="Ad Soyad giriniz"
                  placeholderTextColor={theme.inputPlaceholder}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.text }]}>Telefon Numarası</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                  value={editFormData.phone_number}
                  onChangeText={(value) => setEditFormData(prev => ({ ...prev, phone_number: value }))}
                  placeholder="Telefon numarası giriniz"
                  placeholderTextColor={theme.inputPlaceholder}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.text }]}>Departman</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                  value={editFormData.department}
                  onChangeText={(value) => setEditFormData(prev => ({ ...prev, department: value }))}
                  placeholder="Departman giriniz"
                  placeholderTextColor={theme.inputPlaceholder}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: theme.text }]}>Pozisyon</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: theme.inputBackground, borderColor: theme.inputBorder, color: theme.inputText }]}
                  value={editFormData.position}
                  onChangeText={(value) => setEditFormData(prev => ({ ...prev, position: value }))}
                  placeholder="Pozisyon giriniz"
                  placeholderTextColor={theme.inputPlaceholder}
                />
              </View>

              <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: theme.primary }]}
                onPress={handleUpdateEmployee}
                disabled={updating}
              >
                {updating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.updateButtonText}>Güncelle</Text>
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
    fontSize: 18,
    fontWeight: "bold",
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
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
  },
  filterButtonActive: {
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterButtonTextActive: {
  },
  employeesSection: {
    paddingHorizontal: 20,
  },
  employeesContainer: {
    borderRadius: 12,
    overflow: "hidden",
  },
  employeeCard: {
    padding: 16,
    borderBottomWidth: 1,
  },
  employeeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  employeeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  employeeAvatarText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  employeeInfo: {
    flex: 1,
    marginRight: 8,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 2,
  },
  employeePosition: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  employeeDepartment: {
    fontSize: 11,
    color: "#6B7280",
  },
  employeeStatus: {
    alignItems: "flex-end",
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  employeeDetails: {
    paddingLeft: 60,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
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
  editModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '80%',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  editModalBody: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})

export default EmployeesScreen
