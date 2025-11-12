import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  // TextInput,
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
import {useLocation} from '../context/LocationProvider'; // Context import
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
    const credentials = {
      login_id: userId,
      user_pw: password,
    };

    try {
      const response = await Api.login(credentials);
      console.log('로그인 응답 데이터:', response); // 디버깅용 로그

      // [수정 1] 백엔드는 success: true 로 응답합니다 (result 아님)
      if (response.success) {
        // [수정 2] 토큰과 유저 정보는 response.data 안에 들어있습니다.
        const {token, user} = response.data;

        console.log('토큰:', token);

        await login(token);
        // [수정 3] user_id 저장 (user 객체 안에 있는 user_id 사용)
        await AsyncStorage.setItem('user_id', user?.user_id || userId);
        await AsyncStorage.setItem('first_login', 'false');

        startLocationTracking();
      } else {
        // success가 false인 경우 메시지 출력
        Alert.alert(
          '로그인 실패',
          response.message || '로그인 정보를 확인해주세요.',
        );
      }
    } catch (error) {
      console.error('로그인 에러 객체:', error);

      // [수정 4] 에러 메시지 추출 방식 변경
      // 백엔드 에러 핸들러(error.handler.js)는 { error: { message: "..." } } 형태로 보냅니다.
      // ApiUtils에서 error.response.data를 throw하므로, 여기서 받아야 합니다.
      const errorMessage =
        error.error?.message || // 백엔드 표준 에러
        error.message || // 일반 에러
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
              <Text style={styles.title}>SafeRide</Text>
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

                {/* <View style={styles.forgotContainer}>
                  <TouchableOpacity>
                    <Text style={styles.forgotText}>비밀번호 찾기</Text>
                  </TouchableOpacity>
                </View> */}

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
  forgotContainer: {
    alignItems: 'flex-end',
  },
  forgotText: {
    fontSize: 14,
    color: colors.blue600,
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
