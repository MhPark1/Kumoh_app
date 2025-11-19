import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Api from '../api/ApiUtils';
import {useFocusEffect} from '@react-navigation/native';
import {colors} from '../component/constants/colors';

export default function AnalysisScreen({navigation}) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // [수정] API 응답 전체를 담을 상태
  const [analysisData, setAnalysisData] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // [수정] 운전 분석 전용 API 호출
      const response = await Api.getAnalysisStats(navigation);
      if (response && response.success) {
        setAnalysisData(response.data);
      } else {
        setAnalysisData(null);
      }
    } catch (error) {
      console.error('분석 데이터 로드 실패:', error);
      setAnalysisData(null);
    } finally {
      setLoading(false);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData]),
  );

  // [수정] analysisData에서 안전 점수 가져오기
  const safetyScore = Math.round(analysisData?.safetyScore ?? 0);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
          <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        // [수정] OverviewTab에 analysisData 전달
        return <OverviewTab data={analysisData} />;
      case 'details':
        // [수정] DetailsTab에 analysisData 전달
        return <DetailsTab data={analysisData} />;
      case 'tips':
        return <TipsTab />;
      default:
        return <OverviewTab data={analysisData} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>운전 분석</Text>
          <View style={{width: 40}} />
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <View>
              <Text style={styles.scoreLabel}>나의 안전운전점수</Text>
              <View style={styles.scoreValueContainer}>
                <Text style={styles.scoreValue}>{safetyScore}</Text>
                <Text style={styles.scoreMax}>/ 100</Text>
              </View>
            </View>
            <View style={styles.scoreIcon}>
              <Icon name="shield-checkmark" size={32} color="#ffffff" />
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {width: `${safetyScore}%`}]} />
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'overview' && styles.activeTab]}
            onPress={() => setSelectedTab('overview')}>
            <Text
              style={[
                styles.tabText,
                selectedTab === 'overview' && styles.activeTabText,
              ]}>
              개요
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'details' && styles.activeTab]}
            onPress={() => setSelectedTab('details')}>
            <Text
              style={[
                styles.tabText,
                selectedTab === 'details' && styles.activeTabText,
              ]}>
              상세 분석
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'tips' && styles.activeTab]}
            onPress={() => setSelectedTab('tips')}>
            <Text
              style={[
                styles.tabText,
                selectedTab === 'tips' && styles.activeTabText,
              ]}>
              개선 팁
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {renderTabContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

// Overview Tab (실제 데이터 연동)
function OverviewTab({data}) {
  let averageSpeed = 0;
  if (data && data.totalDuration > 0) {
    // API 명세서 키: totalDistance / (totalDuration / 60)
    averageSpeed = data.totalDistance / (data.totalDuration / 60);
  }

  const totalRides = data?.totalRides || 0;
  const helmetOffCount = data?.helmetOffCount || 0;
  const helmetRate =
    totalRides > 0
      ? Math.max(0, ((totalRides - helmetOffCount) / totalRides) * 100)
      : 100;

  // API 명세서 키: riskCounts
  const totalRisks = data?.riskCounts
    ? Object.values(data.riskCounts).reduce((acc, val) => acc + val, 0)
    : 0;

  return (
    <View style={styles.tabContent}>
      <View style={styles.overviewGrid}>
        <View style={styles.overviewCard}>
          <Icon
            name="checkmark-circle"
            size={24}
            color="#16a34a"
            style={styles.overviewIcon}
          />
          <Text style={styles.overviewLabel}>총 주행 횟수</Text>
          <Text style={styles.overviewValue}>{totalRides}회</Text>
        </View>

        <View style={styles.overviewCard}>
          <Icon
            name="warning"
            size={24}
            color="#ea580c"
            style={styles.overviewIcon}
          />
          <Text style={styles.overviewLabel}>총 위험 감지</Text>
          <Text style={styles.overviewValue}>{totalRisks}회</Text>
        </View>

        <View style={styles.overviewCard}>
          <Icon
            name="shield-checkmark"
            size={24}
            color="#2563eb"
            style={styles.overviewIcon}
          />
          <Text style={styles.overviewLabel}>헬멧 착용률</Text>
          <Text style={styles.overviewValue}>{helmetRate.toFixed(0)}%</Text>
        </View>

        <View style={styles.overviewCard}>
          <Icon
            name="trending-up"
            size={24}
            color="#9333ea"
            style={styles.overviewIcon}
          />
          <Text style={styles.overviewLabel}>평균 속도</Text>
          <Text style={styles.overviewValue}>
            {averageSpeed.toFixed(1)} km/h
          </Text>
          <Text style={styles.overviewSubtext}>전체 주행 기준</Text>
        </View>
      </View>
    </View>
  );
}

// Details Tab (실제 데이터 연동)
function DetailsTab({data}) {
  const totalMinutes = data?.totalDuration || 0;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const formattedDuration =
    hours > 0 ? `${hours}시간 ${minutes}분` : `${minutes}분`;

  // API 명세서 키: data.riskCounts
  const riskStats = data?.riskCounts || {};

  return (
    <View style={styles.tabContent}>
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>누적 운전 정보</Text>
        <View style={styles.detailRow}>
          <View style={[styles.detailIcon, {backgroundColor: '#dbeafe'}]}>
            <Icon name="map" size={20} color="#2563eb" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>전체 운전거리</Text>
            <Text style={styles.detailValue}>
              {data?.totalDistance || 0} km
            </Text>
          </View>
        </View>
        <View style={styles.detailRow}>
          <View style={[styles.detailIcon, {backgroundColor: '#dcfce7'}]}>
            <Icon name="time" size={20} color="#16a34a" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>전체 운전시간</Text>
            <Text style={styles.detailValue}>{formattedDuration}</Text>
          </View>
        </View>
      </View>

      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>감지된 위험 항목</Text>

        <View style={styles.detailRow}>
          <View style={[styles.detailIcon, {backgroundColor: '#fef3c7'}]}>
            <Icon name="rocket-outline" size={20} color="#f59e0b" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>급출발</Text>
            <Text style={styles.detailValue}>
              {riskStats.sudden_start || 0} 회
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={[styles.detailIcon, {backgroundColor: '#fef3c7'}]}>
            <Icon name="speedometer-outline" size={20} color="#f59e0b" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>급가속</Text>
            <Text style={styles.detailValue}>
              {riskStats.sudden_accel || 0} 회
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={[styles.detailIcon, {backgroundColor: '#fee2e2'}]}>
            <Icon name="stop-circle-outline" size={20} color="#dc2626" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>급정지</Text>
            <Text style={styles.detailValue}>
              {riskStats.sudden_stop || 0} 회
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={[styles.detailIcon, {backgroundColor: '#fee2e2'}]}>
            <Icon name="warning-outline" size={20} color="#dc2626" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>급감속</Text>
            <Text style={styles.detailValue}>
              {riskStats.sudden_decel || 0} 회
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={[styles.detailIcon, {backgroundColor: '#f3e8ff'}]}>
            <Icon name="refresh-outline" size={20} color="#9333ea" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>급회전</Text>
            <Text style={styles.detailValue}>
              {riskStats.sudden_turn || 0} 회
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Tips Tab (팁 보강됨)
function TipsTab() {
  return (
    <View style={styles.tabContent}>
      <View
        style={[
          styles.tipCard,
          {backgroundColor: '#eff6ff', borderColor: '#bfdbfe'},
        ]}>
        <View style={styles.tipHeader}>
          <View style={styles.tipIconContainer}>
            <Text style={styles.tipEmoji}>💡</Text>
          </View>
          <View style={styles.tipTextContainer}>
            <Text style={styles.tipTitle}>부드러운 출발/정지</Text>
            <Text style={styles.tipDescription}>
              급가속과 급제동은 배터리 소모가 크고 위험합니다. 스로틀을 천천히
              당기고, 브레이크를 미리 예측하여 부드럽게 잡으세요.
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.tipCard,
          {backgroundColor: '#faf5ff', borderColor: '#e9d5ff'},
        ]}>
        <View style={styles.tipHeader}>
          <View style={styles.tipIconContainer}>
            <Text style={styles.tipEmoji}>🔄</Text>
          </View>
          <View style={styles.tipTextContainer}>
            <Text style={styles.tipTitle}>급회전 주의</Text>
            <Text style={styles.tipDescription}>
              코너를 돌기 전 속도를 충분히 줄이세요. 방향 전환 시 무게중심을
              급격히 옮기면 미끄러질 수 있습니다.
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.tipCard,
          {backgroundColor: '#f0fdf4', borderColor: '#bbf7d0'},
        ]}>
        <View style={styles.tipHeader}>
          <View style={styles.tipIconContainer}>
            <Text style={styles.tipEmoji}>🚦</Text>
          </View>
          <View style={styles.tipTextContainer}>
            <Text style={styles.tipTitle}>안전거리 유지</Text>
            <Text style={styles.tipDescription}>
              앞차나 보행자와의 거리를 충분히 유지하면 돌발 상황에 대처할 시간을
              확보하여 급정지를 예방할 수 있습니다.
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.tipCard,
          {backgroundColor: '#fffbeb', borderColor: '#fde68a'},
        ]}>
        <View style={styles.tipHeader}>
          <View style={styles.tipIconContainer}>
            <Text style={styles.tipEmoji}>⛑️</Text>
          </View>
          <View style={styles.tipTextContainer}>
            <Text style={styles.tipTitle}>헬멧 턱끈 조절</Text>
            <Text style={styles.tipDescription}>
              헬멧을 쓰는 것만큼 턱끈을 알맞게 조이는 것이 중요합니다. 사고 시
              헬멧이 벗겨지지 않도록 손가락 한두 개가 들어갈 정도로 조이세요.
            </Text>
          </View>
        </View>
      </View>

      <View
        style={[
          styles.tipCard,
          {backgroundColor: '#fef2f2', borderColor: '#fecaca'},
        ]}>
        <View style={styles.tipHeader}>
          <View style={styles.tipIconContainer}>
            <Text style={styles.tipEmoji}>🛣️</Text>
          </View>
          <View style={styles.tipTextContainer}>
            <Text style={styles.tipTitle}>도로 규칙 준수</Text>
            <Text style={styles.tipDescription}>
              자전거 도로를 이용하고 인도 주행을 피해주세요. 차도에서는 항상
              우측 가장자리로 주행해야 합니다.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// (Styles 코드는 이전 답변과 동일하게 유지)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
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
  headerTitle: {fontSize: 18, fontWeight: 'bold', color: colors.text},
  scoreCard: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#dcfce7',
    marginBottom: 4,
  },
  scoreValueContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  scoreValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scoreMax: {
    fontSize: 20,
    color: '#dcfce7',
    marginBottom: 4,
  },
  scoreIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  activeTabText: {
    color: '#2563eb',
  },
  tabContent: {
    marginBottom: 24,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  overviewIcon: {
    marginBottom: 8,
  },
  overviewLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  overviewSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },
  detailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    gap: 12,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailInfo: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  tipCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  tipHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipEmoji: {
    fontSize: 24,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tipDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
});
