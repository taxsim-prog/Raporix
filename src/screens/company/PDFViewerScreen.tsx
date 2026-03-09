import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Pdf from 'react-native-pdf';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../theme/ThemeContext';
import ReactNativeBlobUtil from 'react-native-blob-util';

// Demo PDF asset
import demoPdf from '../../assets/video.pdf';

interface PDFViewerScreenProps {
  navigation: any;
  route: {
    params: {
      pdfUrl?: string;
      pdfTitle: string;
      useLocalAsset?: boolean;
    };
  };
}

const PDFViewerScreen: React.FC<PDFViewerScreenProps> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const { pdfUrl, pdfTitle, useLocalAsset } = route.params;
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [localPdfPath, setLocalPdfPath] = useState<string | null>(null);

  useEffect(() => {
    // Eğer local asset kullanılacaksa indirme yapma
    if (useLocalAsset) {
      return;
    }

    if (!pdfUrl) {
      setLoading(false);
      return;
    }

    const downloadPDF = async () => {
      try {
        console.log('[PDFViewerScreen] Downloading PDF from:', pdfUrl);
        
        const { dirs } = ReactNativeBlobUtil.fs;
        const pdfPath = `${dirs.CacheDir}/temp_${Date.now()}.pdf`;
        
        const response = await ReactNativeBlobUtil.config({
          path: pdfPath,
          fileCache: true,
        }).fetch('GET', pdfUrl);
        
        console.log('[PDFViewerScreen] PDF downloaded to:', response.path());
        setLocalPdfPath(response.path());
      } catch (error) {
        console.error('[PDFViewerScreen] Download error:', error);
        setLoading(false);
      }
    };
    
    downloadPDF();
  }, [pdfUrl, useLocalAsset]);

  // Kaynak belirleme: Local asset varsa onu kullan, yoksa indirileni veya URL'i kullan
  const source = useLocalAsset
    ? demoPdf
    : localPdfPath 
      ? { uri: Platform.OS === 'android' ? `file://${localPdfPath}` : localPdfPath, cache: true }
      : { uri: pdfUrl, cache: true };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: theme.headerBackground,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    backButton: {
      width: 40,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.headerText,
      flex: 1,
      textAlign: 'center',
      paddingRight: 40,
    },
    pdfContainer: {
      flex: 1,
    },
    pdf: {
      flex: 1,
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
    },
    loadingContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    loadingText: {
      marginTop: 12,
      fontSize: 16,
      color: theme.text,
    },
    pageInfo: {
      position: 'absolute',
      bottom: 20,
      alignSelf: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    pageInfoText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: theme.error,
      textAlign: 'center',
      marginTop: 12,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={theme.headerText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {pdfTitle}
        </Text>
      </View>

      {/* PDF Viewer */}
      <View style={styles.pdfContainer}>
        <Pdf
          source={source}
          style={styles.pdf}
          trustAllCerts={false}
          enablePaging={true}
          horizontal={false}
          onLoadComplete={(numberOfPages) => {
            console.log('[PDFViewerScreen] PDF loaded successfully:', numberOfPages, 'pages');
            setTotalPages(numberOfPages);
            setLoading(false);
          }}
          onPageChanged={(page) => {
            setCurrentPage(page);
          }}
          onError={(error) => {
            console.error('[PDFViewerScreen] PDF Error:', error);
            setLoading(false);
          }}
          onLoadProgress={(percent) => {
            console.log(`[PDFViewerScreen] Loading: ${Math.round(percent * 100)}%`);
          }}
        />

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={styles.loadingText}>PDF yükleniyor...</Text>
          </View>
        )}

        {/* Page Info */}
        {!loading && totalPages > 0 && (
          <View style={styles.pageInfo}>
            <Text style={styles.pageInfoText}>
              {currentPage} / {totalPages}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default PDFViewerScreen;
