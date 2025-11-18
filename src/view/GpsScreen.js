import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapView, {PROVIDER_GOOGLE, Polyline} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import {colors} from '../component/constants/colors';
import {Card} from '../component/Card';
import {Button} from '../component/Button';
import Api from '../api/ApiUtils';

// 센서 라이브러리 (가속도계 사용)
import {
  accelerometer,
  gyroscope, // (급회전용)
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import CompassHeading from 'react-native-compass-heading'; // (현재 사용 안함)

// --- 유틸 함수 (거리 계산) ---
const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
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
const deg2rad = deg => deg * (Math.PI / 180);

// --- 사고 감지 설정 ---
const IMPACT_THRESHOLD_G = 6.0; // 6G 이상이면 '강한 충격' (조절 필요)
const NO_MOVEMENT_DURATION_MS = 60000; // 1분 (60,000ms)
const MODAL_COUNTDOWN_SECONDS = 60; // 60초

export default function GpsScreen({route, navigation}) {
  const {scooterId, rideId, isHelmetConfirmed} = route.params || {};

  // --- UI 상태 ---
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [cost, setCost] = useState(1000);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  // --- [신규] 사고 감지 모달 상태 ---
  const [showAccidentModal, setShowAccidentModal] = useState(false);
  const [modalCountdown, setModalCountdown] = useState(MODAL_COUNTDOWN_SECONDS);

  // --- Refs (데이터 저장소) ---
  const durationRef = useRef(0);
  const prevLocationRef = useRef(null);
  const prevSpeedRef = useRef(0);
  const currentLocationRef = useRef(null);
  const riskLogsRef = useRef([]);
  const routePathRef = useRef([]);
  const lastTurnLogTime = useRef(0);

  // --- [신규] 사고 감지 상태 Ref ---
  const fallDetectionRef = useRef({
    hasImpact: false, // (1) 충격 감지 여부
    noMovementTimerId: null, // (2) 1분간 움직임 없음 타이머
    modalTimerId: null, // (3) 60초 응답 타이머
  });

  const mapRef = useRef(null);
  const timerRef = useRef(null);
  const subscriptions = useRef([]);
  const watchId = useRef(null);

  // 1. 주행 시작 (센서 & GPS 가동)
  useEffect(() => {
    // ★ [수정] ESLint 경고 해결을 위해 ref 객체를 로컬 변수에 할당
    const timerRefForCleanup = timerRef;
    const watchIdForCleanup = watchId;
    const subscriptionsForCleanup = subscriptions;
    const fallDetectionRefForCleanup = fallDetectionRef;

    const startRide = () => {
      setUpdateIntervalForType(SensorTypes.accelerometer, 200); // 0.2초 간격
      setUpdateIntervalForType(SensorTypes.gyroscope, 200);

      // 1) 가속도계 (충격 감지)
      const sub1 = accelerometer.subscribe(({x, y, z}) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const gForce = magnitude / 9.81; // m/s^2 -> G

        if (gForce > IMPACT_THRESHOLD_G) {
          if (fallDetectionRef.current.hasImpact) return;
          console.log(`🚨 강한 충격 감지! (G-Force: ${gForce.toFixed(2)} G)`);
          fallDetectionRef.current.hasImpact = true;
        }
      });

      // 2) 자이로 센서 (급회전 감지)
      const sub2 = gyroscope.subscribe(({z}) => {
        if (Math.abs(z) > 2.5) {
          const now = Date.now();
          if (now - lastTurnLogTime.current > 2000) {
            const loc = currentLocationRef.current;
            if (loc) {
              console.log('⚠️ 급회전 감지!', loc);
              riskLogsRef.current.push({
                type: 'sudden_turn',
                timestamp: new Date().toISOString(),
                latitude: loc.latitude,
                longitude: loc.longitude,
                value: Math.abs(z).toFixed(2),
              });
              lastTurnLogTime.current = now;
            }
          }
        }
      });

      subscriptions.current = [sub1, sub2];

      // 3) GPS 위치 추적 (핵심 로직)
      watchId.current = Geolocation.watchPosition(
        position => {
          const {latitude, longitude, speed: gpsSpeed} = position.coords;
          const timestamp = new Date().toISOString();
          const newLoc = {latitude, longitude};
          const currentSpeedKmH = Math.max(0, (gpsSpeed || 0) * 3.6);

          // (1) 상태 업데이트
          setCurrentLocation(newLoc);
          currentLocationRef.current = newLoc;
          setRouteCoordinates(prev => [...prev, newLoc]);
          routePathRef.current.push({
            latitude,
            longitude,
            timestamp,
            speed: gpsSpeed || 0,
          });

          // (2) [신규] 사고 감지 후속 처리 (GPS 기반)
          if (fallDetectionRef.current.hasImpact) {
            if (currentSpeedKmH > 1.0) {
              console.log(
                '✅ 충격 후 움직임 감지. (휴대폰 떨어뜨림) 사고 감지 리셋.',
              );
              fallDetectionRef.current.hasImpact = false;
              if (fallDetectionRef.current.noMovementTimerId) {
                clearTimeout(fallDetectionRef.current.noMovementTimerId);
                fallDetectionRef.current.noMovementTimerId = null;
              }
            } else if (
              currentSpeedKmH < 1.0 &&
              !fallDetectionRef.current.noMovementTimerId
            ) {
              console.log('...충격 후 1분간 움직임 없는지 감시 시작...');
              fallDetectionRef.current.noMovementTimerId = setTimeout(() => {
                console.log('🚨 1분간 움직임 없음! "괜찮으신가요?" 모달 표시');
                setShowAccidentModal(true); // ★ 1분 뒤 모달 표시
              }, NO_MOVEMENT_DURATION_MS);
            }
          }

          // (3) 급가속/감속 로직
          const prevSpeed = prevSpeedRef.current;
          const speedDiff = currentSpeedKmH - prevSpeed;
          const ACCEL_THRESHOLD = 10;

          if (Math.abs(speedDiff) > ACCEL_THRESHOLD) {
            let type = '';
            if (speedDiff > 0) {
              type = prevSpeed < 5 ? 'sudden_start' : 'sudden_accel';
              console.log(`🚀 ${type}!`);
            } else {
              type = currentSpeedKmH < 5 ? 'sudden_stop' : 'sudden_decel';
              console.log(`🛑 ${type}!`);
            }
            riskLogsRef.current.push({
              type: type,
              timestamp: timestamp,
              latitude: latitude,
              longitude: longitude,
              value: Math.abs(speedDiff).toFixed(2),
            });
          }
          setSpeed(Math.floor(currentSpeedKmH));
          prevSpeedRef.current = currentSpeedKmH;

          // (4) 거리 누적 (동일)
          if (prevLocationRef.current) {
            const distKm = getDistanceFromLatLonInKm(
              prevLocationRef.current.latitude,
              prevLocationRef.current.longitude,
              latitude,
              longitude,
            );
            if (distKm > 0.002) {
              setDistance(prev => parseFloat((prev + distKm).toFixed(2)));
              prevLocationRef.current = newLoc;
            }
          } else {
            prevLocationRef.current = newLoc;
          }
        },
        error => console.log(error),
        {
          enableHighAccuracy: true,
          distanceFilter: 0,
          interval: 1000,
          fastestInterval: 1000,
        },
      );
    };
    startRide();

    // 4) 타이머 (동일)
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDuration(durationRef.current);
      const minutes = Math.floor(durationRef.current / 60);
      setCost(1000 + minutes * 200);
    }, 1000);

    // 5) 클린업 함수 (모든 타이머 정리)
    return () => {
      // ★ [수정] 캡처된 로컬 변수를 통해 .current에 접근
      clearInterval(timerRefForCleanup.current);
      if (watchIdForCleanup.current !== null) {
        Geolocation.clearWatch(watchIdForCleanup.current);
      }
      subscriptionsForCleanup.current.forEach(sub => sub.unsubscribe());

      // [신규] 사고 감지 타이머 모두 제거 (캡처된 변수 사용)
      clearTimeout(fallDetectionRefForCleanup.current.noMovementTimerId);
      clearInterval(fallDetectionRefForCleanup.current.modalTimerId);
    };
  }, []); // 의존성 배열은 비어있는 것이 맞습니다.

  // --- [수정] 반납 처리 (useCallback 적용) ---
  const handleEndRide = useCallback(
    async (isAccident = false) => {
      setShowEndDialog(false); // Setter 함수는 의존성에 포함할 필요 없음

      // Ref(current)는 의존성에 포함할 필요 없음
      clearInterval(timerRef.current);
      if (watchId.current !== null) Geolocation.clearWatch(watchId.current);
      subscriptions.current.forEach(sub => sub.unsubscribe());
      clearTimeout(fallDetectionRef.current.noMovementTimerId);
      clearInterval(fallDetectionRef.current.modalTimerId);

      const endData = {
        rideId: rideId, // route.params에서 온 값
        endLocation: currentLocation
          ? {lat: currentLocation.latitude, lng: currentLocation.longitude}
          : null,
        distance: distance, // state 값
        riskLogs: riskLogsRef.current,
        ridePath: routePathRef.current,
        isHelmet: isHelmetConfirmed, // route.params에서 온 값
        isAccident: isAccident,
        score: 0,
      };

      console.log(
        isAccident ? '🚨 사고 데이터 전송:' : '📤 일반 반납 데이터 전송:',
        JSON.stringify(endData, null, 2),
      );

      try {
        const response = await Api.endRide(rideId, endData, navigation);

        if (response && response.success) {
          // ... (로그 횟수 계산 로직 동일)
          const riskCounts = {
            sudden_start: 0,
            sudden_accel: 0,
            sudden_stop: 0,
            sudden_decel: 0,
            sudden_turn: 0,
          };
          riskLogsRef.current.forEach(log => {
            if (riskCounts.hasOwnProperty(log.type)) riskCounts[log.type]++;
          });

          Alert.alert(
            isAccident ? '사고 신고 완료' : '반납 완료',
            isAccident
              ? '안전팀에 알림이 전송되었습니다.'
              : '이용해주셔서 감사합니다.',
            [
              {
                text: '확인',
                onPress: () => {
                  navigation.navigate('RideSummary', {
                    result: response.data,
                    riskCounts: riskCounts,
                    isHelmet: isHelmetConfirmed,
                  });
                },
              },
            ],
          );
        } else {
          Alert.alert(
            '반납 실패',
            response?.message || '서버 오류가 발생했습니다.',
          );
        }
      } catch (error) {
        console.error('End Ride Error:', error);
        Alert.alert('오류', '반납 처리 중 문제가 발생했습니다.');
      }
    },
    [
      // ★ 이 함수가 의존하는 모든 props와 state를 배열에 나열
      rideId,
      currentLocation,
      distance,
      isHelmetConfirmed,
      navigation,
    ],
  );

  // --- [신규] 60초 무응답 시 강제 반납 (useCallback 적용) ---
  const handleAutomaticEndRide = useCallback(() => {
    console.log('🚨 60초 무응답. 사고로 간주하고 강제 반납 실행.');
    setShowAccidentModal(false);
    handleEndRide(true);
  }, [handleEndRide]); // ★ handleEndRide가 변경될 때만 이 함수도 새로 만듦

  // --- [신규] 사고 모달 60초 카운트다운 ---
  useEffect(() => {
    if (!showAccidentModal) {
      clearInterval(fallDetectionRef.current.modalTimerId);
      return;
    }

    setModalCountdown(MODAL_COUNTDOWN_SECONDS); // 카운트다운 초기화

    // ★ [수정] 타이머 ID를 로컬 변수에 저장
    const timerId = setInterval(() => {
      setModalCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerId); // ★ 로컬 변수로 타이머 정리
          handleAutomaticEndRide();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    fallDetectionRef.current.modalTimerId = timerId;

    // ★ [수정] 클린업 함수는 '로컬 변수'인 timerId를 참조
    return () => {
      clearInterval(timerId);
    };
  }, [showAccidentModal, handleAutomaticEndRide]); // 의존성 배열

  // --- [신규] 모달 "괜찮아요" 버튼 ---
  const handleModalSafe = () => {
    console.log('사용자가 "괜찮아요" 응답. 주행 계속.');
    setShowAccidentModal(false);
    // 사고 감지 상태 초기화
    fallDetectionRef.current.hasImpact = false;
    clearTimeout(fallDetectionRef.current.noMovementTimerId);
    fallDetectionRef.current.noMovementTimerId = null;
    // (modalTimerId는 위 useEffect에서 자동으로 정리됨)
  };

  const formatTimeUI = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 상단 정보 패널 */}
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

      {/* 지도 영역 */}
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
          showsMyLocationButton={false}>
          {/* 이동 경로 그리기 (Polyline) */}
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={colors.blue600}
              strokeWidth={5}
            />
          )}
        </MapView>

        {/* 속도계 오버레이 */}
        <View style={styles.speedOverlay}>
          <Text style={styles.speedText}>{speed}</Text>
          <Text style={styles.speedUnit}>km/h</Text>
        </View>

        {/* 현위치 버튼 */}
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

      {/* 하단 반납 버튼 */}
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

      {/* 반납 확인 모달 */}
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
              onPress={() => handleEndRide(false)} // ★ false 전달 (정상 반납)
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

      {/* (2) ★ [신규] 사고 감지 모달 ★ */}
      <Modal
        visible={showAccidentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleModalSafe} // 백그라운드 클릭 시 '안전'으로 간주
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons
              name="warning"
              size={48}
              color={colors.red600}
              style={{textAlign: 'center', marginBottom: 16}}
            />
            <Text style={styles.modalTitle}>사고가 감지되었습니다</Text>
            <Text style={styles.modalSubtitle}>
              괜찮으신가요? {modalCountdown}초 이내에 응답이 없으면 자동으로
              사고가 접수됩니다.
            </Text>

            <Button
              title="괜찮아요 (주행 계속)"
              onPress={handleModalSafe}
              style={{backgroundColor: colors.green600, marginBottom: 10}}
            />
            <Button
              title="도움 필요 (즉시 신고)"
              onPress={() => handleAutomaticEndRide()} // 즉시 강제 반납
              variant="outline"
              style={{borderColor: colors.red600}}
              textStyle={{color: colors.red600}}
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
  speedOverlay: {
    position: 'absolute',
    left: 20,
    top: '40%',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.blue600,
    elevation: 6,
    shadowColor: '#000',
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
  speedUnit: {fontSize: 12, color: colors.gray500, marginTop: -2},
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
    marginBottom: 8,
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.gray600,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
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
