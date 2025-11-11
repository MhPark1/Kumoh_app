import React, { useState, useEffect, useContext } from 'react';
import { View, TextInput, Text, TouchableOpacity, Alert, StyleSheet, Platform } from 'react-native';
import Api from '../api/ApiUtils';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useLocation } from '../context/LocationProvider'; // Context import
import { AuthContext } from '../context/AuthContext';

const LoginScreen = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();
  const { startLocationTracking } = useLocation();
  const { login } = useContext(AuthContext);

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
      id: userId,
      password: password,
    };

    try {
      const response = await Api.login(credentials);
      console.log(response);
      if (response.result === 'success') {
        console.log('response::::',response)
        await login(response.token);
        await AsyncStorage.setItem('user_id', credentials.id);
        await AsyncStorage.setItem('first_login', 'false');
        // 로그인 성공 후 위치 수집 시작
        startLocationTracking();
      } else {
        Alert.alert('로그인 정보를 다시 한번 확인해주세요.');
      }
    } catch (error) {
      Alert.alert('로그인 실패', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>로그인</Text>
      <TextInput
        style={styles.input}
        placeholder="아이디"
        placeholderTextColor={"#ddd"}
        value={userId}
        onChangeText={setUserId}
      />
      <TextInput
        style={styles.input}
        placeholder="비밀번호"
        placeholderTextColor={"#ddd"}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>로그인</Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <TouchableOpacity onPress={() => navigation.navigate('Agreement')}>
          <Text style={styles.footerText}>회원가입</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F7F7F7',
  },
  logo: {
    fontSize: 28,
    color: '#ff6a33',
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderColor: '#CED4DA',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
    color: '#000',
  },
  button: {
    backgroundColor: '#ff6a33',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
});

export default LoginScreen;
