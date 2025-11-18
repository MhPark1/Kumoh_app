import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors} from '../component/constants/colors';
import Api from '../api/ApiUtils';
import {useFocusEffect, useNavigation} from '@react-navigation/native';

export default function HistoryScreen() {
  const navigation = useNavigation();
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  // [수정] fetchHistory를 useCallback으로 감싸서 메모이제이션 처리
  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await Api.getMyRides(navigation);
      if (response && response.success) {
        // 최신순 정렬 (내림차순)
        const sortedData = response.data.sort(
          (a, b) => new Date(b.start_time) - new Date(a.start_time),
        );
        setHistoryData(sortedData);
      }
    } catch (error) {
      console.error('히스토리 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  }, [navigation]); // navigation이 변경될 때만 함수 재생성

  // [수정] 의존성 배열에 fetchHistory 추가
  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory]),
  );

  // 날짜 포맷팅 헬퍼
  const formatDate = dateString => {
    const date = new Date(dateString);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      '0',
    )}-${String(date.getDate()).padStart(2, '0')} ${String(
      date.getHours(),
    ).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleItemPress = ride_id => {
    navigation.navigate('RideSummary', {
      ride_id: ride_id, // ride_id만 전달
    });
  };

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleItemPress(item.ride_id)}
      activeOpacity={0.7}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <View style={styles.dateTimeRow}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={colors.gray400}
              />
              <Text style={styles.dateText}>{formatDate(item.start_time)}</Text>
            </View>
            {/* pm_id가 킥보드 번호 */}
            <Text style={styles.scooterId}>킥보드 #{item.pm_id}</Text>
          </View>
          <Text style={styles.costText}>
            ₩{item.fare?.toLocaleString() || 0}
          </Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Ionicons name="time-outline" size={14} color={colors.gray600} />
            <Text style={styles.statText}>{item.duration}분</Text>
          </View>
          <View style={styles.statBadge}>
            <Ionicons
              name="navigate-outline"
              size={14}
              color={colors.gray600}
            />
            <Text style={styles.statText}>{item.distance}km</Text>
          </View>
          <View style={styles.statBadge}>
            <Ionicons
              name="shield-checkmark-outline"
              size={14}
              color={colors.green600}
            />
            <Text style={styles.statText}>{item.score}점</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // 통계 계산
  const totalRides = historyData.length;
  const totalDist = historyData.reduce(
    (acc, cur) => acc + (parseFloat(cur.distance) || 0),
    0,
  );

  const totalCost = historyData.reduce(
    (acc, cur) => acc + (parseInt(cur.fare) || 0),
    0,
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>이용 내역</Text>
      </View>
      <View style={styles.contentContainer}>
        {/* 상단 통계 카드 */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons
              name="flash-outline" // 총 이용 아이콘, leaf-outline
              size={22}
              color={colors.info}
              style={styles.statIcon}
            />
            <Text style={styles.statLabel}>총 이용</Text>
            <Text style={styles.statValue}>{totalRides}회</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="navigate-outline" // 총 거리 아이콘
              size={22}
              color={colors.success}
              style={styles.statIcon}
            />
            <Text style={styles.statLabel}>총 거리</Text>
            <Text style={styles.statValue}>{totalDist.toFixed(1)}km</Text>
          </View>

          <View style={styles.statCard}>
            <Ionicons
              name="card-outline" // 총 금액 아이콘,
              size={22}
              color={colors.purple600}
              style={styles.statIcon}
            />
            <Text style={styles.statLabel}>총 금액</Text>
            <Text style={styles.statValue}>₩{totalCost.toLocaleString()}</Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{marginTop: 20}}
          />
        ) : (
          <FlatList
            data={historyData}
            renderItem={renderItem}
            keyExtractor={item => item.ride_id} // ride_id를 키로 사용
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={{textAlign: 'center', marginTop: 50, color: '#999'}}>
                아직 주행 기록이 없습니다.
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.gray50},
  contentContainer: {flex: 1, padding: 16},
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    // backgroundColor: colors.white,
    // borderBottomWidth: 1,
    // borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statIcon: {
    marginBottom: 6,
  },
  statLabel: {color: '#666', marginBottom: 5},
  statValue: {fontWeight: 'bold', fontSize: 16},
  listContent: {paddingBottom: 20},
  card: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dateTimeRow: {flexDirection: 'row', alignItems: 'center', gap: 5},
  dateText: {color: '#666'},
  scooterId: {color: '#999', fontSize: 12, marginTop: 2},
  costText: {fontWeight: 'bold', fontSize: 16, color: colors.blue600},
  statsRow: {flexDirection: 'row', gap: 15},
  statBadge: {flexDirection: 'row', alignItems: 'center', gap: 4},
  statText: {color: '#444'},
});
