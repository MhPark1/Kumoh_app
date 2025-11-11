import React, { createContext, useState, useContext, useEffect } from 'react';
import Geolocation from 'react-native-geolocation-service';

const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [watchId, setWatchId] = useState(null);
  const [locationData, setLocationData] = useState({ latitude: [], longitude: [], timestamp: [] });

  useEffect(() => {
    // 컴포넌트 언마운트 시 위치 감시 중단
    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
        console.log('위치서비스 종료');
      }
    };
  }, []);

  const startLocationTracking = () => {
    if (watchId !== null) {
      Geolocation.clearWatch(watchId); // 기존 감시 중단
    }

    const id = Geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const time = new Date().toISOString();
        const timestamp = formatDate(time);

        console.log('위치 업데이트:', { latitude, longitude, timestamp });

        setLocationData((prevData) => ({
          latitude: [...prevData.latitude, latitude],
          longitude: [...prevData.longitude, longitude],
          timestamp: [...prevData.timestamp, timestamp],
        }));
      },
      (error) => {
        console.error('위치 감시 중 오류:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 0,
        interval: 1000,
        fastestInterval: 1000,
        forceRequestLocation: true,
      }
    );

    setWatchId(id);
  };

  // const stopLocationTracking = () => {
  //   if (watchId !== null) {
  //     Geolocation.clearWatch(watchId); // 감시 중단
  //     setWatchId(null); // watchId 초기화
  //     console.log('위치 추적 중단');
  //   }
  // };

  const formatDate = (time) => {
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

  return (
    <LocationContext.Provider value={{ startLocationTracking, locationData, setLocationData }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
