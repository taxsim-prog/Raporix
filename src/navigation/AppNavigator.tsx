import React, { useState, useEffect, useCallback } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import  StorageService  from '../utils/StorageService';
import { authEventEmitter } from '../utils/AuthEventEmitter';
import { useTheme } from '../theme/ThemeContext';
import LoginScreen from '../screens/LoginScreen';

import RegisterScreen from '../screens/RegisterScreen';
import SimpleRegisterScreen from '../screens/SimpleRegisterScreen';
import CompanyInfoScreen from '../screens/company/CompanyInfoScreen';
import EditCompanyScreen from '../screens/company/EditCompanyScreen';

import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePasswordScreen';
import ThemeScreen from '../screens/profile/ThemeScreen';
import HelpCenterScreen from '../screens/profile/HelpCenterScreen';
import FeedbackScreen from '../screens/profile/FeedbackScreen';
import AboutScreen from '../screens/profile/AboutScreen';
import NotificationSettingsScreen from '../screens/profile/NotificationSettingsScreen';

import WorkOrdersScreen from '../screens/company/WorkOrdersScreen';
import CreateWorkOrderScreen from '../screens/company/CreateWorkOrderScreen';
import EditWorkOrderScreen from '../screens/company/EditWorkOrderScreen';
import EquipmentScreen from '../screens/company/EquipmentScreen';
import CreateEquipmentScreen from '../screens/company/CreateEquipmentScreen';
import EditEquipmentScreen from '../screens/company/EditEquipmentScreen';
import EmployeesScreen from '../screens/company/EmployeesScreen';
import AddEmployeeScreen from '../screens/company/AddEmployeeScreen';
import CompanyReportsScreen from '../screens/company/CompanyReportsScreen';
import PDFViewerScreen from '../screens/company/PDFViewerScreen';
import CertificatesScreen from '../screens/company/CertificatesScreen';
import EmployeeCertificatesScreen from '../screens/company/EmployeeCertificatesScreen';
import CreateCertificateScreen from '../screens/company/CreateCertificateScreen';
import ReportHeaderTemplateScreen from '../screens/company/ReportHeaderTemplateScreen';
import EmployeeTabNavigator from '../screens/EmployeeTabNavigator';
import AdminTabNavigator from '../screens/AdminTabNavigator';
import EmailVerificationScreen from '../screens/EmailVerification';

import AuthApi from '../api/auth';

const Stack = createStackNavigator();

const AppNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null); // null = loading state
  const [userType, setUserType] = useState<'admin' | 'employee' | null>(null);

  // Uygulama başladığında otomatik giriş kontrolü
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // Auth event listener - token expired durumunda logout
  useEffect(() => {
    const unsubscribe = authEventEmitter.addLogoutListener(() => {
      console.log('[AppNavigator] Auth event alındı, logout yapılıyor...');
      setIsLoggedIn(false);
      setUserType(null);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const checkLoginStatus = async () => {
    try {
      const userToken = await StorageService.getItem('userToken');
      if (userToken) {
        // Token varsa user bilgisini de yükle
        const currentUser = await StorageService.getItem('currentUser');
        if (currentUser && typeof currentUser === 'object' && 'role' in currentUser) {
          const role = (currentUser.role as 'admin' | 'employee') || 'employee';
          setUserType(role);
        }
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Giriş durumu kontrolü hatası:', error);
      setIsLoggedIn(false);
    }
  };

  const logout = async () => {
    try {
      await StorageService.removeItem('userToken');
      await StorageService.removeItem('currentUser');
      await StorageService.removeItem('userEmail');
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Çıkış hatası:', error);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      console.log("[AppNavigator] Login isteği başlatılıyor...");
      const res = await AuthApi.loginJson(email, password);
      console.log("[AppNavigator] Login başarılı:", res);
      console.log("[AppNavigator] User nedir lan? ", res.user);
      // Storage işlemlerini sırayla yap
      await StorageService.setItem('userToken', res.access_token);
      await StorageService.setItem('currentUser', res.user);
      await StorageService.setItem('userEmail', email);
      console.log("[AppNavigator] Storage'a kaydedildi - userEmail:", email);
      
      // Role'ü belirle ve state'leri güncelle
      const role = (res.user?.role as 'admin' | 'employee') || 'employee';
      
      // State güncellemelerini sıralı yap - önce userType sonra isLoggedIn
      setUserType(role);
      // SetTimeout ile state güncellemesinin tamamlanmasını bekle
      setTimeout(() => {
        setIsLoggedIn(true);
      }, 0);
    } catch (e: any) {
      console.error('[AppNavigator] Login hatası:', e?.message || e);
      setIsLoggedIn(false);
      // Hatayı LoginScreen'e ilet
      throw e;
    }
  };

  // Loading state gösterimi için gerekirse burada bir loading screen eklenebilir
  if (isLoggedIn === null) {
    return null; // Veya bir Loading component'i
  }

  // React Navigation teması
  const navigationTheme = {
    dark: isDark,
    colors: {
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      notification: theme.primary,
    },
    fonts: DefaultTheme.fonts, // Varsayılan fontları kullan
  };
  
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isLoggedIn ? (
          <>
          <Stack.Screen
            name="Login"
            children={({ navigation }) => (
              <LoginScreen
                navigation={navigation}
                onLogin={handleLogin}
              />
            )}
          />
          <Stack.Screen 
              name="Register" 
              children={({ navigation }) => (
                <RegisterScreen navigation={navigation} />
              )}
            />
          <Stack.Screen 
              name="SimpleRegister" 
              children={({ navigation }) => (
                <SimpleRegisterScreen navigation={navigation} />
              )}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              children={({ navigation }) =>
                userType === 'admin'
                  ? (
                    <AdminTabNavigator
                      navigation={navigation}
                      onLogout={logout}
                    />
                  ) : (
                    <EmployeeTabNavigator
                      navigation={navigation}
                      onLogout={logout}
                    />
                  )
              }
            />
            <Stack.Screen 
              name="EditProfile" 
              children={({ navigation }) => (
                <EditProfileScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="ChangePassword" 
              children={({ navigation }) => (
                <ChangePasswordScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="Theme" 
              children={({ navigation }) => (
                <ThemeScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="HelpCenter" 
              children={({ navigation }) => (
                <HelpCenterScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="Feedback" 
              children={({ navigation }) => (
                <FeedbackScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="About" 
              children={({ navigation }) => (
                <AboutScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="NotificationSettings" 
              children={({ navigation }) => (
                <NotificationSettingsScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="Equipment" 
              children={({ navigation }) => (
                <EquipmentScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="CreateEquipment" 
              children={({ navigation }) => (
                <CreateEquipmentScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="EditEquipment" 
              children={({ navigation, route }) => (
                <EditEquipmentScreen navigation={navigation} route={route as any} />
              )}
            />
            <Stack.Screen 
              name="WorkOrders" 
              children={({ navigation }) => (
                <WorkOrdersScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="CreateWorkOrder" 
              children={({ navigation }) => (
                <CreateWorkOrderScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="EditWorkOrder" 
              children={({ navigation, route }) => (
                <EditWorkOrderScreen navigation={navigation} route={route as any} />
              )}
            />
            <Stack.Screen 
              name="Employees" 
              children={({ navigation }) => (
                <EmployeesScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="AddEmployee" 
              children={({ navigation }) => (
                <AddEmployeeScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="CompanyReports" 
              children={({ navigation }) => (
                <CompanyReportsScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="PDFViewer" 
              children={({ navigation, route }: any) => (
                <PDFViewerScreen navigation={navigation} route={route} />
              )}
            />
            <Stack.Screen 
              name="Certificates" 
              children={({ navigation }) => (
                <CertificatesScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="EmployeeCertificates" 
              children={({ navigation, route }: any) => (
                <EmployeeCertificatesScreen navigation={navigation} route={route} />
              )}
            />
            <Stack.Screen 
              name="CreateCertificate" 
              children={({ navigation, route }: any) => (
                <CreateCertificateScreen navigation={navigation} route={route} />
              )}
            />
            <Stack.Screen 
              name="ReportHeaderTemplate" 
              children={({ navigation }) => (
                <ReportHeaderTemplateScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="EmailVerification"
              children={({ navigation, route }) => (
                <EmailVerificationScreen navigation={navigation} route={route} />
              )}
            />
            <Stack.Screen 
              name="CompanyInfo" 
              children={({ navigation }) => (
                <CompanyInfoScreen navigation={navigation} />
              )}
            />
            <Stack.Screen 
              name="EditCompany" 
              children={({ navigation, route }) => (
                <EditCompanyScreen navigation={navigation} route={route as any} />
              )}
            />
            {/* WorkOrderDetail, ReportGeneralInfo, MainPanelControl, PanelList, ReportControlNavigator 
                sayfaları AdminTabNavigator ve EmployeeTabNavigator içindeki Stack'lerde tanımlı.
                Duplicate tanımlamayı kaldırdık. */}

          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;