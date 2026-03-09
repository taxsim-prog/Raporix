import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';

// Sayfa bileşenleri
import HomeScreen from './AdminHomeScreen';
import ReportsScreen from './ReportsScreen';
import CompanyScreen from './CompanyScreen';
import ProfileScreen from './ProfileScreen';
import WorkOrderDetailScreen from './work_order/WorkOrderDetailScreen';
import ReportGeneralInfoScreen from './work_order/ReportGeneralInfoScreen';
import MainPanelControl from './work_order/MainPanelControl';
import PanelListScreen from './work_order/PanelListScreen';
import ReportControlNavigator from './work_order/ReportControlNavigator';
import ReportControlListScreen from './work_order/ReportControlListScreen';
import GroundingNavigatorScreen from './work_order/GroundingNavigatorScreen';
import LightningProtectionNavigatorScreen from './work_order/LightningProtectionNavigatorScreen';
import GeneratorNavigatorScreen from './work_order/GeneratorNavigatorScreen';
import FireDetectionNavigatorScreen from './work_order/FireDetectionNavigatorScreen';
import WorkOrdersScreen from './company/WorkOrdersScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const CompanyStack = createNativeStackNavigator();

const HIDDEN_ON_TABS = [
  'WorkOrderDetail',
  'ReportGeneralInfo',
  'MainPanelControl',
  'ReportControlNavigator',
  'GroundingNavigator',
  'LightningProtectionNavigator',
  'GeneratorNavigator',
  'FireDetectionNavigator',
  'WorkOrders',
];

function CompanyStackScreen() {
  const { theme } = useTheme();

  return (
    <CompanyStack.Navigator>
      <CompanyStack.Screen
        name="CompanyHome"
        component={CompanyScreen}
        options={{
          title: 'Şirket Bilgileri',
          headerStyle: {
            ...styles.header,
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.headerText,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <CompanyStack.Screen
        name="WorkOrders"
        component={WorkOrdersScreen}
        options={{
          headerShown: false, // WorkOrdersScreen kendi header'ını gösteriyor
        }}
      />
      <CompanyStack.Screen
        name="WorkOrderDetail"
        component={WorkOrderDetailScreen}
        options={{
          title: 'İş Emri Detayı',
          headerStyle: {
            ...styles.header,
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.headerText,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <CompanyStack.Screen
        name="ReportGeneralInfo"
        component={ReportGeneralInfoScreen}
        options={{
          title: 'Genel Bilgiler',
          headerStyle: {
            ...styles.header,
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.headerText,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <CompanyStack.Screen
        name="MainPanelControl"
        component={MainPanelControl}
        options={{
          title: 'Ana Pano Kontrol',
          headerStyle: {
            ...styles.header,
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.headerText,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <CompanyStack.Screen
        name="PanelList"
        component={PanelListScreen}
        options={{
          title: 'Panel Listesi',
          headerStyle: {
            ...styles.header,
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.headerText,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <CompanyStack.Screen
        name="ReportControlNavigator"
        component={ReportControlNavigator}
        options={{
          headerShown: true,
        }}
      />
      <CompanyStack.Screen
        name="GroundingNavigator"
        component={GroundingNavigatorScreen}
        options={{
          headerShown: true,
        }}
      />
      <CompanyStack.Screen
        name="LightningProtectionNavigator"
        component={LightningProtectionNavigatorScreen}
        options={{
          headerShown: true,
        }}
      />
      <CompanyStack.Screen
        name="GeneratorNavigator"
        component={GeneratorNavigatorScreen}
        options={{
          headerShown: true,
        }}
      />
      <CompanyStack.Screen
        name="FireDetectionNavigator"
        component={FireDetectionNavigatorScreen}
        options={{
          headerShown: true,
        }}
      />
      <CompanyStack.Screen
        name="ReportControlListScreen"
        component={ReportControlListScreen}
        options={{
          headerShown: false,
        }}
      />
    </CompanyStack.Navigator>
  );
}

function HomeStackScreen() {
  const { theme } = useTheme();

  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="AdminHome"
        component={HomeScreen}
        options={{
          title: 'RapTor',
          headerStyle: {
            ...styles.header,
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.headerText,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <HomeStack.Screen
        name="WorkOrderDetail"
        component={WorkOrderDetailScreen}
        options={{
          title: 'İş Emri Detayı',
          headerStyle: {
            ...styles.header,
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.headerText,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <HomeStack.Screen
        name="ReportGeneralInfo"
        component={ReportGeneralInfoScreen}
        options={{
          title: 'Genel Bilgiler',
          headerStyle: {
            ...styles.header,
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.headerText,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <HomeStack.Screen
        name="MainPanelControl"
        component={MainPanelControl}
        options={{
          title: 'Ana Pano Kontrol',
          headerStyle: {
            ...styles.header,
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.headerText,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <HomeStack.Screen
        name="PanelList"
        component={PanelListScreen}
        options={{
          title: 'Panel Listesi',
          headerStyle: {
            ...styles.header,
            backgroundColor: theme.headerBackground,
          },
          headerTintColor: theme.headerText,
          headerTitleStyle: styles.headerTitle,
        }}
      />
      <HomeStack.Screen
        name="ReportControlNavigator"
        component={ReportControlNavigator}
        options={{
          headerShown: true,
        }}
      />
      <HomeStack.Screen
        name="GroundingNavigator"
        component={GroundingNavigatorScreen}
        options={{
          headerShown: true,
        }}
      />
      <HomeStack.Screen
        name="LightningProtectionNavigator"
        component={LightningProtectionNavigatorScreen}
        options={{
          headerShown: true,
        }}
      />
      <HomeStack.Screen
        name="GeneratorNavigator"
        component={GeneratorNavigatorScreen}
        options={{
          headerShown: true,
        }}
      />
      <HomeStack.Screen
        name="FireDetectionNavigator"
        component={FireDetectionNavigatorScreen}
        options={{
          headerShown: true,
        }}
      />
      <HomeStack.Screen
        name="ReportControlListScreen"
        component={ReportControlListScreen}
        options={{
          headerShown: false,
        }}
      />
    </HomeStack.Navigator>
  );
}

// Add navigation prop interface
interface AdminTabNavigatorProps {
  navigation?: any;
  onLogout?: () => Promise<void> | void;
}

const AdminTabNavigator = ({ navigation, onLogout }: AdminTabNavigatorProps) => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          } else if (route.name === 'Company') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={20} color={color} />;
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textTertiary,
        tabBarStyle: {
          ...styles.tabBar,
          backgroundColor: theme.card,
          borderTopColor: theme.border,
        },
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: {
          ...styles.header,
          backgroundColor: theme.headerBackground,
        },
        headerTintColor: theme.headerText,
        headerTitleStyle: styles.headerTitle,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={({ route }) => {
          // HomeStack içindeki aktif ekran adını al
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'AdminHome';
          const shouldHide = HIDDEN_ON_TABS.includes(routeName);

          return {
            title: 'Anasayfa',
            headerShown: false, // Stack kendi header'ını gösteriyor
            // aktif ekrana göre tab bar'ı gizle/göster
            tabBarStyle: [
              {
                ...styles.tabBar,
                backgroundColor: theme.card,
                borderTopColor: theme.border,
              },
              shouldHide ? { display: 'none' } : null,
            ],
          };
        }}
      />
      <Tab.Screen
        name="Company"
        component={CompanyStackScreen}
        options={({ route }) => {
          // CompanyStack içindeki aktif ekran adını al
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'CompanyHome';
          const shouldHide = HIDDEN_ON_TABS.includes(routeName);

          return {
            title: 'Şirket',
            headerShown: false, // Stack kendi header'ını gösteriyor
            // aktif ekrana göre tab bar'ı gizle/göster
            tabBarStyle: [
              {
                ...styles.tabBar,
                backgroundColor: theme.card,
                borderTopColor: theme.border,
              },
              shouldHide ? { display: 'none' } : null,
            ],
          };
        }}
      />
      <Tab.Screen
        name="Profile"
        children={({ navigation: tabNavigation }) => (
          <ProfileScreen
            navigation={navigation || tabNavigation}
            onLogout={onLogout}
          />
        )}
        options={{
          title: 'Profil',
          headerTitle: 'Profil'
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: 90,
    paddingBottom: 20,
    paddingTop: 5,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  header: {},
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default AdminTabNavigator;