import React, {useContext, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createStackNavigator} from '@react-navigation/stack';
import {AuthProvider, AuthContext} from './src/context/AuthContext';
import {LocationProvider} from './src/context/LocationProvider';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import {
  useNavigation,
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {colors} from './src/component/constants/colors';

import LoginScreen from './src/screen/LoginScreen';
import AgreementScreen from './src/screen/AgreementScreen';
import OptionScreen from './src/view/OptionScreen';
import GuideScreen from './src/view/GuideScreen';
import MainScreen from './src/view/MainScreen';
import Gps from './src/view/GpsScreen';
import HistoryScreen from './src/view/HistoryScreen';
import Analysis from './src/view/AnalysisScreen';
import Camera from './src/view/CameraScreen';
import UserEditScreen from './src/view/UserEditScreen';
import MapScreen from './src/view/MapScreen';
import HelmetVerificationScreen from './src/view/HelmetVerificationScreen';
import RideSummaryScreen from './src/view/RideSummaryScreen';
import QRScannerScreen from './src/view/QRScannerScreen';

import {LogBox} from 'react-native';
LogBox.ignoreLogs([
  'Sending `onAnimatedValueUpdate` with no listeners registered',
]);

const AuthStack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 1. [신규] 최상위 네비게이터 (탭바 + 전체화면 페이지들)
const RootStack = createStackNavigator();

const SelectionStack = createStackNavigator();
const HistoryStack = createStackNavigator();
const OptionStack = createStackNavigator();

const AuthNavigator = () => (
  <AuthStack.Navigator
    screenOptions={{
      headerTintColor: colors.primary,
    }}>
    <AuthStack.Screen
      name="Login"
      component={LoginScreen}
      options={{headerShown: false}}
    />
    <AuthStack.Screen
      name="Agreement"
      component={AgreementScreen}
      options={{title: '회원가입'}}
    />
  </AuthStack.Navigator>
);

// 2. [수정] 홈 탭 내부 스택 (이제 메인 홈 화면만 남깁니다)
// Gps, Camera 등은 RootStack으로 이동했으므로 여기서 제거합니다.
const SelectionStackNavigator = () => (
  <SelectionStack.Navigator
    screenOptions={{
      headerTintColor: colors.primary,
    }}>
    <SelectionStack.Screen
      name="Selection"
      component={MainScreen}
      options={{title: '홈', headerShown: false}}
    />
    {/* 나머지 화면들은 탭바 밖(RootStack)으로 이동됨 */}
  </SelectionStack.Navigator>
);

const HistoryStackNavigator = () => (
  <HistoryStack.Navigator
    screenOptions={{
      headerTintColor: colors.primary,
    }}>
    <HistoryStack.Screen
      name="History"
      component={HistoryScreen}
      options={{title: '이용 내역', headerShown: false}}
    />
    <HistoryStack.Screen
      name="RideSummary"
      component={RideSummaryScreen}
      options={{title: '주행 요약', headerShown: false}}
    />
  </HistoryStack.Navigator>
);

const OptionStackNavigator = () => (
  <OptionStack.Navigator
    screenOptions={{
      headerTintColor: colors.primary,
    }}>
    <OptionStack.Screen
      name="Option"
      component={OptionScreen}
      options={{title: '내 정보', headerShown: false}}
    />
    {/* UserEdit, Guide는 탭바 위에 덮어씌워지는 형태가 좋으므로 RootStack으로 이동해도 되지만,
        설정 탭 안에 있는 느낌을 유지하려면 여기 둬도 됩니다. 
        다만, 기존 코드에서 탭을 숨기셨으므로 일관성을 위해 RootStack으로 뺄 수도 있습니다.
        여기서는 기존 로직 유지를 위해 일단 OptionStack 내부에 둡니다. 
        (만약 이 화면들도 탭바를 없애고 싶다면 RootStack으로 옮기세요)
    */}
    <OptionStack.Screen
      name="UserEdit"
      component={UserEditScreen}
      options={{title: '회원 정보 수정', headerShown: false}}
    />
    <OptionStack.Screen
      name="Guide"
      component={GuideScreen}
      options={{title: '주행 가이드', headerShown: false}}
    />
  </OptionStack.Navigator>
);

// 3. [수정] 메인 탭 네비게이터 (복잡한 숨김 로직 삭제)
const MainTabNavigator = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

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
  }, [navigation]);

  // getTabBarStyle 함수 삭제됨 (필요 없음)

  return (
    <Tab.Navigator
      screenOptions={({route}) => {
        // OptionTab 내부의 UserEdit, Guide 화면일 때만 탭바 숨김 처리
        const routeName = getFocusedRouteNameFromRoute(route);
        const optionHideScreens = ['UserEdit', 'Guide'];
        let tabBarStyle = {
          backgroundColor: '#fff',
          paddingBottom: insets.bottom,
          height: 60 + insets.bottom / 2, // 높이 약간 조정
        };

        if (route.name === 'OptionTab') {
          const name = routeName ?? 'Option';
          if (optionHideScreens.includes(name)) {
            tabBarStyle = {display: 'none'};
          }
        }

        return {
          tabBarIcon: ({focused, color, size}) => {
            let iconName;
            if (route.name === 'SelectionTab') {
              iconName = 'home-outline';
            } else if (route.name === 'HistoryTab') {
              iconName = 'time-outline';
            } else if (route.name === 'OptionTab') {
              iconName = 'person-circle-outline';
            }
            return <Icon name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#2563eb',
          tabBarInactiveTintColor: 'gray',
          tabBarStyle: tabBarStyle, // 수정된 스타일 적용
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: 'bold',
            marginBottom: 5,
          },
          headerShown: false,
        };
      }}>
      <Tab.Screen
        name="SelectionTab"
        component={SelectionStackNavigator}
        options={{title: '홈'}}
      />
      <Tab.Screen
        name="HistoryTab"
        component={HistoryStackNavigator}
        options={{title: '이용 내역'}}
      />
      <Tab.Screen
        name="OptionTab"
        component={OptionStackNavigator}
        options={{title: '내 정보'}}
      />
    </Tab.Navigator>
  );
};

// 4. [신규] 로그인 후 보여줄 RootNavigator
// 메인 탭과 전체화면(Gps 등)을 형제 관계로 배치합니다.
const RootNavigator = () => {
  return (
    <RootStack.Navigator screenOptions={{headerShown: false}}>
      {/* 1) 메인 탭 화면 */}
      <RootStack.Screen name="MainTab" component={MainTabNavigator} />

      {/* 2) 탭바 없이 전체화면으로 떠야 하는 화면들 */}
      <RootStack.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{presentation: 'fullScreenModal'}} // (선택) 모달처럼 뜨게 하려면 추가
      />
      <RootStack.Screen
        name="HelmetVerification"
        component={HelmetVerificationScreen}
      />
      <RootStack.Screen name="Camera" component={Camera} />
      <RootStack.Screen name="Map" component={MapScreen} />
      <RootStack.Screen name="Analysis" component={Analysis} />
      <RootStack.Screen
        name="Gps"
        component={Gps}
        options={{
          gestureEnabled: false, // 아이폰에서 스와이프로 뒤로가기 방지
        }}
      />
    </RootStack.Navigator>
  );
};

const AppContent = () => {
  const {isLoggedIn, loading} = useContext(AuthContext);

  if (loading) {
    return null;
  }

  return (
    <NavigationContainer>
      {/* isLoggedIn이 true면 RootNavigator(탭+전체화면), 아니면 AuthNavigator */}
      {isLoggedIn ? <RootNavigator /> : <AuthNavigator />}
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
