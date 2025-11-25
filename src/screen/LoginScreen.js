import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button} from '../component/Button';
import {Input} from '../component/Input';
import {Card} from '../component/Card';
import {colors} from '../component/constants/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Api from '../api/ApiUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useNavigation} from '@react-navigation/native';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import {useLocation} from '../context/LocationProvider';
import {AuthContext} from '../context/AuthContext';

const LoginScreen = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();
  const {startLocationTracking} = useLocation();
  const {login} = useContext(AuthContext);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  const requestLocationPermission = async () => {
    let status;
    if (Platform.OS === 'ios') {
      status = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
    } else if (Platform.OS === 'android') {
      status = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
    }

    if (status !== RESULTS.GRANTED) {
      Alert.alert('위치 권한 오류', '위치 권한을 허용해야 합니다.');
    }
  };

  const handleLogin = async () => {
    // 백엔드가 기대하는 필드명: loginId, password
    const credentials = {
      loginId: userId,
      password: password,
    };

    try {
      const response = await Api.login(credentials);
      console.log('로그인 응답 데이터:', response);

      // 백엔드 공통 응답: { success: true, data: { accessToken, user: {...} } }
      if (response.success) {
        const {accessToken, user} = response.data;

        console.log('토큰:', accessToken);

        // Context의 login 함수 호출 (토큰 저장 및 상태 업데이트)
        await login(accessToken);

        // 사용자 ID 및 정보 저장
        await AsyncStorage.setItem('user_id', user?.userId || userId);
        await AsyncStorage.setItem('user_info', JSON.stringify(user));
        await AsyncStorage.setItem('first_login', 'false');

        startLocationTracking();
      } else {
        Alert.alert(
          '로그인 실패',
          response.message || '로그인 정보를 확인해주세요.',
        );
      }
    } catch (error) {
      console.error('로그인 에러 객체:', error);

      // 에러 메시지 처리
      const errorMessage =
        error.error?.message || // 백엔드 에러 객체 구조 { error: { message: ... } }
        error.message ||
        '로그인 중 오류가 발생했습니다.';

      Alert.alert('로그인 실패', errorMessage);
    }
  };

  return (
    <LinearGradient
      colors={[colors.green600, colors.emerald700]}
      style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {/* Logo & Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Ionicons name="flash" size={40} color={colors.green600} />
              </View>
              <Text style={styles.title}>S:Drive</Text>
              <Text style={styles.subtitle}>안전한 킥보드 라이딩의 시작</Text>
            </View>
            {/* Login Form */}
            <Card style={styles.card}>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>아이디</Text>
                  <Input
                    icon="mail-outline"
                    placeholder="ID"
                    placeholderTextColor={'#ddd'}
                    value={userId}
                    onChangeText={setUserId}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>비밀번호</Text>
                  <Input
                    icon="lock-closed-outline"
                    placeholder="PASSWORD"
                    placeholderTextColor={'#ddd'}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                <Button title="로그인" onPress={handleLogin} />

                <View style={styles.signupContainer}>
                  <Text style={styles.signupText}>
                    아직 계정이 없으신가요?{' '}
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Agreement')}>
                    <Text style={styles.signupLink}>회원가입</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Card>

            {/* Footer */}
            <Text style={styles.footer}>
              로그인하면 이용약관 및 개인정보처리방침에 동의하게 됩니다
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.green100,
  },
  card: {
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: colors.gray700,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  signupText: {
    fontSize: 14,
    color: colors.gray600,
  },
  signupLink: {
    fontSize: 14,
    color: colors.green600,
    fontWeight: '600',
  },
  footer: {
    fontSize: 12,
    color: colors.green100,
    textAlign: 'center',
  },
});

export default LoginScreen;
