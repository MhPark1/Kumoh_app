import React, {useEffect} from 'react';
import {Platform, PermissionsAndroid, AppState} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import BackgroundActions from 'react-native-background-actions';

let watchId = null; // 구독 ID를 저장할 변수
const locations = {
  latitude: [],
  longitude: [],
  timestamp: [],
};
let intervalId = null; // Interval ID를 저장할 변수
// 위치 추적 옵션 설정
const locationOptions = {
  accuracy: {
    ios: 'best',
    android: 'mediumAccuracy',
  }[Platform.OS],
  distanceFilter: 1, // meters
  interval: 1000, // 1 seconds
  fastestInterval: 5000, // 5 seconds
  forceRequestLocation: true,
};

// 위치 권한 요청 함수
const requestLocationPermission = async () => {
  if (Platform.OS === 'ios') {
    const permission = await new Promise(resolve => {
      Geolocation.requestAuthorization(status => {
        resolve(status);
      });
    });
    return permission;
  } else {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED
      ? 'granted'
      : 'denied';
  }
};

// 위치 서비스 시작 함수
const startLocationService = async () => {
  console.log('그다음 위치서비스가 시작되는거야');
  try {
    const permission = await requestLocationPermission();
    if (permission !== 'granted') {
      console.error('Location permission not granted');
      return; // 권한이 없으면 함수 종료
    }

    if (watchId === null) {
      watchId = Geolocation.watchPosition(
        position => {
          const {latitude, longitude} = position.coords;
          const time = new Date().toISOString();
          const timestamp = formatDate(time);
          locations.latitude.push(latitude);
          locations.longitude.push(longitude);

          locations.timestamp.push(timestamp);
          console.log('Location updated:', {latitude, longitude, timestamp});
        },
        error => {
          console.error('Error watching position:', error);
        },
        locationOptions,
      );

      console.log('Location service started.');
    }
  } catch (error) {
    console.error('Error starting location service:', error);
  }
};

// 위치 서비스 중지 함수
const stopLocationService = async () => {
  try {
    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
      watchId = null;
    }
    console.log('Location service stopped.');
  } catch (error) {
    console.error('Error stopping location service:', error);
  }
};

// 백그라운드에서 실행할 작업
const backgroundTask = async taskData => {
  console.log('백그라운드에서 이게 시작되는거고');
  await new Promise(async resolve => {
    await startLocationService();

    intervalId = setInterval(() => {
      console.log('Background task running');
    }, 10000); // 10초마다 로그 출력ㄴ
  });
};

// 백그라운드 작업 시작 함수
const startBackgroundTask = async () => {
  try {
    await BackgroundActions.start(backgroundTask, options);
    console.log('Background task started.');
  } catch (error) {
    console.error('Error starting background task:', error);
  }
};

// 백그라운드 작업 중지 함수
const stopBackgroundTask = async () => {
  try {
    await BackgroundActions.stop();
    await stopLocationService(); // 위치 서비스 중지
    clearInterval(intervalId); // Interval 중지
    console.log('Background task stopped and location service stopped.');
  } catch (error) {
    console.error('Error stopping background task:', error);
  }
};

// 백그라운드 서비스 옵션
const options = {
  taskName: '측정 서비스',
  taskTitle: '측정 중',
  taskDesc: '측정 진행 중... ',
  taskIcon: {
    name: 'ic_launcher',
    type: 'mipmap',
  },
  color: '#ff00ff',
  linkingURI: 'sendLocation',
  parameters: {
    delay: 1000,
  },
};

// 한국 시간으로 변환하는 함수
const formatDate = time => {
  const date = new Date(time);
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  const hours = `0${date.getHours()}`.slice(-2);
  const minutes = `0${date.getMinutes()}`.slice(-2);
  const seconds = `0${date.getSeconds()}`.slice(-2);
  const milliseconds = `00${date.getMilliseconds()}`.slice(-3);

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};

export {startBackgroundTask, stopBackgroundTask, locations};
