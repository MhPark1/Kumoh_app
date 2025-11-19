import React, {useState, useEffect} from 'react'; // ★ useEffect 추가
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator, // ★ 추가
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors} from '../component/constants/colors';
import {Card} from '../component/Card';
import {Button} from '../component/Button';
import Api from '../api/ApiUtils'; // ★ API 호출을 위해 추가
import {CommonActions} from '@react-navigation/native';

const formatDuration = totalMinutes => {
  // ★ [수정]
  // totalMinutes가 0 (즉, 1분 미만 주행)일 경우 '1분'으로 표시
  if (totalMinutes === 0) {
    return '1분';
  }

  // (방어 코드) null 또는 undefined인 경우 0분 표시
  if (!totalMinutes) {
    return '0분';
  }

  // 1분 이상일 경우
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  // 60분, 120분 등 딱 떨어질 때 '0분' 제거
  if (hours > 0 && minutes === 0) {
    return `${hours}시간`;
  }
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }

  return `${minutes}분`;
};
const riskTypeToLabel = {
  sudden_start: '급출발',
  sudden_accel: '급가속',
  sudden_stop: '급정지',
  sudden_decel: '급감속',
  sudden_turn: '급회전',
};

export default function RideSummaryScreen({route, navigation}) {
  // GpsScreen에서 오면: { result, riskCounts, isHelmet }
  // HistoryScreen에서 오면: { ride_id }
  const {result, riskCounts, isHelmet, ride_id} = route.params || {};

  // ★ [추가] 상태 관리
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(result || null);
  const [risks, setRisks] = useState(riskCounts || null);
  const [helmetStatus, setHelmetStatus] = useState(isHelmet);

  // ★ [추가] ride_id만 넘어온 경우 (HistoryScreen), 서버에서 데이터 로드
  useEffect(() => {
    // GpsScreen에서 데이터를 이미 다 받았으면 실행 안 함
    if (summary && risks) {
      return;
    }

    const fetchRideDetails = async () => {
      if (ride_id) {
        setLoading(true);
        try {
          const response = await Api.getRideSummary(ride_id, navigation);
          if (response.data) {
            setSummary(response.data.summary);
            setRisks(response.data.riskCounts);
            setHelmetStatus(response.data.summary.isHelmet);
          } else {
            throw new Error(response.message || '데이터 로드 실패');
          }
        } catch (error) {
          console.error('상세 내역 로딩 실패:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchRideDetails();
  }, [ride_id, summary, risks, navigation]); // 의존성 배열 설정

  const hasRisks = risks && Object.values(risks).some(count => count > 0);

  const handleConfirm = () => {
    // HistoryScreen에서 이 화면을 연 경우 (뒤로가기)
    if (!result) {
      navigation.goBack();
      return;
    }

    // // GpsScreen에서 온 경우 (스택 리셋)
    // // CommonActions.reset을 사용하여 스택을 초기화합니다.
    // navigation.dispatch(
    //   CommonActions.reset({
    //     index: 0,
    //     routes: [
    //       {
    //         name: 'Selection', // 1. 메인 탭 네비게이터 이름
    //         // 2. 탭 네비게이터에 'History' 탭으로 이동하라고 params 전달
    //         params: {
    //           screen: 'History',
    //         },
    //       },
    //     ],
    //   }),
    // );
    // GpsScreen에서 온 경우: History 탭의 History 화면으로 이동
    // 방법 1: 부모(Tab) 네비게이터에 명시적으로 보내기
    const parentNav = navigation.getParent();
    if (parentNav) {
      parentNav.navigate('HistoryTab', {
        screen: 'History',
      });
    } else {
      // 부모를 못 찾는 경우를 대비한 fallback (대부분 필요 없겠지만 방어 코드)
      navigation.navigate('HistoryTab', {
        screen: 'History',
      });
    }
  };

  // ★ [추가] 로딩 중 화면
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{marginTop: 50}}
        />
        <Text style={styles.loadingText}>주행 상세 내역을 불러오는 중...</Text>
      </SafeAreaView>
    );
  }

  // ★ [추가] 데이터 로드 실패 시
  if (!summary) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.noRiskText}>
          주행 내역을 불러오는 데 실패했습니다.
        </Text>
        <View style={styles.bottomButtonContainer}>
          <Button
            title="뒤로가기"
            onPress={() => navigation.goBack()}
            variant="outline"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. 상단 점수 카드 */}
        <Card style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>주행 안전 점수</Text>
          <View style={styles.scoreValueContainer}>
            <Text style={styles.scoreValue}>{summary.score || 0}</Text>
            <Text style={styles.scoreMax}>/ 100</Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, {width: `${summary.score || 0}%`}]}
            />
          </View>
        </Card>

        {/* 2. 주행 요약 카드 */}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>주행 요약</Text>
          <View style={styles.summaryRow}>
            <Ionicons name="map-outline" size={20} color={colors.blue600} />
            <Text style={styles.summaryLabel}>이동 거리</Text>
            <Text style={styles.summaryValue}>{summary.distance || 0} km</Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons name="time-outline" size={20} color={colors.green600} />
            <Text style={styles.summaryLabel}>주행 시간</Text>
            <Text style={styles.summaryValue}>
              {formatDuration(summary.duration)}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Ionicons
              name="wallet-outline"
              size={20}
              color={colors.purple600}
            />
            <Text style={styles.summaryLabel}>최종 요금</Text>

            {/* 요금 값과 배지를 가로로 정렬 (flexDirection: 'row') */}
            <View style={styles.fareValueContainer}>
              {/* 1. [위치 변경] 할인 배지를 먼저 작성 -> 왼쪽에 표시됨 */}
              {summary.isDiscounted && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>10% 할인됨</Text>
                </View>
              )}

              {/* 2. 요금 텍스트를 나중에 작성 -> 오른쪽에 표시됨 */}
              <Text style={styles.summaryValue}>
                ₩{summary.fare?.toLocaleString() || 0}
              </Text>
            </View>
          </View>

          {/* ★ [수정] GpsScreen/HistoryScreen 둘 다 커버 */}
          <View style={styles.summaryRow}>
            <Ionicons
              name={
                helmetStatus ? 'shield-checkmark-outline' : 'shield-outline'
              }
              size={20}
              color={helmetStatus ? colors.green600 : colors.red600}
            />
            <Text style={styles.summaryLabel}>헬멧 착용 여부</Text>
            <Text
              style={[
                styles.summaryValue,
                {color: helmetStatus ? colors.green600 : colors.red600},
              ]}>
              {helmetStatus ? '착용' : '미착용 (감점)'}
            </Text>
          </View>
        </Card>

        {/* 3. 위험 감지 항목 */}
        <Card style={styles.riskCard}>
          <Text style={styles.sectionTitle}>감지된 위험 항목</Text>
          {hasRisks ? (
            <View style={styles.riskGrid}>
              {Object.entries(risks).map(([key, value]) => {
                if (value === 0) return null;
                return (
                  <View key={key} style={styles.riskItem}>
                    <Text style={styles.riskValue}>{value}회</Text>
                    <Text style={styles.riskLabel}>{riskTypeToLabel[key]}</Text>
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noRiskText}>
              감지된 위험 항목이 없습니다.
              {'\n'}안전하게 주행하셨습니다!
            </Text>
          )}
        </Card>
      </ScrollView>

      {/* 하단 확인 버튼 */}
      <View style={styles.bottomButtonContainer}>
        {/* ★ [수정] 버튼 텍스트 변경 */}
        <Button
          title={result ? '내역 확인하기' : '뒤로가기'}
          onPress={handleConfirm}
        />
      </View>
    </SafeAreaView>
  );
}

// ... (스타일 동일)
const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.gray50},
  loadingText: {textAlign: 'center', marginTop: 10, color: colors.gray500},
  scrollContent: {padding: 16, paddingBottom: 100},
  scoreCard: {
    backgroundColor: colors.green600,
    marginBottom: 16,
    padding: 20,
  },
  scoreLabel: {fontSize: 14, color: colors.green100, marginBottom: 4},
  scoreValueContainer: {flexDirection: 'row', alignItems: 'flex-end', gap: 8},
  scoreValue: {fontSize: 40, fontWeight: 'bold', color: colors.white},
  scoreMax: {fontSize: 20, color: colors.green100, marginBottom: 4},
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 4,
  },
  summaryCard: {padding: 20, marginBottom: 16, gap: 16},
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  summaryRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  summaryLabel: {fontSize: 16, color: colors.gray600, flex: 1},
  summaryValue: {fontSize: 16, fontWeight: '600', color: colors.text},
  riskCard: {padding: 20},
  riskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  riskItem: {
    minWidth: '45%',
    backgroundColor: colors.gray50,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flexGrow: 1,
  },
  riskValue: {fontSize: 18, fontWeight: 'bold', color: colors.red600},
  riskLabel: {fontSize: 14, color: colors.gray600, marginTop: 4},
  noRiskText: {
    fontSize: 16,
    color: colors.gray500,
    textAlign: 'center',
    paddingVertical: 20,
    lineHeight: 24,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  fareValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, // 요금과 배지 사이 간격
  },
  discountBadge: {
    backgroundColor: '#dcfce7', // 연한 초록 배경
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#16a34a', // 진한 초록 테두리
  },
  discountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#15803d', // 글자색
  },
});
