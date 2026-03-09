import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../theme/ThemeContext';

// Sayfa bileşenleri
import ProfileScreen from '../screens/ProfileScreen';
import EmployeeHomeScreen from './EmployeeHomeScreen';
import WorkOrderDetailScreen from './work_order/WorkOrderDetailScreen';
import ReportGeneralInfoScreen from './work_order/ReportGeneralInfoScreen';
import MainPanelControl from './work_order/MainPanelControl';
import PanelListScreen from './work_order/PanelListScreen';
import ReportControlNavigator from './work_order/ReportControlNavigator';
import GroundingNavigatorScreen from './work_order/GroundingNavigatorScreen';
import LightningProtectionNavigatorScreen from './work_order/LightningProtectionNavigatorScreen';
import GeneratorNavigatorScreen from './work_order/GeneratorNavigatorScreen';
import FireDetectionNavigatorScreen from './work_order/FireDetectionNavigatorScreen';

import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import ReportControlListScreen from './work_order/ReportControlListScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();

const HIDDEN_ON_TABS = [
  'WorkOrderDetail',
  'ReportGeneralInfo',
  'MainPanelControl',
  'ReportControlNavigator',
  'GroundingNavigator',
  'LightningProtectionNavigator',
  'GeneratorNavigator',
  'FireDetectionNavigator',
];

function HomeStackScreen() {
  const { theme } = useTheme();

  return (
    <HomeStack.Navigator>
      <HomeStack.Screen
        name="EmployeeHome"
        component={EmployeeHomeScreen}
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
          headerShown: true, // Navigator handles its own header
        }}
      />
      <HomeStack.Screen
        name="GroundingNavigator"
        component={GroundingNavigatorScreen}
        options={{
          headerShown: true, // Navigator handles its own header
        }}
      />
      <HomeStack.Screen
        name="LightningProtectionNavigator"
        component={LightningProtectionNavigatorScreen}
        options={{
          headerShown: true, // Navigator handles its own header
        }}
      />
      <HomeStack.Screen
        name="GeneratorNavigator"
        component={GeneratorNavigatorScreen}
        options={{
          headerShown: true, // Navigator handles its own header
        }}
      />
      <HomeStack.Screen
        name="FireDetectionNavigator"
        component={FireDetectionNavigatorScreen}
        options={{
          headerShown: true, // Navigator handles its own header
        }}
      />
      <HomeStack.Screen
        name="ReportControlListScreen"
        component={ReportControlListScreen}
        options={{
          headerShown: false, // Navigator handles its own header
        }}
      />
    </HomeStack.Navigator>
  );
}

// Add navigation prop interface
interface EmployeeTabNavigatorProps {
  navigation?: any;
  onLogout?: () => Promise<void> | void;
}

const EmployeeTabNavigator = ({ navigation, onLogout }: EmployeeTabNavigatorProps) => {
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
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'EmployeeHome';
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
        name="Profile"
        children={({ navigation: tabNavigation }) => (
          <ProfileScreen
            navigation={navigation || tabNavigation}
            onLogout={onLogout}
          />
        )}
        options={{
          title: 'Profil',
          headerTitle: 'Profil',
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

export default EmployeeTabNavigator;