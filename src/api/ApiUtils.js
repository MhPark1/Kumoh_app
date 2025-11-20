import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API 인스턴스 생성
const apiInstance = axios.create({
  baseURL: 'https://bong-gun-god.loca.lt/',
  // baseURL: 'http://localhost:8080',
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

  getUserProfile: async navigation => {
    const token = await getAccessToken(navigation);
    if (!token) return;

    const response = await apiInstance.get('/api/app/users/me/profile', {
      headers: {Authorization: `Bearer ${token}`},
    });
    return response.data;
  },

  //회원정보 수정
  updateMyInfo: async (updateData, navigation) => {
    try {
      const accessToken = await getAccessToken(navigation);
      if (!accessToken) return;

      const response = await apiInstance.put('/api/app/users/me', updateData, {
        headers: {Authorization: `Bearer ${accessToken}`},
      });

      return {success: true, user: response.data.data};
    } catch (error) {
      console.error('updateMyInfo error:', error);
      throw error.response?.data || error;
    }
  },

  // [신규] 주변 킥보드 조회
  getNearbyKickboards: async location => {
    // location: { latitude, longitude }
    try {
      // 로그인 전이라도 조회 가능하게 하려면 토큰 체크 생략 가능
      // 하지만 보통은 로그인 후 이용하므로 토큰 포함 권장
      const accessToken = await AsyncStorage.getItem('token');
      const token = accessToken ? JSON.parse(accessToken).accessToken : null;

      const response = await apiInstance.get('/api/app/kickboards', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        headers: token ? {Authorization: `Bearer ${token}`} : {},
      });
      return response.data; // { success: true, data: [...] }
    } catch (error) {
      console.error('getNearbyKickboards error:', error);
      throw error.response?.data || error;
    }
  },

  /**
   * [신규 추가] 헬멧 인증 API 호출
   * @param {FormData} formData - 이미지 파일이 담긴 FormData
   */
  verifyHelmet: async (formData, navigation) => {
    try {
      const accessToken = await getAccessToken(navigation);
      if (!accessToken) return;

      console.log('🚀 서버로 사진 전송 시작...'); // 로그 추가

      // Axios 대신 fetch 사용
      const response = await fetch(
        'https://bong-gun-god.loca.lt/api/app/kickboards/helmet',
        // 'http://localhost:8080/api/app/kickboards/helmet',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
        },
      );

      const responseJson = await response.json();
      console.log('📩 서버 응답 수신:', responseJson);

      if (!response.ok) {
        throw responseJson;
      }

      // 성공 시 Axios 응답 구조({ data: ... })와 맞춰서 리턴
      return {data: responseJson.data, success: true};
    } catch (error) {
      console.error('❌ verifyHelmet error:', error);
      throw error;
    }
  },

  // 주행 시작 (POST /api/app/rides/start)
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

  // 주행 종료 (POST /api/app/rides/:rideId/end)
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

  // 내 주행 이력 조회 (GET /api/app/users/me/rides)
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
  getAnalysisStats: async (navigation, dateRange = {}) => {
    const token = await getAccessToken(navigation);
    if (!token) return;

    const {startDate, endDate} = dateRange;

    const response = await apiInstance.get('/api/app/users/me/analysis', {
      headers: {Authorization: `Bearer ${token}`},
    });
    return response.data; // { success: true, data: { safetyScore, ... } }
  },
  getRideSummary: async (rideId, navigation) => {
    const token = await getAccessToken(navigation);
    if (!token) return;

    try {
      const response = await apiInstance.get(
        `/api/app/rides/${rideId}/summary`, // 새 API 엔드포인트
        {
          headers: {Authorization: `Bearer ${token}`},
        },
      );
      return response.data; // { success: true, data: { summary: {...}, riskCounts: {...} } }
    } catch (error) {
      console.error('getRideSummary error:', error);
      throw error.response?.data || error;
    }
  },
};

export default ApiUtils;
