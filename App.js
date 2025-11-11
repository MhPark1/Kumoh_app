import React, { useContext, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { LocationProvider } from './src/context/LocationProvider';
import Icon from 'react-native-vector-icons/AntDesign';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './src/screen/LoginScreen';
import AgreementScreen from './src/screen/AgreementScreen';
import OptionScreen from './src/view/OptionScreen';
import GuideScreen from './src/view/GuideScreen';
import MainScreen from './src/view/MainScreen';
import Gps from './src/view/GpsScreen';
import HistoryScreen from './src/view/HistoryScreen';
import Analysis from './src/view/AnalysisScreen';

import { LogBox } from 'react-native';
LogBox.ignoreLogs(['Sending `onAnimatedValueUpdate` with no listeners registered']);

const AuthStack = createStackNavigator();
const Tab = createBottomTabNavigator();
const SelectionStack = createStackNavigator();
const OptionStack = createStackNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerTintColor: '#ff6a33',
    }}
  >
    <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <AuthStack.Screen name="Agreement" component={AgreementScreen} options={{ title: '회원가입' }} />
  </AuthStack.Navigator>
);

// Selection 탭 안에 중첩되는 Stack Navigator
const SelectionStackNavigator = () => (
  <SelectionStack.Navigator
    screenOptions={{
      headerTintColor: '#ff6a33',
    }}
  >
    <SelectionStack.Screen name="Selection" component={MainScreen} options={{ title: '홈', headerShown: false }} />
    <SelectionStack.Screen name="Gps" component={Gps} options={{ title: '운행', headerShown: false }} />
    <SelectionStack.Screen name="Analysis" component={Analysis} options={{ title: '분석결과', headerShown: false, gestureEnabled: false, }} />
  </SelectionStack.Navigator>
);
const OptionStackNavigator = () => (
  <OptionStack.Navigator>
    <OptionStack.Screen name="Option" component={OptionScreen} options={{ title: '설정', headerShown: false }} />
    <OptionStack.Screen name="Guide" component={GuideScreen} options={{ title: '주행 가이드', headerShown: false }} />
  </OptionStack.Navigator>
);
// 하단 탭에는 SelectionStack과 History만 등록
const MainTabNavigator = () => {

  const navigation = useNavigation();

  useEffect(() => {
    const checkFirstLogin = async () => {
      const firstLogin = await AsyncStorage.getItem('first_login');
      if (firstLogin === null || firstLogin === 'true') {
        await AsyncStorage.setItem('first_login', 'false');
        navigation.navigate('SelectionTab', {
          screen: 'Selection',
        });
      }
    };

    checkFirstLogin();
  }, []);

  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'SelectionTab') {
            iconName = 'home';
          } else if (route.name === 'History') {
            iconName = 'appstore-o';
          } else if (route.name === 'OptionTab') {
            iconName = 'setting';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#ff6a33',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          paddingBottom: insets.bottom, // 하단 안전 영역 패딩 적용
        },
        tabBarLabelStyle: {
          fontSize: 14, // 원하는 폰트 크기로 설정
          fontWeight: 'bold', // 필요하면 글씨 두께 설정 가능
        },
      })}
    >
      <Tab.Screen
        name="SelectionTab"
        component={SelectionStackNavigator}
        options={{ title: '홈', headerShown: false }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: '주행기록', headerShown: false }}
      />
      <Tab.Screen
        name="OptionTab"
        component={OptionStackNavigator}
        options={{ title: '설정', headerShown: false }}
      />
    </Tab.Navigator>
  );
};

const AppContent = () => {
  const { isLoggedIn, loading } = useContext(AuthContext);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <LocationProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LocationProvider>

    </SafeAreaProvider>
  );
}
