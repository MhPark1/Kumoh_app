import React, {createContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useLocation} from './LocationProvider';

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const {startLocationTracking} = useLocation();

  useEffect(() => {
    const checkToken = async () => {
      try {
        const tokenString = await AsyncStorage.getItem('token');
        if (tokenString) {
          // Token이 존재하면 로그인 상태를 true로 설정
          setIsLoggedIn(true);
          // Token이 존재할 때 위치 추적 시작
          startLocationTracking();
        } else {
          // Token이 없으면 로그인 상태를 false로 설정
          setIsLoggedIn(false);
        }
      } catch (error) {
        // Token을 가져오는 도중 에러가 발생하면 에러를 콘솔에 출력
        console.error('Token check error:', error);
        setIsLoggedIn(false);
      } finally {
        // Token 확인이 끝난 후에는 로딩 상태를 false로 설정
        setLoading(false);
      }
    };

    // 컴포넌트가 마운트될 때 checkToken 함수를 호출
    checkToken();
  }, [startLocationTracking]);

  const login = async token => {
    try {
      await AsyncStorage.setItem('token', JSON.stringify({accessToken: token}));
      setIsLoggedIn(true);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('token');
      setIsLoggedIn(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{isLoggedIn, loading, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
};
