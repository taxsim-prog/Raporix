import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface ControlItem {
  id: string;
  title: string;
  evaluation: "Uygun" | "Uygun Değil" | "Uygulanamaz" | "Hafif Kusur" | "";
}

interface CablesControlScreenProps {
  navigation?: any;
  routeParams?: any;
  onDataUpdate: (data: any, isCompleted: boolean) => void;
}

const CablesControlScreen: React.FC<CablesControlScreenProps> = ({
  navigation,
  routeParams,
  onDataUpdate,
}) => {
  const { theme } = useTheme();
  const evaluationOptions = ["Uygun", "Uygun Değil", "Uygulanamaz", "Hafif Kusur"];

  const [controlItems, setControlItems] = useState<ControlItem[]>([
    { id: "cable_suitability", title: "Kablo yollarının uygunluğu ve mekanik koruma", evaluation: "" },
    { id: "cable_colors", title: "Kablo renk kodları Nötr: Mavi Toprak: Sarı/ Yeşil", evaluation: "" },
    { id: "resistance_method", title: "Tesisat yöntemi", evaluation: "" },
    {
      id: "fire_protection",
      title: "Yangın engeli, uygun kilitleme ve sıcaklık etkisine karşı koruma",
      evaluation: "",
    },
  ]);

  const updateItemEvaluation = (itemId: string, evaluation: string) => {
    const newControlItems = controlItems.map((item) =>
      item.id === itemId ? { ...item, evaluation: evaluation as any } : item
    );
    setControlItems(newControlItems);
    
    // Hemen parent'ı güncelle
    const isCompleted = newControlItems.every(item => item.evaluation !== "");
    onDataUpdate(newControlItems, isCompleted);
  };

  const getEvaluationColor = (evaluation: string) => {
    switch (evaluation) {
      case "Uygun":
        return "#10B981";
      case "Uygun Değil":
        return "#EF4444";
      case "Uygulanamaz":
        return "#9CA3AF";
      case "Hafif Kusur":
        return "#F59E0B";
      default:
        return "#E5E7EB";
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollView: { flex: 1, paddingHorizontal: 16 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 18, fontWeight: "700", color: theme.text, marginBottom: 8 },
    sectionDescription: { fontSize: 14, color: theme.textSecondary, marginBottom: 16, lineHeight: 20 },
    controlContainer: { gap: 16 },
    controlItem: { backgroundColor: theme.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: theme.border },
    controlItemTitle: { fontSize: 15, fontWeight: "600", color: theme.text, marginBottom: 12 },
    evaluationContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    evaluationButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
    evaluationButtonText: { fontSize: 14, color: theme.text, fontWeight: "500" },
    evaluationOption: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: theme.border, backgroundColor: theme.surface },
    evaluationText: { fontSize: 14, color: theme.text, fontWeight: "500" },
    progressContainer: { marginTop: 16, padding: 16, backgroundColor: theme.card, borderRadius: 12, borderWidth: 1, borderColor: theme.border },
    progressBar: { height: 8, backgroundColor: theme.surfaceVariant, borderRadius: 4, overflow: "hidden" },
    progressFill: { height: "100%", backgroundColor: theme.primary, borderRadius: 4 },
    progressText: { fontSize: 14, color: theme.text, marginTop: 8, textAlign: "center" },
    bottomPadding: { height: 40 },
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            KABLO ve İLETKENLER
          </Text>
          <Text style={styles.sectionDescription}>
            Bu bölümde kablo sistemleri, iletkenler ve koruma önlemleri kontrol edilir.
          </Text>
          
          <View style={styles.controlContainer}>
            {controlItems.map((item) => (
              <View key={item.id} style={styles.controlItem}>
                <Text style={styles.controlItemTitle}>{item.title}</Text>
                <View style={styles.evaluationContainer}>
                  {evaluationOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      style={[
                        styles.evaluationOption,
                        {
                          backgroundColor:
                            item.evaluation === option
                              ? getEvaluationColor(option)
                              : "#F3F4F6",
                        },
                      ]}
                      onPress={() => updateItemEvaluation(item.id, option)}
                    >
                      <Text
                        style={[
                          styles.evaluationText,
                          {
                            color:
                              item.evaluation === option ? "#FFFFFF" : "#6B7280",
                          },
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(controlItems.filter(item => item.evaluation !== "").length / controlItems.length) * 100}%` 
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {controlItems.filter(item => item.evaluation !== "").length} / {controlItems.length} tamamlandı
          </Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 8,
    lineHeight: 24,
    textAlign: 'center',
  },
  sectionDescription: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
  controlContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  controlItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  controlItemTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
    lineHeight: 20,
  },
  evaluationContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  evaluationOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  evaluationText: {
    fontSize: 12,
    fontWeight: "600",
  },
  progressContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  progressBar: {
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: "#059669",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: 'center',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 32,
  },
});

export default CablesControlScreen;

