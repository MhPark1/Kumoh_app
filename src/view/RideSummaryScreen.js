import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors} from '../component/constants/colors';
import {Card} from '../component/Card';
import {Button} from '../component/Button';

// 헬퍼 함수: 분을 'X시간 Y분' 또는 'Y분'으로 변환
const formatDuration = totalMinutes => {
  if (!totalMinutes || totalMinutes === 0) return '0분';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) {
    return `${hours}시간 ${minutes}분`;
  }
  return `${minutes}분`;
};

// 헬퍼 함수: 위험 항목 텍스트 매핑
const riskTypeToLabel = {
  sudden_start: '급출발',
  sudden_accel: '급가속',
  sudden_stop: '급정지',
  sudden_decel: '급감속',
  sudden_turn: '급회전',
};

export default function RideSummaryScreen({route, navigation}) {
  // GpsScreen에서 보낸 두 개의 파라미터를 받습니다.
  const {result, riskCounts} = route.params || {};

  // GpsScreen에서 받은 위험 항목 횟수
  const risks = riskCounts || {};
  // 서버에서 받은 최종 결과 (요금, 점수 등)
  const summary = result || {};

  // 위험 항목이 하나라도 있는지 확인
  const hasRisks = Object.values(risks).some(count => count > 0);

  const handleConfirm = () => {
    // 확인 버튼 클릭 시, 스택을 초기화하고 'History' 탭으로 이동
    navigation.reset({
      index: 0,
      routes: [{name: 'MainTabs'}], // MainScreen(Selection)이 포함된 탭 네비게이터 이름
    });
    navigation.navigate('History');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. 상단 점수 카드 */}
        <Card style={styles.scoreCard}>
          <Text style={styles.scoreLabel}>이번 주행 안전 점수</Text>
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
            <Text style={styles.summaryValue}>
              ₩{summary.fare?.toLocaleString() || 0}
            </Text>
          </View>
        </Card>

        {/* 3. 위험 감지 항목 */}
        <Card style={styles.riskCard}>
          <Text style={styles.sectionTitle}>감지된 위험 항목</Text>
          {hasRisks ? (
            <View style={styles.riskGrid}>
              {Object.entries(risks).map(([key, value]) => {
                if (value === 0) return null; // 0회인 항목은 표시 안 함
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
        <Button title="확인" onPress={handleConfirm} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.gray50},
  scrollContent: {padding: 16, paddingBottom: 100}, // 하단 버튼 공간 확보
  // 점수 카드
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
  // 요약 카드
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
  // 위험 카드
  riskCard: {padding: 20},
  riskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  riskItem: {
    minWidth: '45%', // 2열 배치
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
  // 하단 버튼
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32, // SafeArea 고려
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
