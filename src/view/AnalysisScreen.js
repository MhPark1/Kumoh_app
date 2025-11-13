import {StyleSheet, View, Text, Image, TouchableOpacity} from 'react-native';
import React from 'react';
import Icon from 'react-native-vector-icons/AntDesign'; // AntDesign 아이콘 임포트
import {useNavigation} from '@react-navigation/native';

export default function AnalysisScreen({route}) {
  if (!route?.params?.result) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text>분석 데이터가 없습니다.</Text>
      </View>
    );
  }

  const {result} = route.params;
  console.log(result.helmet_on);
  const navigation = useNavigation();

  // 운행 거리를 km 혹은 m로 변환하는 함수
  const formatDistance = distance => {
    if (distance >= 1000) {
      return {
        value: (distance / 1000).toFixed(2),
        unit: '킬로미터',
      };
    } else {
      return {
        value: distance.toFixed(2),
        unit: '미터',
      };
    }
  };

  const formatTime = seconds => {
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}분 ${secs}초`;
  };

  const pageMove = async () => {
    navigation.navigate('SelectionTab', {screen: 'Selection'});
  };

  const distance = formatDistance(result.total_distance_m);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>주행 기록</Text>
        <TouchableOpacity
          onPress={pageMove}
          hitSlop={{top: 20, bottom: 20, left: 20, right: 20}}>
          <Icon name="close" size={30} color="black" />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContainer}>
        {/* 점수 표시 */}
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreNumber}>{result.final_score}</Text>
          <Text style={styles.scoreLabel}>점수</Text>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statsItem}>
            {result.helmet_on === 'true' ? (
              <Image
                source={require('../asset/helmet_on.png')}
                style={styles.helmetImage}
                alt="Helmet On"
              />
            ) : (
              <Image
                source={require('../asset/helmet_off.png')}
                style={styles.helmetImage}
                alt="Helmet Off"
              />
            )}
            <Text style={styles.statsLabel}>안전모 착용 여부</Text>
          </View>
        </View>

        {/* 급가속 / 급감속 / 급정지 / 급출발 / 급회전 */}
        <View style={styles.statsRow}>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{result.sudden_accel_cnt}</Text>
            <Text style={styles.statsLabel}>급가속</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{result.sudden_decel_cnt}</Text>
            <Text style={styles.statsLabel}>급감속</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{result.sudden_start_cnt}</Text>
            <Text style={styles.statsLabel}>급발진</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{result.sudden_stop_cnt}</Text>
            <Text style={styles.statsLabel}>급정지</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{result.turn_noslow_cnt}</Text>
            <Text style={styles.statsLabel}>급회전</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>
              {formatTime(result.total_time_sec)}
            </Text>
            <Text style={styles.statsLabel}>시간</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statsItem}>
            <Text style={styles.statsNumber}>{distance.value}</Text>
            <Text style={styles.statsLabel}>{distance.unit}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 20,
  },
  header: {
    flexDirection: 'row', // 가로 방향 정렬
    alignItems: 'center', // 세로 중앙 정렬
    justifyContent: 'space-between', // 좌우 끝으로 정렬
    paddingHorizontal: 16, // 좌우 패딩 추가
    marginTop: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#545454',
    marginTop: 25,
    marginLeft: 15,
  },
  cardContainer: {
    backgroundColor: '#FFF8F5',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    // 그림자 예시(iOS/Android)
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#FF5722',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statsItem: {
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  statsLabel: {
    fontSize: 14,
    color: '#FF5722',
    marginTop: 4,
  },
});
