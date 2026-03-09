"use client"

import React, { useState, useCallback } from "react"
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, StatusBar } from "react-native"
import { useFocusEffect } from "@react-navigation/native"
import { SafeAreaView } from "react-native-safe-area-context"
import Ionicons from "react-native-vector-icons/Ionicons"
import { useTheme } from "../../theme/ThemeContext"
import CompaniesApi, { CompanyEmployee } from "../../api/companies"
import CertificatesApi, { CertificateOut } from "../../api/certificates"
import StorageService from "../../utils/StorageService"

interface CertificatesScreenProps {
  navigation: any;
}

const CertificatesScreen = ({ navigation }: CertificatesScreenProps) => {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("")
  const [employees, setEmployees] = useState<CompanyEmployee[]>([])
  const [certificatesMap, setCertificatesMap] = useState<Record<string, CertificateOut[]>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<number | null>(null)

  useFocusEffect(
    useCallback(() => {
      loadData()
    }, [])
  )

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      // Şirket bilgisini al
      const companies = await CompaniesApi.list({ q: '', limit: 1, offset: 0 });
      if (!companies || companies.length === 0) {
        throw new Error("Şirket bilgisi bulunamadı");
      }
      
      const compId = parseInt(companies[0].id);
      setCompanyId(compId);
      
      // Şirketin çalışanlarını getir (aktif kullanıcı dahil)
      const response = await CompaniesApi.getEmployees(compId);
      setEmployees(response.employees);
      
      // Her çalışan için belge sayısını al
      const certsMap: Record<string, CertificateOut[]> = {};
      for (const emp of response.employees) {
        try {
          const certs = await CertificatesApi.listByUser(parseInt(emp.id), compId);
          certsMap[emp.id] = certs;
        } catch (e) {
          certsMap[emp.id] = [];
        }
      }
      setCertificatesMap(certsMap);
    } catch (e: any) {
      console.error("[CertificatesScreen] Hata:", e);
      setError(e?.message || "Veriler yüklenemedi")
    } finally {
      setLoading(false)
    }
  }

  const getCertificateCount = (userId: string) => {
    return certificatesMap[userId]?.length || 0;
  }

  const getExpiringSoonCount = (userId: string) => {
    const certs = certificatesMap[userId] || [];
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return certs.filter(cert => {
      const expiryDate = new Date(cert.expiry_date);
      return expiryDate > now && expiryDate <= thirtyDaysLater;
    }).length;
  }

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.position?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.primary} />
        <View style={[styles.header, { backgroundColor: theme.primary }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Yetki Belgeleri</Text>
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
        <Text style={styles.headerTitle}>Yetki Belgeleri</Text>
        <View style={styles.addButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Card */}
        <View style={styles.infoSection}>
          <View style={[styles.infoCard, { backgroundColor: theme.card }]}>
            <Ionicons name="information-circle" size={20} color={theme.primary} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Çalışana tıklayarak belgelerini görüntüleyin ve yeni belge ekleyin.
            </Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Ionicons name="search" size={18} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Çalışan ara..."
              placeholderTextColor={theme.textSecondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Employees List */}
        <View style={styles.employeesSection}>
          {filteredEmployees.map((employee) => {
            const certCount = getCertificateCount(employee.id);
            const expiringSoon = getExpiringSoonCount(employee.id);
            
            return (
              <TouchableOpacity
                key={employee.id}
                style={[styles.employeeCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => navigation.navigate('EmployeeCertificates', { 
                  employeeId: employee.id,
                  employeeName: employee.full_name || employee.email,
                  companyId: companyId
                })}
              >
                <View style={styles.employeeHeader}>
                  <View style={[styles.employeeAvatar, { backgroundColor: theme.primary + '20' }]}>
                    <Ionicons name="person" size={24} color={theme.primary} />
                  </View>
                  <View style={styles.employeeInfo}>
                    <Text style={[styles.employeeName, { color: theme.text }]}>
                      {employee.full_name || employee.email}
                    </Text>
                    <Text style={[styles.employeePosition, { color: theme.textSecondary }]}>
                      {employee.position || employee.department || "Çalışan"}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                </View>
                
                <View style={styles.employeeStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="document-text" size={16} color={theme.primary} />
                    <Text style={[styles.statText, { color: theme.text }]}>
                      {certCount} Belge
                    </Text>
                  </View>
                  {expiringSoon > 0 && (
                    <View style={[styles.statItem, styles.warningItem]}>
                      <Ionicons name="warning" size={16} color="#F59E0B" />
                      <Text style={[styles.statText, { color: "#F59E0B" }]}>
                        {expiringSoon} Süresi Yakın
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {filteredEmployees.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={theme.textSecondary} />
            <Text style={[styles.emptyStateTitle, { color: theme.text }]}>Çalışan bulunamadı</Text>
            <Text style={[styles.emptyStateText, { color: theme.textSecondary }]}>
              Arama kriterlerinize uygun çalışan bulunmuyor.
            </Text>
          </View>
        )}
      </ScrollView>
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
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  employeesSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  employeeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  employeePosition: {
    fontSize: 14,
  },
  employeeStats: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  warningItem: {
    marginLeft: 8,
  },
  statText: {
    fontSize: 13,
    fontWeight: "500",
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
  },
})

export default CertificatesScreen
