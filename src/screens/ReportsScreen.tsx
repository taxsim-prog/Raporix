import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ReportsApi, { ReportOut } from '../api/reports';

const ReportsScreen = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [reports, setReports] = useState<ReportOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await ReportsApi.list();
      setReports(list);
    } catch (e: any) {
      setError(e?.message || 'Raporlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const periods = [
    { id: 'week', title: 'Bu Hafta' },
    { id: 'month', title: 'Bu Ay' },
    { id: 'year', title: 'Bu Yıl' },
  ];

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });

  const stats = [
    { title: 'Toplam Kontrol', value: '156', color: '#059669', icon: 'stats-chart' },
    { title: 'Tamamlanan', value: '142', color: '#10B981', icon: 'checkmark-circle' },
    { title: 'Bekleyen', value: '14', color: '#F59E0B', icon: 'time' },
    { title: 'Sorunlu', value: '3', color: '#EF4444', icon: 'warning' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#059669" />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Dönem Seçici */}
        <View style={styles.periodSelector}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.id}
              style={[
                styles.periodButton,
                selectedPeriod === period.id && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period.id)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.id && styles.periodButtonTextActive
              ]}>
                {period.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* İstatistikler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İstatistikler</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
                  <Ionicons name={stat.icon} size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.statValue, { color: stat.color }]}>
                  {stat.value}
                </Text>
                <Text style={styles.statTitle}>{stat.title}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Raporlar Listesi */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Raporlar</Text>
            <TouchableOpacity style={styles.newReportButton}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.newReportButtonText}>Yeni Rapor</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.reportsContainer}>
            {loading && (
              <View style={styles.reportCard}><Text>Yükleniyor...</Text></View>
            )}
            {!!error && !loading && (
              <View style={styles.reportCard}><Text style={{ color: '#EF4444' }}>{error}</Text></View>
            )}
            {reports.map((report) => (
              <TouchableOpacity key={report.id} style={styles.reportCard}>
                <View style={styles.reportIcon}>
                  <Ionicons name="document-text" size={24} color="#059669" />
                </View>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  <Text style={styles.reportDetails}>
                    {formatDate(report.created_at)} • {report.type?.toUpperCase()} • {report.status}
                  </Text>
                </View>
                <View style={styles.reportActions}>
                  <View style={[
                    styles.reportStatus,
                    { backgroundColor: report.status === 'ready' ? '#10B981' : '#F59E0B' }
                  ]}>
                    <Text style={styles.reportStatusText}>{report.status === 'ready' ? 'Hazır' : report.status}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  periodButtonActive: {
    backgroundColor: '#059669',
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  newReportButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  newReportButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  reportsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reportIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  reportDetails: {
    fontSize: 14,
    color: '#6B7280',
  },
  reportActions: {
    alignItems: 'center',
  },
  reportStatus: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 8,
  },
  reportStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ReportsScreen;