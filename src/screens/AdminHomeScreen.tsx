import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import WorkOrdersApi, { WorkOrderOut } from '../api/workOrders';
import CompaniesApi, { CompanyOut, CompanyEmployee } from '../api/companies';
import UsersApi, { UserOut } from '../api/users';
import StorageService from '../utils/StorageService';

interface AdminHomeScreenProps {
  navigation?: any;
}

const AdminHomeScreen: React.FC<AdminHomeScreenProps> = ({ navigation }) => {
  const { theme, isDark } = useTheme();
  const [workOrders, setWorkOrders] = useState<WorkOrderOut[]>([]);
  const [companies, setCompanies] = useState<CompanyOut[]>([]);
  const [employees, setEmployees] = useState<CompanyEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Kullanıcı bilgisini al
      const currentUser = await StorageService.getItem<{ full_name?: string; email?: string }>('currentUser');
      if (currentUser?.full_name) {
        setUserName(currentUser.full_name);
      } else if (currentUser?.email) {
        setUserName(currentUser.email.split('@')[0]);
      }

      // Önce şirket bilgisini al
      const companiesData = await CompaniesApi.list({ q: '', limit: 1, offset: 0 });
      setCompanies(companiesData);

      if (companiesData && companiesData.length > 0) {
        const companyId = parseInt(companiesData[0].id);

        // Şirket ID'si ile verileri yükle
        const [workOrdersData, employeesResponse] = await Promise.all([
          WorkOrdersApi.list({ company_id: companyId.toString(), sort_by: 'created_at', sort_dir: 'desc', limit: 50 }),
          CompaniesApi.getEmployees(companyId).catch(() => ({ employees: [] })),
        ]);

        setWorkOrders(workOrdersData);
        setEmployees(employeesResponse.employees || []);
      }
    } catch (e: any) {
      setError(e?.message || 'Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, []);

  // Ekran her odaklandığında (focus) verileri yeniden yükle
  useFocusEffect(
    useCallback(() => {
      console.log("[AdminHomeScreen] Ekran odaklandı, veriler yeniden yükleniyor...");
      loadData();
    }, [loadData])
  );

  // İstatistikler - İstenen sırayla
  const stats = useMemo(() => [
    {
      title: 'Toplam İş Emri',
      value: workOrders.length.toString(),
      color: '#3B82F6',
      icon: 'document-text' as const,
      bgColor: isDark ? '#1E3A8A20' : '#DBEAFE',
    },
    {
      title: 'Bekleyen İş Emri',
      value: workOrders.filter(wo => wo.status === 'pending').length.toString(),
      color: '#F59E0B',
      icon: 'time' as const,
      bgColor: isDark ? '#92400E20' : '#FEF3C7',
    },
    {
      title: 'Toplam Çalışan',
      value: employees.length.toString(),
      color: '#10B981',
      icon: 'people' as const,
      bgColor: isDark ? '#065F4620' : '#D1FAE5',
    },
  ], [workOrders, employees, theme, isDark]);

  // Hızlı İşlemler - İstenen sırayla
  const quickActions = useMemo(() => [
    {
      id: 1,
      title: 'İş Emirleri',
      subtitle: `${workOrders.length} iş emri`,
      color: '#3B82F6',
      icon: 'document-text',
      onPress: () => {
        // Company tab'ına geç ve WorkOrders'a yönlendir
        navigation?.navigate('Company', {
          screen: 'WorkOrders'
        });
      }
    },
    {
      id: 2,
      title: 'Raporlar',
      subtitle: 'Raporları görüntüle',
      color: '#10B981',
      icon: 'bar-chart',
      onPress: () => navigation?.navigate('CompanyReports')
    },
    {
      id: 3,
      title: 'Çalışanlar',
      subtitle: `${employees.length} çalışan`,
      color: '#8B5CF6',
      icon: 'people',
      onPress: () => navigation?.navigate('Employees')
    },
    {
      id: 4,
      title: 'Ekipmanlar',
      subtitle: 'Ekipmanları yönet',
      color: '#F59E0B',
      icon: 'construct',
      onPress: () => navigation?.navigate('Equipment')
    },
  ], [workOrders, employees, navigation]);

  // Son Aktiviteler - Örnek veriler (Backend hazır olunca güncellenecek)
  const recentActivities = useMemo(() => {
    // Gerçek veriler varsa onları kullan
    if (workOrders.length > 0) {
      return workOrders.slice(0, 5).map(wo => ({
        id: wo.id,
        title: wo.title,
        subtitle: wo.customer_company_title || 'Müşteri bilgisi yok',
        date: new Date(wo.created_at).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit'
        }),
        status: wo.status === 'completed' ? 'Tamamlandı' :
          wo.status === 'in_progress' ? 'Devam Ediyor' : 'Bekliyor',
        statusColor: wo.status === 'completed' ? '#10B981' :
          wo.status === 'in_progress' ? '#3B82F6' : '#F59E0B',
        icon: wo.status === 'completed' ? 'checkmark-circle' :
          wo.status === 'in_progress' ? 'play-circle' : 'time',
      }));
    }

    // Örnek veriler
    return [
      {
        id: '1',
        title: 'Periyodik Kontrol - ABC Şirketi',
        subtitle: 'ABC Teknoloji A.Ş.',
        date: '15 Kas, 14:30',
        status: 'Tamamlandı',
        statusColor: '#10B981',
        icon: 'checkmark-circle',
      },
      {
        id: '2',
        title: 'Gözle Kontrol - XYZ Ltd.',
        subtitle: 'XYZ Mühendislik Ltd.',
        date: '15 Kas, 10:15',
        status: 'Devam Ediyor',
        statusColor: '#3B82F6',
        icon: 'play-circle',
      },
      {
        id: '3',
        title: 'Topraklama Ölçümü - DEF A.Ş.',
        subtitle: 'DEF Elektrik A.Ş.',
        date: '14 Kas, 16:45',
        status: 'Bekliyor',
        statusColor: '#F59E0B',
        icon: 'time',
      },
    ];
  }, [workOrders]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 20,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerContent: {
      flex: 1,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: theme.adminHomepageHeaderText,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.adminHomepageHeaderText,
      opacity: 0.8,
    },
    statsSection: {
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 8,
    },
    statCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 12,
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
    },
    statIconContainer: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 8,
    },
    statInfo: {
      alignItems: 'center',
    },
    statValue: {
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
    },
    statTitle: {
      fontSize: 11,
      fontWeight: '500',
      color: theme.adminHomepageHeaderText,
      textAlign: 'center',
    },
    section: {
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: theme.adminHomepageHeaderText,
      marginBottom: 16,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    quickActionCard: {
      backgroundColor: theme.card,
      borderRadius: 12,
      padding: 16,
      width: '48%',
      marginBottom: 12,
      alignItems: 'center',
    },
    quickActionIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    quickActionTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.adminHomepageHeaderText,
      textAlign: 'center',
      marginBottom: 4,
    },
    quickActionSubtitle: {
      fontSize: 11,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    activitiesContainer: {
      backgroundColor: theme.card,
      borderRadius: 12,
      overflow: 'hidden',
    },
    activityCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.divider,
    },
    activityIcon: {
      marginRight: 12,
    },
    activityInfo: {
      flex: 1,
    },
    activityTitle: {
      fontSize: 15,
      fontWeight: '600',
      color: theme.adminHomepageHeaderText,
      marginBottom: 2,
    },
    activitySubtitle: {
      fontSize: 13,
      color: theme.adminHomepageHeaderText,
      marginBottom: 4,
    },
    activityDate: {
      fontSize: 12,
      color: theme.adminHomepageHeaderText,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 12,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.adminHomepageHeaderText,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    errorText: {
      marginTop: 12,
      fontSize: 14,
      color: theme.error,
      textAlign: 'center',
    },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={theme.statusBarStyle} backgroundColor={theme.headerBackground} />
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={theme.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            <Ionicons name="settings-outline" size={28} color={theme.adminHomepageHeaderText} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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

        {/* Hızlı İşlemler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={action.onPress}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <Ionicons name={action.icon} size={24} color="#FFFFFF" />
                </View>
                <Text style={styles.quickActionTitle}>{action.title}</Text>
                <Text style={styles.quickActionSubtitle}>{action.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Son Aktiviteler 
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Son Aktiviteler</Text>
          <View style={styles.activitiesContainer}>
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <TouchableOpacity
                  key={activity.id}
                  style={styles.activityCard}
                  onPress={() => navigation?.navigate('WorkOrderDetail', { workOrderId: activity.id })}
                >
                  <View style={styles.activityIcon}>
                    <Ionicons
                      name={activity.icon}
                      size={24}
                      color={activity.statusColor}
                    />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{activity.title}</Text>
                    <Text style={styles.activitySubtitle}>{activity.subtitle}</Text>
                    <Text style={styles.activityDate}>{activity.date}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: activity.statusColor }
                  ]}>
                    <Text style={styles.statusText}>{activity.status}</Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.activityCard}>
                <Text style={styles.activityDate}>Henüz aktivite bulunmuyor</Text>
              </View>
            )}
          </View>
        </View>
        */}

      </ScrollView>
    </SafeAreaView>
  );
};


export default AdminHomeScreen;