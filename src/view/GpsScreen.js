import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MapView, {Marker, Polyline, PROVIDER_GOOGLE} from 'react-native-maps';
import {useLocation} from '../context/LocationProvider';
import {colors} from '../component/constants/colors';
import {Card} from '../component/Card';
import {Button} from '../component/Button';
import Api from '../api/ApiUtils';

const {width} = Dimensions.get('window');

export default function GpsScreen({route, navigation}) {
  const {scooterId, rideId: initialRideId} = route.params || {};
  const {locationData} = useLocation(); // 실시간 위치 컨텍스트

  // 상태 관리
  const [rideId, setRideId] = useState(initialRideId);
  const [duration, setDuration] = useState(0); // 초 단위
  const [distance, setDistance] = useState(0); // km 단위
  const [cost, setCost] = useState(1000); // 기본요금 1000원
  const [showEndDialog, setShowEndDialog] = useState(false);

  const mapRef = useRef(null);
  const timerRef = useRef(null);

  // 1. 타이머 및 요금/거리 계산 (1초마다 갱신)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);

      // 거리 계산 (임시 로직: 실제로는 locationData 변화량으로 계산해야 함)
      // 여기서는 시간 흐름에 따라 조금씩 늘어나는 것으로 시뮬레이션
      setDistance(prev => parseFloat((prev + 0.004).toFixed(2)));

      // 요금 계산: 기본 1000원 + 분당 200원
      setCost(prevCost => {
        const minutes = Math.floor((duration + 1) / 60);
        return 1000 + minutes * 200;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [duration]);

  // 2. 지도 중심 이동 (내 위치 따라가기)
  useEffect(() => {
    if (locationData.latitude.length > 0) {
      const lastLat = locationData.latitude[locationData.latitude.length - 1];
      const lastLng = locationData.longitude[locationData.longitude.length - 1];

      mapRef.current?.animateToRegion(
        {
          latitude: lastLat,
          longitude: lastLng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        500,
      );
    }
  }, [locationData]);

  // 시간 포맷팅 (MM:SS)
  const formatTime = seconds => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 반납 완료 처리
  const handleEndRide = async () => {
    setShowEndDialog(false);
    clearInterval(timerRef.current);

    try {
      // 종료 위치 (현재 위치)
      const lastLat =
        locationData.latitude[locationData.latitude.length - 1] || 37.5665;
      const lastLng =
        locationData.longitude[locationData.longitude.length - 1] || 126.978;

      // [API 호출] 주행 종료 (서버가 있다면 rideId 필요)
      // const response = await Api.endRide(rideId, { endLocation: { latitude: lastLat, longitude: lastLng } }, navigation);

      // 성공 시 히스토리 화면으로 이동 (스택 초기화 후 History 탭으로)
      Alert.alert('반납 완료', '이용해주셔서 감사합니다.', [
        {
          text: '확인',
          onPress: () => {
            // 메인 탭의 History 화면으로 이동
            navigation.reset({
              index: 0,
              routes: [{name: 'Selection'}],
            });

            // 2. History 탭으로 이동
            navigation.navigate('History');
          },
        },
      ]);
    } catch (error) {
      console.error('반납 실패:', error);
      Alert.alert('오류', '반납 처리 중 문제가 발생했습니다.');
    }
  };

  // 현재 위치 좌표 (배열의 마지막 값)
  const currentRegion = {
    latitude:
      locationData.latitude[locationData.latitude.length - 1] || 37.5665,
    longitude:
      locationData.longitude[locationData.longitude.length - 1] || 126.978,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 1. 상단 상태 카드 (시간, 거리, 요금) */}
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
            <Text style={styles.statValue}>{formatTime(duration)}</Text>
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

      {/* 2. 지도 영역 (배경) */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={currentRegion}
          showsUserLocation={true} // 파란 점 표시
          showsMyLocationButton={false}>
          {/* 이동 경로 (Polyline) */}
          {/* <Polyline coordinates={...} strokeColor={colors.primary} strokeWidth={4} /> */}
        </MapView>

        <View style={styles.mapPlaceholder}>
          <Ionicons name="navigate" size={48} color={colors.gray400} />
          <Text style={styles.mapPlaceholderText}>실시간 경로 추적 중</Text>
        </View>

        {/* 내 위치 버튼 */}
        <TouchableOpacity
          style={styles.locationButton}
          onPress={() => {
            mapRef.current?.animateToRegion(currentRegion, 500);
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

      {/* 4. 반납 확인 모달 */}
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
                <Text style={styles.modalValue}>{formatTime(duration)}</Text>
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
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4', // 연한 녹색 배경 (figmaApp 스타일)
  },
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
  statIcon: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray500,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    marginTop: 0, // 상단 패널 뒤에 지도가 깔리도록
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent', // 실제 지도가 보일 땐 투명하게, 없으면 색상 지정
    pointerEvents: 'none',
  },
  mapPlaceholderText: {
    marginTop: 8,
    color: colors.gray400,
    fontSize: 14,
  },
  locationButton: {
    position: 'absolute',
    bottom: 100, // 하단 버튼 위
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
    backgroundColor: 'transparent', // 그라데이션 대신 투명 처리
  },
  // 모달 스타일
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
  modalStats: {
    marginBottom: 24,
  },
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
  modalLabel: {
    fontSize: 14,
    color: colors.gray600,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
