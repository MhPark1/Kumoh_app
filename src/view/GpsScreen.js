import React, {useState, useEffect, useRef} from 'react';
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

// 센서 라이브러리
import {
  accelerometer,
  gyroscope,
  magnetometer,
  setUpdateIntervalForType,
  SensorTypes,
} from 'react-native-sensors';
import CompassHeading from 'react-native-compass-heading';

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

  // UI 상태
  const [duration, setDuration] = useState(0);
  const [distance, setDistance] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [cost, setCost] = useState(1000);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);

  // 지도 경로 그리기용 상태
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  // --- Refs (데이터 저장소) ---
  const durationRef = useRef(0);
  const prevLocationRef = useRef(null);
  const prevSpeedRef = useRef(0);

  // [핵심] 센서에서 최신 위치를 조회하기 위한 Ref
  const currentLocationRef = useRef(null);

  // 로그/경로 저장소
  const riskLogsRef = useRef([]);
  const routePathRef = useRef([]);

  // 급회전 중복 로깅 방지용 쿨타임 Ref
  const lastTurnLogTime = useRef(0);

  const mapRef = useRef(null);
  const timerRef = useRef(null);
  const subscriptions = useRef([]);
  const watchId = useRef(null);

  // 1. 주행 시작 (센서 & GPS 가동)
  useEffect(() => {
    const startRide = () => {
      // 센서 설정 (200ms 간격)
      setUpdateIntervalForType(SensorTypes.accelerometer, 200);
      setUpdateIntervalForType(SensorTypes.gyroscope, 200);
      setUpdateIntervalForType(SensorTypes.magnetometer, 200);

      // 1) 자이로 센서 (급회전 감지)
      const sub2 = gyroscope.subscribe(({x, y, z}) => {
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

      const sub1 = accelerometer.subscribe(() => {});
      const sub3 = magnetometer.subscribe(() => {});
      CompassHeading.start(3, () => {});

      subscriptions.current = [sub1, sub2, sub3];

      // 2) GPS 위치 추적
      watchId.current = Geolocation.watchPosition(
        position => {
          const {latitude, longitude, speed: gpsSpeed} = position.coords;
          const timestamp = new Date().toISOString();

          const newLoc = {latitude, longitude};

          setCurrentLocation(newLoc);
          currentLocationRef.current = newLoc;

          setRouteCoordinates(prev => [...prev, newLoc]);
          routePathRef.current.push({
            latitude,
            longitude,
            timestamp,
            speed: gpsSpeed || 0,
          });

          // (3) 급가속/감속 로직
          const currentSpeedKmH = Math.max(0, (gpsSpeed || 0) * 3.6);
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

          mapRef.current?.animateToRegion(
            {
              latitude,
              longitude,
              latitudeDelta: 0.002,
              longitudeDelta: 0.002,
            },
            500,
          );
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

    timerRef.current = setInterval(() => {
      durationRef.current += 1;
      setDuration(durationRef.current);
      const minutes = Math.floor(durationRef.current / 60);
      setCost(1000 + minutes * 200);
    }, 1000);

    return () => {
      clearInterval(timerRef.current);
      if (watchId.current !== null) Geolocation.clearWatch(watchId.current);
      subscriptions.current.forEach(sub => sub.unsubscribe());
      CompassHeading.stop();
    };
  }, []);

  // 반납 처리
  const handleEndRide = async () => {
    setShowEndDialog(false);

    clearInterval(timerRef.current);
    if (watchId.current !== null) Geolocation.clearWatch(watchId.current);
    subscriptions.current.forEach(sub => sub.unsubscribe());
    CompassHeading.stop();

    // [수정됨] 점수 계산 로직 삭제
    // estimatedScore 계산 부분을 제거했습니다.

    const endData = {
      rideId: rideId,
      endLocation: currentLocation
        ? {
            lat: currentLocation.latitude,
            lng: currentLocation.longitude,
          }
        : null,
      distance: distance,
      isHelmet: isHelmetConfirmed,
      // score 필드는 서버에서 계산하므로 제외하거나 0으로 전송
      // score: 0,

      // 상세 데이터 전송
      riskLogs: riskLogsRef.current,
      ridePath: routePathRef.current,
    };

    console.log('📤 반납 데이터 전송:', JSON.stringify(endData, null, 2));

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
          if (riskCounts.hasOwnProperty(log.type)) {
            riskCounts[log.type]++;
          }
        });
        Alert.alert('반납 완료', '이용해주셔서 감사합니다.', [
          {
            text: '확인',
            onPress: () => {
              navigation.navigate('RideSummary', {
                result: response.data, // 서버가 준 최종 영수증 (score, fare, distance, duration)
                riskCounts: riskCounts, // 앱이 방금 계산한 위험 횟수
                isHelmet: isHelmetConfirmed,
              });
            },
          },
        ]);
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
