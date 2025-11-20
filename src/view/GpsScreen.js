import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  BackHandler,
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
  gyroscope,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';

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
const IMPACT_THRESHOLD_G = 6.0; // 강한 충격 임계값
const NO_MOVEMENT_DURATION_MS = 60000; // 1분
const MODAL_COUNTDOWN_SECONDS = 60; // 60초

export default function GpsScreen({route, navigation}) {
  const {scooterId, rideId, isHelmetConfirmed, initialLat, initialLng} =
    route.params || {};

  // --- UI 상태 ---
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [cost, setCost] = useState(1000);
  const [showEndDialog, setShowEndDialog] = useState(false);

  // 초기 위치 설정
  const [currentLocation, setCurrentLocation] = useState(
    initialLat && initialLng
      ? {latitude: initialLat, longitude: initialLng}
      : null,
  );
  const [routeCoordinates, setRouteCoordinates] = useState(
    initialLat && initialLng
      ? [{latitude: initialLat, longitude: initialLng}]
      : [],
  );

  // --- 사고 감지 모달 상태 ---
  const [showAccidentModal, setShowAccidentModal] = useState(false);
  const [modalCountdown, setModalCountdown] = useState(MODAL_COUNTDOWN_SECONDS);

  // --- Refs (데이터 저장소) ---
  const durationRef = useRef(0);
  const prevLocationRef = useRef(
    initialLat && initialLng
      ? {latitude: initialLat, longitude: initialLng}
      : null,
  );
  const prevSpeedRef = useRef(0);
  const currentLocationRef = useRef(
    initialLat && initialLng
      ? {latitude: initialLat, longitude: initialLng}
      : null,
  );
  const riskLogsRef = useRef([]);
  const routePathRef = useRef([]);
  const lastTurnLogTime = useRef(0);

  // --- 사고 감지 상태 Ref ---
  const fallDetectionRef = useRef({
    hasImpact: false,
    noMovementTimerId: null,
    modalTimerId: null,
  });

  // ★ [핵심] handleEndRide 함수를 담을 Ref (의존성 끊기용)
  const handleEndRideRef = useRef(null);

  const mapRef = useRef(null);
  const timerRef = useRef(null);
  const subscriptions = useRef([]);
  const watchId = useRef(null);

  // [신규 추가] 뒤로가기 버튼 막기 (주행 중 이탈 방지)
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        '주행 중 알림',
        '주행 중에는 뒤로 갈 수 없습니다.\n반납하기 버튼을 이용해주세요.',
        [{text: '확인', onPress: () => null, style: 'cancel'}],
      );
      return true; // true를 반환하면 뒤로가기 동작을 막음
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  // 1. 주행 시작 (센서 & GPS 가동)
  useEffect(() => {
    const timerRefForCleanup = timerRef;
    const watchIdForCleanup = watchId;
    const subscriptionsForCleanup = subscriptions;
    const fallDetectionRefForCleanup = fallDetectionRef;

    const startRide = () => {
      setUpdateIntervalForType(SensorTypes.accelerometer, 200);
      setUpdateIntervalForType(SensorTypes.gyroscope, 200);

      // 1) 가속도계 (충격 감지)
      const sub1 = accelerometer.subscribe(({x, y, z}) => {
        const magnitude = Math.sqrt(x * x + y * y + z * z);
        const gForce = magnitude / 9.81;

        if (gForce > IMPACT_THRESHOLD_G) {
          if (fallDetectionRef.current.hasImpact) return;
          console.log(`🚨 강한 충격 감지! (G-Force: ${gForce.toFixed(2)} G)`);
          fallDetectionRef.current.hasImpact = true;
        }
      });

      // 2) 자이로 센서 (급회전 감지)
      const sub2 = gyroscope.subscribe(({z}) => {
        if (Math.abs(z) > 4.5) {
          console.log(z);
          const now = Date.now();
          if (now - lastTurnLogTime.current > 2000) {
            const loc = currentLocationRef.current;
            if (loc) {
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

      // 3) GPS 위치 추적
      watchId.current = Geolocation.watchPosition(
        position => {
          const {latitude, longitude, speed: gpsSpeed} = position.coords;
          const timestamp = new Date().toISOString();
          const newLoc = {latitude, longitude};
          const currentSpeedKmH = Math.max(0, (gpsSpeed || 0) * 3.6);

          setCurrentLocation(newLoc);
          currentLocationRef.current = newLoc;
          setRouteCoordinates(prev => [...prev, newLoc]);
          routePathRef.current.push({
            latitude,
            longitude,
            timestamp,
            speed: gpsSpeed || 0,
          });

          // 사고 감지 후속 처리 (정지 감지)
          if (fallDetectionRef.current.hasImpact) {
            if (currentSpeedKmH > 1.0) {
              console.log('✅ 충격 후 움직임 감지. 사고 감지 리셋.');
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
                setShowAccidentModal(true); // 모달 켜짐 -> useEffect 트리거
              }, NO_MOVEMENT_DURATION_MS);
            }
          }

          // 급가속/감속
          const prevSpeed = prevSpeedRef.current;
          const speedDiff = currentSpeedKmH - prevSpeed;
          const ACCEL_THRESHOLD = 10;

          if (Math.abs(speedDiff) > ACCEL_THRESHOLD) {
            let type = '';
            if (speedDiff > 0) {
              type = prevSpeed < 5 ? 'sudden_start' : 'sudden_accel';
            } else {
              type = currentSpeedKmH < 5 ? 'sudden_stop' : 'sudden_decel';
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

          // 거리 누적
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

    // 4) 타이머
    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDuration(durationRef.current);
      const minutes = Math.floor(durationRef.current / 60);
      setCost(1000 + minutes * 200);
    }, 1000);

    // 5) 클린업
    return () => {
      clearInterval(timerRefForCleanup.current);
      if (watchIdForCleanup.current !== null) {
        Geolocation.clearWatch(watchIdForCleanup.current);
      }
      subscriptionsForCleanup.current.forEach(sub => sub.unsubscribe());
      clearTimeout(fallDetectionRefForCleanup.current.noMovementTimerId);
      clearInterval(fallDetectionRefForCleanup.current.modalTimerId);
    };
  }, []); // 의존성 배열 비움

  // --- 반납 처리 ---
  const handleEndRide = useCallback(
    async (isAccident = false) => {
      setShowEndDialog(false);
      setShowAccidentModal(false); // 모달 닫기 추가

      // 모든 센서/타이머 정지
      clearInterval(timerRef.current);
      if (watchId.current !== null) Geolocation.clearWatch(watchId.current);
      subscriptions.current.forEach(sub => sub.unsubscribe());
      clearTimeout(fallDetectionRef.current.noMovementTimerId);
      clearInterval(fallDetectionRef.current.modalTimerId);

      const endData = {
        rideId: rideId,
        endLocation: currentLocation
          ? {lat: currentLocation.latitude, lng: currentLocation.longitude}
          : null,
        distance: distance,
        riskLogs: riskLogsRef.current,
        ridePath: routePathRef.current,
        isHelmet: isHelmetConfirmed,
        accident: isAccident, // ★ 명시적으로 전달된 값 사용
        score: 0,
      };

      console.log(
        isAccident ? '🚨 사고 데이터 전송:' : '📤 일반 반납 데이터 전송:',
        JSON.stringify(endData, null, 2),
      );

      try {
        const response = await Api.endRide(rideId, endData, navigation);

        if (response && response.success) {
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
                  navigation.navigate('HistoryTab', {
                    screen: 'RideSummary',
                    params: {
                      result: response.data,
                      riskCounts: riskCounts,
                      isHelmet: isHelmetConfirmed,
                    },
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
    [rideId, currentLocation, distance, isHelmetConfirmed, navigation],
  );

  // ★ [핵심 수정] handleEndRide가 변경될 때마다 Ref를 업데이트
  // 이렇게 하면 다른 useEffect나 함수에서 이 Ref를 통해 항상 최신 handleEndRide를 호출할 수 있습니다.
  useEffect(() => {
    handleEndRideRef.current = handleEndRide;
  }, [handleEndRide]);

  // --- 사고 모달 60초 카운트다운 ---
  useEffect(() => {
    if (!showAccidentModal) {
      clearInterval(fallDetectionRef.current.modalTimerId);
      return;
    }

    // 모달이 켜질 때 타이머 초기화 (단 한 번만 실행됨)
    setModalCountdown(MODAL_COUNTDOWN_SECONDS);

    const timerId = setInterval(() => {
      setModalCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerId);

          // ★ [핵심 수정]
          // Ref를 통해 최신 함수를 호출하므로 의존성 배열에 handleEndRide를 넣을 필요가 없음
          console.log('🚨 60초 무응답. 강제 반납 실행.');
          if (handleEndRideRef.current) {
            handleEndRideRef.current(true); // isAccident = true 전달
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    fallDetectionRef.current.modalTimerId = timerId;

    return () => {
      clearInterval(timerId);
    };
    // ★ 의존성 배열에 'showAccidentModal'만 남김!
    // 이제 위치가 바뀌어도 타이머가 리셋되지 않습니다.
  }, [showAccidentModal]);

  // --- 모달 "괜찮아요" 버튼 ---
  const handleModalSafe = () => {
    console.log('사용자가 "괜찮아요" 응답. 주행 계속.');
    setShowAccidentModal(false);
    fallDetectionRef.current.hasImpact = false;
    clearTimeout(fallDetectionRef.current.noMovementTimerId);
    fallDetectionRef.current.noMovementTimerId = null;
  };

  // --- 도움 필요 (즉시 신고) ---
  const handleImmediateReport = () => {
    setShowAccidentModal(false);
    // ★ [핵심 수정] Ref를 사용하여 최신 상태가 반영된 handleEndRide 호출
    if (handleEndRideRef.current) {
      handleEndRideRef.current(true); // isAccident = true 전달
    }
  };

  const formatTimeUI = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ... 상단 정보 패널 (기존과 동일) ... */}
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

      {/* ... 지도 영역 (기존과 동일) ... */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: initialLat || 37.5665,
            longitude: initialLng || 126.978,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}>
          {routeCoordinates.length > 0 && (
            <Polyline
              coordinates={routeCoordinates}
              strokeColor={colors.blue600}
              strokeWidth={5}
            />
          )}
        </MapView>

        <View style={styles.speedOverlay}>
          <Text style={styles.speedText}>{speed}</Text>
          <Text style={styles.speedUnit}>km/h</Text>
        </View>

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

      {/* ... 하단 반납 버튼 (기존과 동일) ... */}
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

      {/* ... 반납 확인 모달 (기존과 동일) ... */}
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

      {/* 사고 감지 모달 */}
      <Modal
        visible={showAccidentModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleModalSafe}>
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
              onPress={handleImmediateReport} // ★ Ref를 사용하는 핸들러
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
  // ... (스타일 코드는 이전과 동일하여 생략 가능하지만, 편의를 위해 전체 포함) ...
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
