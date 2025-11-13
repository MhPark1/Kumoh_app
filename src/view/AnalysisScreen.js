import React, {useState, useEffect} from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Api from '../api/ApiUtils';
import {useFocusEffect} from '@react-navigation/native';

export default function AnalysisScreen({navigation}) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [statsData, setStatsData] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);

      // 사용자 정보 가져오기 (안전 점수 포함)
      const userResponse = await Api.getMainScreenData(
        {user_id: await AsyncStorage.getItem('user_id')},
        navigation,
      );
      const userInfo = JSON.parse(userResponse.data);

      // 감점 요인 통계 가져오기
      const statsResponse = await Api.getHistoryByPeriod(
        {
          user_id: await AsyncStorage.getItem('user_id'),
          start_date: new Date(new Date().setMonth(new Date().getMonth() - 1))
            .toISOString()
            .split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
        },
        navigation,
      );
      const stats = JSON.parse(statsResponse.data);

      setUserData(userInfo);
      setStatsData(stats);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, []),
  );

  const safetyScore = Math.round(userData?.average_final_score ?? 0);
  const previousScore = 88; // 이전 점수는 별도 API 필요
  const scoreChange = safetyScore - previousScore;

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
        return <OverviewTab />;
      case 'details':
        return <DetailsTab />;
      case 'tips':
        return <TipsTab />;
      default:
        return <OverviewTab />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={styles.header}>운전 분석</Text>

        {/* Safety Score Card */}
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

          <View style={styles.scoreTrend}>
            <Icon
              name={scoreChange > 0 ? 'trending-up' : 'trending-down'}
              size={16}
              color={scoreChange > 0 ? '#dcfce7' : '#fecaca'}
            />
            <Text style={styles.scoreTrendText}>
              지난주 대비 {scoreChange > 0 ? '+' : ''}
              {scoreChange}점 {scoreChange > 0 ? '상승' : '하락'}
            </Text>
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

// Overview Tab
function OverviewTab() {
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
          <Text style={styles.overviewLabel}>안전 주행</Text>
          <Text style={styles.overviewValue}>47회</Text>
          <Text style={styles.overviewChange}>+5회</Text>
        </View>

        <View style={styles.overviewCard}>
          <Icon
            name="warning"
            size={24}
            color="#ea580c"
            style={styles.overviewIcon}
          />
          <Text style={styles.overviewLabel}>주의 필요</Text>
          <Text style={styles.overviewValue}>3회</Text>
          <Text style={styles.overviewChange}>-1회</Text>
        </View>

        <View style={styles.overviewCard}>
          <Icon
            name="shield-checkmark"
            size={24}
            color="#2563eb"
            style={styles.overviewIcon}
          />
          <Text style={styles.overviewLabel}>헬멧 착용률</Text>
          <Text style={styles.overviewValue}>98%</Text>
          <Text style={styles.overviewChange}>+2%</Text>
        </View>

        <View style={styles.overviewCard}>
          <Icon
            name="trending-up"
            size={24}
            color="#9333ea"
            style={styles.overviewIcon}
          />
          <Text style={styles.overviewLabel}>평균 속도</Text>
          <Text style={styles.overviewValue}>18km/h</Text>
          <Text style={styles.overviewSubtext}>적정 범위</Text>
        </View>
      </View>
    </View>
  );
}

// Details Tab
function DetailsTab() {
  return (
    <View style={styles.tabContent}>
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>월간 운전 패턴</Text>

        <View style={styles.detailRow}>
          <View style={[styles.detailIcon, {backgroundColor: '#dbeafe'}]}>
            <Icon name="map" size={20} color="#2563eb" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>전체 운전거리</Text>
            <Text style={styles.detailValue}>95.4 km</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={[styles.detailIcon, {backgroundColor: '#f3e8ff'}]}>
            <Icon name="moon" size={20} color="#9333ea" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>야간 운전거리</Text>
            <Text style={styles.detailValue}>18.2 km</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={[styles.detailIcon, {backgroundColor: '#dcfce7'}]}>
            <Icon name="time" size={20} color="#16a34a" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>전체 운전시간</Text>
            <Text style={styles.detailValue}>4시간 5분</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={[styles.detailIcon, {backgroundColor: '#fee2e2'}]}>
            <Icon name="warning" size={20} color="#dc2626" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>급감속</Text>
            <Text style={styles.detailValue}>3 회</Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={[styles.detailIcon, {backgroundColor: '#fef3c7'}]}>
            <Icon name="speedometer" size={20} color="#f59e0b" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>급가속</Text>
            <Text style={styles.detailValue}>5 회</Text>
          </View>
        </View>
      </View>

      {/* Recent Issues */}
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>최근 이슈</Text>

        <View style={styles.issueItem}>
          <View style={[styles.issueIcon, {backgroundColor: '#fed7aa'}]}>
            <Icon name="warning" size={16} color="#ea580c" />
          </View>
          <View style={styles.issueInfo}>
            <Text style={styles.issueText}>급제동 감지</Text>
            <Text style={styles.issueTime}>2025-11-04 14:23</Text>
          </View>
        </View>

        <View style={styles.issueItem}>
          <View style={[styles.issueIcon, {backgroundColor: '#bbf7d0'}]}>
            <Icon name="checkmark-circle" size={16} color="#16a34a" />
          </View>
          <View style={styles.issueInfo}>
            <Text style={styles.issueText}>안전 주행 완료</Text>
            <Text style={styles.issueTime}>2025-11-03 18:45</Text>
          </View>
        </View>

        <View style={styles.issueItem}>
          <View style={[styles.issueIcon, {backgroundColor: '#bfdbfe'}]}>
            <Icon name="medal" size={16} color="#2563eb" />
          </View>
          <View style={styles.issueInfo}>
            <Text style={styles.issueText}>안전 배지 획득</Text>
            <Text style={styles.issueTime}>2025-11-02 12:20</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

// Tips Tab
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
            <Text style={styles.tipTitle}>속도 조절</Text>
            <Text style={styles.tipDescription}>
              급가속과 급제동을 피하고 일정한 속도를 유지하세요.
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
            <Text style={styles.tipEmoji}>✅</Text>
          </View>
          <View style={styles.tipTextContainer}>
            <Text style={styles.tipTitle}>올바른 주차</Text>
            <Text style={styles.tipDescription}>
              지정된 주차 구역에만 킥보드를 반납해주세요.
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
            <Text style={styles.tipEmoji}>🛣️</Text>
          </View>
          <View style={styles.tipTextContainer}>
            <Text style={styles.tipTitle}>도로 규칙 준수</Text>
            <Text style={styles.tipDescription}>
              자전거 도로를 이용하고 인도 주행을 피해주세요.
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
            <Text style={styles.tipEmoji}>⚡</Text>
          </View>
          <View style={styles.tipTextContainer}>
            <Text style={styles.tipTitle}>안전 장비</Text>
            <Text style={styles.tipDescription}>
              헬멧 착용은 필수! 안전을 최우선으로 생각하세요.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },

  // Score Card
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
  scoreTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scoreTrendText: {
    fontSize: 14,
    color: '#dcfce7',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },

  // Tabs
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

  // Tab Content
  tabContent: {
    marginBottom: 24,
  },

  // Overview
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
  overviewChange: {
    fontSize: 12,
    color: '#16a34a',
  },
  overviewSubtext: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Details
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

  // Issues
  issueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  issueIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  issueInfo: {
    flex: 1,
  },
  issueText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  issueTime: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Tips
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
