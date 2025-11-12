import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API 인스턴스 생성
const apiInstance = axios.create({
  baseURL: 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 가져오기 함수
const getAccessToken = async navigation => {
  try {
    const tokenString = await AsyncStorage.getItem('token');
    if (tokenString) {
      const tokenObject = JSON.parse(tokenString);
      const accessToken = tokenObject?.accessToken;

      if (!accessToken) {
        await AsyncStorage.removeItem('token');
        navigation.navigate('Login');
        return null;
      }

      return accessToken;
    } else {
      console.log('토큰이 스토리지에 없습니다.');
      navigation.navigate('Login');
      return null;
    }
  } catch (error) {
    console.error('토큰 처리 오류:', error.message);
    navigation.navigate('Login');
    return null;
  }
};

const ApiUtils = {
  // 회원가입
  register: async userData => {
    try {
      const response = await apiInstance.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Register error:', error.response || error);
      throw error.response?.data || error;
    }
  },
  // 로그인
  login: async credentials => {
    try {
      const response = await apiInstance.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      console.log('Axios baseURL:', apiInstance.defaults.baseURL);
      console.error('Login error:', error.response || error);
      throw error.response?.data || error;
    }
  },
  // 주행 로그 저장 (GPS 측정 결과 전부 저장)
  saveTripLog: async (data, navigation) => {
    try {
      // getAccessToken 함수 호출
      const accessToken = await getAccessToken(navigation);

      // accessToken이 없으면 중단
      if (!accessToken) return;

      // 데이터 전송
      const response = await apiInstance.post('/action/gps_update', data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: accessToken, // 토큰을 헤더에 포함
        },
      });

      return response.data;
    } catch (error) {
      console.error(
        'save trip log error:',
        error.response?.status,
        error.response?.data || error.message,
      );
      throw error.response?.data || error;
    }
  },
  // 주행 결과 저장
  saveResult: async (result, navigation) => {
    try {
      // getAccessToken 함수 호출
      const accessToken = await getAccessToken(navigation);

      // accessToken이 없으면 중단
      if (!accessToken) return;

      const response = await apiInstance.post(
        '/action/trip_and_score_update',
        result,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: accessToken,
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error(
        'result save error:',
        error.response?.status,
        error.response?.data || error.message,
      );
      throw error.response?.data || error;
    }
  },
  // 주행 기록 호출
  getHistory: async (result, navigation) => {
    try {
      // getAccessToken 함수 호출
      const accessToken = await getAccessToken(navigation);

      // accessToken이 없으면 중단
      if (!accessToken) return;

      const response = await apiInstance.post('/action/get_history', result, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: accessToken,
        },
      });
      console.log(response.data.data);
      return response.data;
    } catch (error) {
      console.error(
        'getHistory error:',
        error.response?.status,
        error.response?.data || error.message,
      );
      throw error.response?.data || error;
    }
  },
  // 메인 스크린 주행 기록 호출
  getMainScreenData: async (result, navigation) => {
    try {
      const accessToken = await getAccessToken(navigation);
      if (!accessToken) return;
      const response = await apiInstance.post(
        '/action/get_history_main',
        result,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: accessToken,
          },
        },
      );
      console.log(response.data.data);
      return response.data;
    } catch (error) {
      console.error(
        'getMainScreenData error:',
        error.response?.status,
        error.response?.data || error.message,
      );
      throw error.response?.data || error;
    }
  },
  // 주행 기록 (주간별 호출)
  getHistoryByPeriod: async (result, navigation) => {
    try {
      const accessToken = await getAccessToken(navigation);
      if (!accessToken) return;
      const response = await apiInstance.post(
        '/action/get_history_by_period',
        result,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: accessToken,
          },
        },
      );
      console.log(response.data.data);
      return response.data;
    } catch (error) {
      console.error(
        'getMainScreenData error:',
        error.response?.status,
        error.response?.data || error.message,
      );
      throw error.response?.data || error;
    }
  },
};

export default ApiUtils;
