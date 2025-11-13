import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import MapView, {Marker, PROVIDER_GOOGLE} from 'react-native-maps';
import Geolocation from 'react-native-geolocation-service'; // 직접 위치 가져오기 위해 추가
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors} from '../component/constants/colors';
import {Card} from '../component/Card';
import {Button} from '../component/Button';

// useLocation(컨텍스트) 제거 -> 1초마다 재렌더링 방지

const {width, height} = Dimensions.get('window');

const mockScooters = [
  {
    id: '1',
    number: '4287',
    battery: 85,
    distance: 0.2,
    position: {latitude: 37.5665, longitude: 126.978},
  },
  {
    id: '2',
    number: '3156',
    battery: 92,
    distance: 0.5,
    position: {latitude: 37.567, longitude: 126.9785},
  },
  {
    id: '3',
    number: '7492',
    battery: 68,
    distance: 0.8,
    position: {latitude: 37.5655, longitude: 126.9775},
  },
  {
    id: '4',
    number: '5831',
    battery: 95,
    distance: 1.2,
    position: {latitude: 37.568, longitude: 126.979},
  },
  {
    id: '5',
    number: '2945',
    battery: 78,
    distance: 0.3,
    position: {latitude: 37.566, longitude: 126.977},
  },
];

export default function MapScreen({navigation}) {
  const [selectedScooter, setSelectedScooter] = useState(null);
  const mapRef = useRef(null);

  // 초기 지도 위치 (서울시청 부근)
  const initialRegion = {
    latitude: 37.5665,
    longitude: 126.978,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // [최적화] 버튼 누를 때만 현재 위치 가져오기 (실시간 구독 X)
  const handleMoveToCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          500,
        );
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
            // [변경] Camera 대신 HelmetVerification으로 이동하며 킥보드 정보 전달
            navigation.navigate('HelmetVerification', {scooter: scooter});
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
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

      {/* Map View */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation={true} // 내 위치 파란 점 (Native 레벨에서 처리하므로 성능 영향 적음)
          showsMyLocationButton={false}
          // [최적화] 지도 이동 중에는 렌더링 부하 줄이기
          loadingEnabled={true}>
          {mockScooters.map(scooter => (
            <Marker
              key={scooter.id}
              coordinate={scooter.position}
              onPress={() => setSelectedScooter(scooter)}
              // [최적화 핵심] tracksViewChanges={false} 설정으로 아이콘 렌더링 부하 감소
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

        {/* Current Location Button */}
        {!selectedScooter && (
          <TouchableOpacity
            style={[styles.locationButton, {bottom: 30}]}
            onPress={handleMoveToCurrentLocation}>
            <Ionicons name="locate" size={24} color={colors.blue600} />
          </TouchableOpacity>
        )}
      </View>

      {/* Scooter Details Bottom Sheet */}
      {selectedScooter && (
        <View style={styles.bottomSheet}>
          <Card style={styles.sheetCard}>
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.scooterTitle}>
                  킥보드 #{selectedScooter.number}
                </Text>
                <Text style={styles.scooterDistance}>
                  {selectedScooter.distance}km 거리
                </Text>
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

            <View style={styles.priceCard}>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>기본요금</Text>
                <Text style={styles.priceValue}>₩1,000</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>분당요금</Text>
                <Text style={styles.priceValue}>₩200/분</Text>
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
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  selectedMarker: {
    backgroundColor: colors.green600,
    transform: [{scale: 1.1}],
  },
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
  selectedMarkerArrow: {
    borderTopColor: colors.green600,
  },
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
  scooterDistance: {
    fontSize: 14,
    color: colors.gray500,
  },
  scooterInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    color: colors.text,
  },
  priceCard: {
    backgroundColor: colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: colors.gray600,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
