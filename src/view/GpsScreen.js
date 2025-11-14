import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapView, {PROVIDER_GOOGLE} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import {colors} from '../component/constants/colors';
import {Card} from '../component/Card';
import {Button} from '../component/Button';
import {useLocation} from '../context/LocationProvider'; // (선택) 위치 컨텍스트
import Api from '../api/ApiUtils';

// 센서 라이브러리
import {
  accelerometer,
  gyroscope,
  magnetometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import CompassHeading from 'react-native-compass-heading';
import crypto from 'crypto-js';

// --- [유틸 함수] 거리 계산 (Haversine Formula) ---
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // 지구 반지름 (km)
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = deg => {
  return deg * (Math.PI / 180);
};

export default function GpsScreen({route, navigation}) {
  const {scooterId, rideId, isHelmetConfirmed} = route.params || {};
  // const { locationData } = useLocation(); // 1초마다 갱신되는 컨텍스트 대신 직접 Geolocation 사용 권장 (성능상)

  // UI 상태
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [cost, setCost] = useState(1000);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null); // 지도 중심용

  // 내부 로직용 Refs (렌더링 없이 값 저장)
  const durationRef = useRef(0);
  const prevLocationRef = useRef(null); // 이전 위치 저장용
  // [추가] 이전 속도 저장용 Ref (급가속/감속 계산용)
  const prevSpeedRef = useRef(0);
  // [수정] 이벤트 카운트 확장
  const eventCountsRef = useRef({
    suddenStart: 0, // 급출발
    suddenStop: 0, // 급정지
    suddenAccel: 0, // 급가속
    suddenDecel: 0, // 급감속
    suddenTurn: 0, // 급회전
  });

  // 센서 데이터 저장소 (서버 전송용 원본 데이터)
  const sensorDataRef = useRef({
    accel: [],
    gyro: [],
    mag: [],
    heading: [],
  });

  const mapRef = useRef(null);
  const timerRef = useRef(null);
  const subscriptions = useRef([]);
  const watchId = useRef(null); // GPS 위치 감시 ID

  // 1. 주행 시작 (센서 & GPS 가동)
  useEffect(() => {
    const startRide = () => {
      // 센서 설정 (200ms 간격)
      setUpdateIntervalForType(SensorTypes.accelerometer, 200);
      setUpdateIntervalForType(SensorTypes.gyroscope, 200);
      setUpdateIntervalForType(SensorTypes.magnetometer, 200);

      // 1. 가속도 센서 (충격 감지용 보조)
      const sub1 = accelerometer.subscribe(({x, y, z}) => {
        sensorDataRef.current.accel.push({x, y, z, timestamp: Date.now()});
        // 가속도 데이터는 충돌 감지 등에 활용 가능
      });

      // 2. 자이로 센서 (★급회전 감지)
      const sub2 = gyroscope.subscribe(({x, y, z}) => {
        sensorDataRef.current.gyro.push({x, y, z, timestamp: Date.now()});

        // z축 회전 속도 절대값이 2.5 rad/s (약 143도/초) 이상이면 급회전으로 간주
        // (임계값은 테스트하면서 조절 필요: 보통 2.0 ~ 3.0 사이)
        if (Math.abs(z) > 2.5) {
          eventCountsRef.current.suddenTurn += 1;
          console.log('급회전 감지!');
        }
      });

      const sub3 = magnetometer.subscribe(({x, y, z}) => {
        sensorDataRef.current.mag.push({x, y, z, timestamp: Date.now()});
      });

      CompassHeading.start(3, ({heading}) => {
        sensorDataRef.current.heading.push({heading, timestamp: Date.now()});
      });

      subscriptions.current = [sub1, sub2, sub3];

      // (3) 실제 위치 추적 (거리/속도 계산)
      watchId.current = Geolocation.watchPosition(
        position => {
          const {latitude, longitude, speed: gpsSpeed} = position.coords;

          // m/s -> km/h 변환
          const currentSpeedKmH = Math.max(0, (gpsSpeed || 0) * 3.6);
          const prevSpeed = prevSpeedRef.current;
          const speedDiff = currentSpeedKmH - prevSpeed; // 속도 변화량

          // 1초(GPS 갱신주기) 동안 속도가 얼마나 변했는가? (임계값: 10km/h)
          // 즉, 1초 만에 시속 10km 이상 빨라지거나 느려지면 '급'으로 판단
          const ACCEL_THRESHOLD = 10;

          if (speedDiff > ACCEL_THRESHOLD) {
            // 속도 증가
            if (prevSpeed < 5) {
              eventCountsRef.current.suddenStart += 1; // 거의 정지 상태에서 급가속 -> 급출발
              console.log('급출발!');
            } else {
              eventCountsRef.current.suddenAccel += 1; // 주행 중 가속 -> 급가속
              console.log('급가속!');
            }
          } else if (speedDiff < -ACCEL_THRESHOLD) {
            // 속도 감소 (speedDiff는 음수)
            if (currentSpeedKmH < 5) {
              eventCountsRef.current.suddenStop += 1; // 급격히 줄어 멈춤 -> 급정지
              console.log('급정지!');
            } else {
              eventCountsRef.current.suddenDecel += 1; // 주행 중 감속 -> 급감속
              console.log('급감속!');
            }
          }

          // 상태 업데이트
          setSpeed(Math.floor(currentSpeedKmH));
          prevSpeedRef.current = currentSpeedKmH;

          // 현재 위치 업데이트 (지도 표시용)
          setCurrentLocation({latitude, longitude});

          // 거리 누적 계산
          if (prevLocationRef.current) {
            const distKm = getDistanceFromLatLonInKm(
              prevLocationRef.current.latitude,
              prevLocationRef.current.longitude,
              latitude,
              longitude,
            );

            // GPS 튀는 현상 방지 (2m 이상 움직였을 때만)
            if (distKm > 0.002) {
              setDistance(prev => parseFloat((prev + distKm).toFixed(2)));
              prevLocationRef.current = {latitude, longitude};
            }
          } else {
            prevLocationRef.current = {latitude, longitude};
          }

          // 지도 중심 이동 (부드럽게)
          mapRef.current?.animateToRegion(
            {
              latitude,
              longitude,
              latitudeDelta: 0.002, // 좀 더 확대해서 보여줌 (주행 중이니)
              longitudeDelta: 0.002,
            },
            500,
          );
        },
        error => console.log(error),
        {
          enableHighAccuracy: true,
          distanceFilter: 0, // 정지 상태 변화도 잡기 위해 필터 해제 권장
          interval: 1000,
          fastestInterval: 1000,
        },
      );
    };

    startRide();

    // (4) 타이머 (시간 & 요금 계산)
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDuration(durationRef.current);

      // 요금: 기본 1000원 + (분 * 200원)
      const minutes = Math.floor(durationRef.current / 60);
      setCost(1000 + minutes * 200);
    }, 1000);

    // 종료 시 정리
    return () => {
      clearInterval(timerRef.current);
      if (watchId.current !== null) Geolocation.clearWatch(watchId.current);
      subscriptions.current.forEach(sub => sub.unsubscribe());
      CompassHeading.stop();
    };
  }, []);

  // 반납 처리
  const handleEndRide = () => {
    setShowEndDialog(false);

    // 정리
    clearInterval(timerRef.current);
    if (watchId.current !== null) Geolocation.clearWatch(watchId.current);
    subscriptions.current.forEach(sub => sub.unsubscribe());
    CompassHeading.stop();

    const counts = eventCountsRef.current;

    // 점수 계산 (예시: 100점에서 감점 방식)
    const penalty =
      counts.suddenStart * 2 +
      counts.suddenStop * 2 +
      counts.suddenAccel * 1 +
      counts.suddenDecel * 1 +
      counts.suddenTurn * 3;

    const finalScore = Math.max(0, 100 - penalty);

    const resultData = {
      total_distance_m: distance * 1000,
      total_time_sec: durationRef.current,
      final_score: finalScore,
      helmet_on: 'true',
      // 상세 카운트 전달
      sudden_start_cnt: counts.suddenStart,
      sudden_stop_cnt: counts.suddenStop,
      sudden_accel_cnt: counts.suddenAccel,
      sudden_decel_cnt: counts.suddenDecel,
      turn_noslow_cnt: counts.suddenTurn, // 급회전
      isHelmet: isHelmetConfirmed,
    };

    Alert.alert('반납 완료', '이용해주셔서 감사합니다.', [
      {
        text: '확인',
        onPress: () => {
          // 1. 홈으로 스택 초기화
          navigation.reset({
            index: 0,
            routes: [{name: 'Selection'}],
          });
          // 2. 분석 화면으로 이동 (결과 데이터 전달)
          // 실제로는 History 대신 'Analysis'로 먼저 가서 결과를 보여주는 게 일반적입니다.
          navigation.navigate('Analysis', {result: resultData});
        },
      },
    ]);
  };

  // 시간 포맷 (MM:SS)
  const formatTimeUI = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 초기 맵 위치 (임시)
  const initialRegion = {
    latitude: 37.5665,
    longitude: 126.978,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. 상단 정보 패널 (시간/요금 등) */}
      <View style={styles.topPanel}>
        <View style={styles.statusAlert}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.text}
          />
          <Text style={styles.statusText}>
            킥보드 #{scooterId || '0000'} 이용 중
          </Text>
        </View>

        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <Ionicons
              name="time-outline"
              size={24}
              color={colors.blue600}
              style={styles.statIcon}
            />
            <Text style={styles.statLabel}>시간</Text>
            <Text style={styles.statValue}>{formatTimeUI(duration)}</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons
              name="navigate-outline"
              size={24}
              color={colors.green600}
              style={styles.statIcon}
            />
            <Text style={styles.statLabel}>거리</Text>
            <Text style={styles.statValue}>{distance.toFixed(2)} km</Text>
          </Card>
          <Card style={styles.statCard}>
            <Ionicons
              name="wallet-outline"
              size={24}
              color={colors.purple600}
              style={styles.statIcon}
            />
            <Text style={styles.statLabel}>요금</Text>
            <Text style={styles.statValue}>₩{cost.toLocaleString()}</Text>
          </Card>
        </View>
      </View>

      {/* 2. 지도 영역 */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: 37.5665,
            longitude: 126.978,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
        />

        {/* ▼▼▼ [추가] T-map 스타일 속도계 오버레이 (왼쪽 배치) ▼▼▼ */}
        <View style={styles.speedOverlay}>
          <Text style={styles.speedText}>{speed}</Text>
          <Text style={styles.speedUnit}>km/h</Text>
        </View>
        {/* ▲▲▲ 여기까지 추가 ▲▲▲ */}

        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => {
            if (currentLocation) {
              mapRef.current?.animateToRegion({
                ...currentLocation,
                latitudeDelta: 0.002,
                longitudeDelta: 0.002,
              });
            }
          }}>
          <Ionicons name="locate" size={24} color={colors.blue600} />
        </TouchableOpacity>
      </View>

      {/* 3. 하단 반납 버튼 */}
      <View style={styles.bottomButtonContainer}>
        <Button
          title="반납하기"
          onPress={() => setShowEndDialog(true)}
          style={{backgroundColor: colors.red600}}
          icon={
            <Ionicons
              name="lock-closed-outline"
              size={20}
              color="#fff"
              style={{marginRight: 8}}
            />
          }
        />
      </View>

      {/* 반납 확인 모달 (기존과 동일) */}
      <Modal
        visible={showEndDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndDialog(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>라이딩을 종료하시겠습니까?</Text>
            <View style={styles.modalStats}>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>이용 시간</Text>
                <Text style={styles.modalValue}>{formatTimeUI(duration)}</Text>
              </View>
              <View style={styles.modalRow}>
                <Text style={styles.modalLabel}>이동 거리</Text>
                <Text style={styles.modalValue}>{distance.toFixed(2)} km</Text>
              </View>
              <View style={[styles.modalRow, styles.modalDivider]}>
                <Text style={styles.modalLabel}>예상 요금</Text>
                <Text style={[styles.modalValue, {color: colors.blue600}]}>
                  ₩{cost.toLocaleString()}
                </Text>
              </View>
            </View>
            <Button
              title="반납 완료"
              onPress={handleEndRide}
              style={{backgroundColor: colors.red600, marginBottom: 10}}
            />
            <Button
              title="취소"
              onPress={() => setShowEndDialog(false)}
              variant="outline"
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f0fdf4'},
  topPanel: {
    padding: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  statusAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.blue100,
  },
  statusText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'flex-start',
    borderRadius: 12,
  },
  statIcon: {marginBottom: 8},
  statLabel: {fontSize: 12, color: colors.gray500, marginBottom: 4},
  statValue: {fontSize: 16, fontWeight: 'bold', color: colors.text},

  mapContainer: {flex: 1, position: 'relative'},
  map: {...StyleSheet.absoluteFillObject},

  // [추가] 속도계 스타일 (T-map 느낌)
  speedOverlay: {
    position: 'absolute',
    left: 20, // 왼쪽 배치
    top: '40%', // 화면 중간쯤 (상단 패널 피해서)
    width: 90,
    height: 90,
    borderRadius: 45, // 원형
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // 반투명 흰색 배경
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.blue600, // 테두리 색상
    elevation: 6, // 그림자 (안드로이드)
    shadowColor: '#000', // 그림자 (iOS)
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  speedText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    includeFontPadding: false,
  },
  speedUnit: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: -2,
  },

  locationButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: colors.text,
  },
  modalStats: {marginBottom: 24},
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  modalLabel: {fontSize: 14, color: colors.gray600},
  modalValue: {fontSize: 14, fontWeight: '600', color: colors.text},
});
