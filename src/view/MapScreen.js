import React, {useState, useEffect, useRef} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors} from '../component/constants/colors';
import {Card} from '../component/Card';
import {Button} from '../component/Button';
import Api from '../api/ApiUtils'; // API import 추가

export default function MapScreen({navigation}) {
  const [scooters, setScooters] = useState([]); // 킥보드 목록 상태
  const [selectedScooter, setSelectedScooter] = useState(null);
  const [myLocation, setMyLocation] = useState({
    // 내 위치 상태
    latitude: 37.5665,
    longitude: 126.978,
  });
  const mapRef = useRef(null);

  // 화면 처음 켜질 때 내 위치 가져오기 + 주변 킥보드 조회
  useEffect(() => {
    getCurrentLocationAndFetchScooters();
  }, []);

  // 내 위치 확인 및 킥보드 데이터 조회 함수
  const getCurrentLocationAndFetchScooters = () => {
    Geolocation.getCurrentPosition(
      async position => {
        const {latitude, longitude} = position.coords;

        // 1. 내 위치 갱신
        setMyLocation({latitude, longitude});

        // 2. 지도 이동
        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          500,
        );

        // 3. 서버에서 주변 킥보드 가져오기
        try {
          const response = await Api.getNearbyKickboards({latitude, longitude});
          if (response.success) {
            // 서버 데이터(pm_id, location 등)를 앱에서 쓰기 편하게 매핑
            const mappedScooters = response.data.map(kb => ({
              id: String(kb.pm_id), // 마커 key용
              number: String(kb.pm_id), // 표시용 번호
              battery: kb.battery,
              // location이 {lat, lng} 객체로 온다고 가정 (Service 확인됨)
              position: {
                latitude: parseFloat(kb.location.lat),
                longitude: parseFloat(kb.location.lng),
              },
              // 거리는 나중에 계산하거나 서버값 사용 (일단 0으로)
              distance: 0,
            }));
            setScooters(mappedScooters);
            console.log('킥보드 로딩 완료:', mappedScooters.length, '대');
          }
        } catch (error) {
          console.error('킥보드 조회 실패:', error);
        }
      },
      error => {
        console.log(error.code, error.message);
        Alert.alert('위치 오류', '현재 위치를 가져올 수 없습니다.');
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  const handleUnlock = scooter => {
    Alert.alert(
      '킥보드 선택',
      `${scooter.number}번 킥보드를 대여하시겠습니까?`,
      [
        {text: '취소', style: 'cancel'},
        {
          text: '확인',
          onPress: () => {
            setSelectedScooter(null);
            // 선택한 킥보드 정보(scooter)를 넘겨줌
            navigation.navigate('HelmetVerification', {scooter: scooter});
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>주변 킥보드</Text>
          <View style={{width: 40}} />
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            ...myLocation,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          loadingEnabled={true}>
          {/* 서버에서 받아온 scooters 목록으로 마커 표시 */}
          {scooters.map(scooter => (
            <Marker
              key={scooter.id}
              coordinate={scooter.position}
              onPress={() => setSelectedScooter(scooter)}
              tracksViewChanges={false}>
              <View style={styles.markerContainer}>
                <View
                  style={[
                    styles.marker,
                    selectedScooter?.id === scooter.id && styles.selectedMarker,
                  ]}>
                  <Ionicons name="bicycle" size={20} color={colors.white} />
                </View>
                <View
                  style={[
                    styles.markerArrow,
                    selectedScooter?.id === scooter.id &&
                      styles.selectedMarkerArrow,
                  ]}
                />
              </View>
            </Marker>
          ))}
        </MapView>

        {/* 내 위치로 이동 & 새로고침 버튼 */}
        {!selectedScooter && (
          <TouchableOpacity
            style={[styles.locationButton, {bottom: 30}]}
            onPress={getCurrentLocationAndFetchScooters}>
            <Ionicons name="locate" size={24} color={colors.blue600} />
          </TouchableOpacity>
        )}
      </View>

      {/* 하단 정보 시트 */}
      {selectedScooter && (
        <View style={styles.bottomSheet}>
          <Card style={styles.sheetCard}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.scooterTitle}>
                  킥보드 #{selectedScooter.number}
                </Text>
                <Text style={styles.scooterDistance}>선택됨</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedScooter(null)}>
                <Ionicons name="close" size={24} color={colors.gray400} />
              </TouchableOpacity>
            </View>

            <View style={styles.scooterInfo}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="battery-charging"
                  size={20}
                  color={colors.green600}
                />
                <Text style={styles.infoText}>{selectedScooter.battery}%</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="location" size={20} color={colors.blue600} />
                <Text style={styles.infoText}>주변</Text>
              </View>
            </View>

            <Button
              title="이 킥보드 타기"
              onPress={() => handleUnlock(selectedScooter)}
              variant="secondary"
            />
          </Card>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ... (기존 스타일 그대로 유지)
  container: {flex: 1, backgroundColor: colors.white},
  header: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {fontSize: 18, fontWeight: 'bold', color: colors.text},
  mapContainer: {flex: 1, position: 'relative'},
  map: {...StyleSheet.absoluteFillObject},
  markerContainer: {alignItems: 'center', justifyContent: 'center'},
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: colors.white,
  },
  selectedMarker: {backgroundColor: colors.green600, transform: [{scale: 1.1}]},
  markerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 0,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.blue600,
    marginTop: -2,
  },
  selectedMarkerArrow: {borderTopColor: colors.green600},
  locationButton: {
    position: 'absolute',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 5,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    justifyContent: 'flex-end',
  },
  sheetCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  scooterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  scooterDistance: {fontSize: 14, color: colors.gray500},
  scooterInfo: {flexDirection: 'row', gap: 16, marginBottom: 16},
  infoItem: {flexDirection: 'row', alignItems: 'center', gap: 8},
  infoText: {fontSize: 16, color: colors.text},
});
