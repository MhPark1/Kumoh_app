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
        if (navigation) navigation.navigate('Login');
        return null;
      }

      return accessToken;
    } else {
      console.log('토큰이 스토리지에 없습니다.');
      if (navigation) navigation.navigate('Login');
      return null;
    }
  } catch (error) {
    console.error('토큰 처리 오류:', error.message);
    if (navigation) navigation.navigate('Login');
    return null;
  }
};

const ApiUtils = {
  // 회원가입
  register: async userData => {
    try {
      // Backend endpoint: /api/app/users/register
      const response = await apiInstance.post(
        '/api/app/users/register',
        userData,
      );
      return response.data; // { success: true, data: { ... }, message: "..." }
    } catch (error) {
      console.error('Register error:', error.response || error);
      throw error.response?.data || error;
    }
  },

  // 로그인
  login: async credentials => {
    try {
      // Backend endpoint: /api/auth/login
      const response = await apiInstance.post('/api/auth/login', credentials);
      return response.data; // { success: true, data: { accessToken, user }, message: "..." }
    } catch (error) {
      console.log('Axios baseURL:', apiInstance.defaults.baseURL);
      console.error('Login error:', error.response || error);
      throw error.response?.data || error;
    }
  },

  // 내 정보 조회 (이름, 안전점수 등)
  getMe: async navigation => {
    try {
      const accessToken = await getAccessToken(navigation);
      if (!accessToken) return;

      const response = await apiInstance.get('/api/app/users/me', {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      });
      // 백엔드 응답 구조: { success: true, data: { user_id, nickname, safety_score ... } }
      return response.data;
    } catch (error) {
      console.error('getMe error:', error.response || error);
      throw error.response?.data || error;
    }
  },

  // [수정] 주행 시작 (POST /api/app/rides/start)
  startRide: async (data, navigation) => {
    // data: { kickboardId, startLocation: { latitude, longitude } }
    try {
      const accessToken = await getAccessToken(navigation);
      if (!accessToken) return;

      const response = await apiInstance.post('/api/app/rides/start', data, {
        headers: {Authorization: `Bearer ${accessToken}`},
      });
      return response.data; // { success: true, data: { rideId, ... } }
    } catch (error) {
      console.error('startRide error:', error);
      throw error.response?.data || error;
    }
  },

  // [수정] 주행 종료 (POST /api/app/rides/:rideId/end)
  endRide: async (rideId, data, navigation) => {
    // data: { endLocation: { latitude, longitude } }
    try {
      const accessToken = await getAccessToken(navigation);
      if (!accessToken) return;

      const response = await apiInstance.post(
        `/api/app/rides/${rideId}/end`,
        data,
        {
          headers: {Authorization: `Bearer ${accessToken}`},
        },
      );
      return response.data; // { success: true, data: { fare, score, ... } }
    } catch (error) {
      console.error('endRide error:', error);
      throw error.response?.data || error;
    }
  },

  // [수정] 내 주행 이력 조회 (GET /api/app/users/me/rides)
  getMyRides: async navigation => {
    try {
      const accessToken = await getAccessToken(navigation);
      if (!accessToken) return;

      const response = await apiInstance.get('/api/app/users/me/rides', {
        headers: {Authorization: `Bearer ${accessToken}`},
      });
      return response.data; // { success: true, data: [ ... ] }
    } catch (error) {
      console.error('getMyRides error:', error);
      throw error.response?.data || error;
    }
  },

  // 주행 로그 저장 (GPS 측정 결과 전부 저장)
  saveTripLog: async (data, navigation) => {
    try {
      const accessToken = await getAccessToken(navigation);
      if (!accessToken) return;

      // TODO: 백엔드 경로 확인 필요 (현재 임시 경로 유지)
      const response = await apiInstance.post('/action/gps_update', data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`, // Bearer 스키마 추가 권장
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
      const accessToken = await getAccessToken(navigation);
      if (!accessToken) return;

      const response = await apiInstance.post(
        '/action/trip_and_score_update',
        result,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
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
      const accessToken = await getAccessToken(navigation);
      if (!accessToken) return;

      const response = await apiInstance.post('/action/get_history', result, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
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
            Authorization: `Bearer ${accessToken}`,
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
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      console.log(response.data.data);
      return response.data;
    } catch (error) {
      console.error(
        'getHistoryByPeriod error:',
        error.response?.status,
        error.response?.data || error.message,
      );
      throw error.response?.data || error;
    }
  },
};

export default ApiUtils;
