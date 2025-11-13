import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import Geolocation from 'react-native-geolocation-service';

const LocationContext = createContext();

export const LocationProvider = ({children}) => {
  // [변경 1] watchId를 useState 대신 useRef로 관리
  // (ID가 바뀌어도 리렌더링을 유발하지 않기 위함)
  const watchIdRef = useRef(null);

  const [locationData, setLocationData] = useState({
    latitude: [],
    longitude: [],
    timestamp: [],
  });

  // 컴포넌트가 완전히 사라질 때만 위치 추적 종료
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        Geolocation.clearWatch(watchIdRef.current);
        console.log('앱 종료/언마운트로 인한 위치서비스 완전 종료');
      }
    };
  }, []);

  // 위치 추적 시작 함수
  const startLocationTracking = useCallback(() => {
    // 이미 추적 중이라면 기존 것 취소 (중복 방지)
    if (watchIdRef.current !== null) {
      Geolocation.clearWatch(watchIdRef.current);
    }

    const id = Geolocation.watchPosition(
      position => {
        const {latitude, longitude} = position.coords;
        const time = new Date().toISOString();
        const timestamp = formatDate(time);

        console.log('위치 업데이트:', {latitude, longitude, timestamp});

        setLocationData(prevData => ({
          latitude: [...prevData.latitude, latitude],
          longitude: [...prevData.longitude, longitude],
          timestamp: [...prevData.timestamp, timestamp],
        }));
      },
      error => {
        console.error('위치 감시 중 오류:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 0,
        interval: 1000,
        fastestInterval: 1000,
        forceRequestLocation: true,
      },
    );

    // Ref에 ID 저장 (리렌더링 발생 안 함)
    watchIdRef.current = id;
  }, []);

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

  // [변경 2] useMemo로 context value 감싸기
  // locationData가 변해도 startLocationTracking 함수 자체는 그대로임을 보장
  const value = useMemo(
    () => ({
      startLocationTracking,
      locationData,
      setLocationData,
    }),
    [startLocationTracking, locationData],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => useContext(LocationContext);
