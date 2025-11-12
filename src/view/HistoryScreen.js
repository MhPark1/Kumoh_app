/**
 * 파일 경로: src/view/HistoryScreen.js
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Lucide 아이콘 대체
import {colors} from '../component/constants/colors'; // 기존 색상 상수 활용

// FigmaApp에서 가져온 더미 데이터 (추후 API 데이터로 교체 필요)
const mockHistory = [
  {
    id: '1',
    date: '2025-11-05',
    time: '14:30',
    scooter: '4287',
    duration: '15분',
    distance: '2.3km',
    cost: 4000,
    from: '강남역',
    to: '역삼동',
  },
  {
    id: '2',
    date: '2025-11-04',
    time: '09:15',
    scooter: '7492',
    duration: '8분',
    distance: '1.2km',
    cost: 2600,
    from: '서초동',
    to: '교대역',
  },
  {
    id: '3',
    date: '2025-11-03',
    time: '18:45',
    scooter: '3156',
    duration: '22분',
    distance: '3.8km',
    cost: 5400,
    from: '삼성역',
    to: '잠실역',
  },
  {
    id: '4',
    date: '2025-11-02',
    time: '12:20',
    scooter: '5831',
    duration: '12분',
    distance: '1.8km',
    cost: 3400,
    from: '홍대입구역',
    to: '합정역',
  },
  {
    id: '5',
    date: '2025-11-01',
    time: '16:00',
    scooter: '2945',
    duration: '18분',
    distance: '2.7km',
    cost: 4600,
    from: '신논현역',
    to: '강남역',
  },
];

export default function HistoryScreen() {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'week', 'month'

  // 통계 계산
  const totalRides = mockHistory.length;
  const totalDistance = mockHistory.reduce(
    (sum, ride) => sum + parseFloat(ride.distance),
    0,
  );
  const totalCost = mockHistory.reduce((sum, ride) => sum + ride.cost, 0);

  // 탭에 따른 데이터 필터링 로직 (현재는 더미 로직)
  const getFilteredData = () => {
    if (activeTab === 'week') return mockHistory.slice(0, 3);
    if (activeTab === 'month') return mockHistory;
    return mockHistory;
  };

  // 리스트 아이템 렌더링 컴포넌트
  const renderItem = ({item}) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <View style={styles.dateTimeRow}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={colors.gray400}
            />
            <Text style={styles.dateText}>{item.date}</Text>
            <Text style={styles.timeText}>{item.time}</Text>
          </View>
          <Text style={styles.scooterId}>킥보드 #{item.scooter}</Text>
        </View>
        <Text style={styles.costText}>₩{item.cost.toLocaleString()}</Text>
      </View>

      <View style={styles.routeRow}>
        <Ionicons name="location-sharp" size={14} color={colors.blue600} />
        <Text style={styles.routeText}>{item.from}</Text>
        <Ionicons name="arrow-forward" size={14} color={colors.gray400} />
        <Text style={styles.routeText}>{item.to}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBadge}>
          <Ionicons name="time-outline" size={14} color={colors.gray600} />
          <Text style={styles.statText}>{item.duration}</Text>
        </View>
        <View style={styles.statBadge}>
          <Ionicons name="navigate-outline" size={14} color={colors.gray600} />
          <Text style={styles.statText}>{item.distance}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        {/* 헤더 */}
        <Text style={styles.headerTitle}>이용 내역</Text>

        {/* 상단 통계 카드 (Stats Cards) */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons
              name="receipt-outline"
              size={24}
              color={colors.blue600}
              style={styles.statIcon}
            />
            <Text style={styles.statLabel}>총 이용</Text>
            <Text style={styles.statValue}>{totalRides}회</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons
              name="map-outline"
              size={24}
              color={colors.green600}
              style={styles.statIcon}
            />
            <Text style={styles.statLabel}>총 거리</Text>
            <Text style={styles.statValue}>{totalDistance.toFixed(1)}km</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.currencyIcon}>₩</Text>
            <Text style={styles.statLabel}>총 금액</Text>
            <Text style={styles.statValue}>₩{totalCost.toLocaleString()}</Text>
          </View>
        </View>

        {/* 탭 버튼 (Tabs) */}
        <View style={styles.tabContainer}>
          {['all', 'week', 'month'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton,
              ]}
              onPress={() => setActiveTab(tab)}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}>
                {tab === 'all'
                  ? '전체'
                  : tab === 'week'
                  ? '이번 주'
                  : '이번 달'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 이용 내역 리스트 */}
        <FlatList
          data={getFilteredData()}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50, // #f9fafb
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 20,
  },
  // 통계 카드 스타일
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statIcon: {
    marginBottom: 8,
  },
  currencyIcon: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
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
    color: '#111827',
  },
  // 탭 스타일
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.gray200, // muted background
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTabButton: {
    backgroundColor: colors.white,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray500,
  },
  activeTabText: {
    color: '#111827',
    fontWeight: '600',
  },
  // 리스트 카드 스타일
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: colors.gray600,
  },
  timeText: {
    fontSize: 14,
    color: colors.gray400,
  },
  scooterId: {
    fontSize: 14,
    color: colors.gray500,
  },
  costText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.blue600,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  routeText: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: colors.gray600,
  },
});
