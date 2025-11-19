import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import Api from '../api/ApiUtils';
// colors import 경로 확인 필요 (상대 경로에 맞게 조정하세요)
import {colors} from '../component/constants/colors';

export default function HomeScreen({navigation}) {
  const [userInfo, setUserInfo] = useState({
    nickname: '사용자',
    safety_score: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  // 내 정보 가져오기
  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await Api.getMe(navigation);
      if (response && response.success) {
        setUserInfo(response.data);
      }
    } catch (error) {
      console.error('내 정보 로딩 실패:', error);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchUserInfo();
    }, [fetchUserInfo]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserInfo();
    setRefreshing(false);
  };

  const getScoreMessage = score => {
    if (score >= 90) return '우수한 운전 습관을 유지하고 계세요! 👍';
    if (score >= 70) return '안전 운전에 조금 더 신경 써주세요! ⚠️';
    return '위험해요! 안전 운전이 필요합니다. 🚨';
  };

  // ★ [추가] 할인 여부 판단 로직 (90점 이상)
  const isDiscountActive = (userInfo.safety_score || 0) >= 90;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* User Info Card */}
        <LinearGradient
          colors={['#16a34a', '#059669']}
          style={styles.userCard}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <View style={styles.userHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color="#16a34a" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {userInfo.nickname || userInfo.user_name || '사용자'}님
              </Text>
              <Text style={styles.userGreeting}>안전한 하루 되세요!</Text>
            </View>
          </View>

          <View style={styles.scoreCard}>
            <View style={styles.scoreContent}>
              <View style={styles.scoreLeft}>
                {/* ★ [수정] 라벨과 할인 배지를 가로로 배치 */}
                <View style={styles.labelRow}>
                  <Text style={styles.scoreLabel}>안전운전점수</Text>

                  {/* 90점 이상일 때만 할인 배지 표시 */}
                  {isDiscountActive && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>🎉 10% 할인 적용</Text>
                    </View>
                  )}
                </View>

                <View style={styles.scoreRow}>
                  <Text style={styles.scoreValue}>
                    {userInfo.safety_score !== undefined
                      ? userInfo.safety_score
                      : '-'}
                  </Text>
                  <Text style={styles.scoreMax}> / 100</Text>
                </View>
              </View>
              <View style={styles.scoreIcon}>
                <Ionicons name="shield-checkmark" size={28} color="#ffffff" />
              </View>
            </View>

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {width: `${userInfo.safety_score || 0}%`},
                ]}
              />
            </View>

            <Text style={styles.scoreMessage}>
              {getScoreMessage(userInfo.safety_score || 0)}
            </Text>
          </View>
        </LinearGradient>

        {/* 빠른 시작 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빠른 시작</Text>

          <TouchableOpacity
            style={[styles.actionCard, styles.qrCard]}
            onPress={() => navigation.navigate('QRScanner')}>
            <View style={styles.actionIconContainer}>
              <View style={[styles.actionIcon, {backgroundColor: '#2563eb'}]}>
                <Ionicons name="qr-code-outline" size={28} color="#ffffff" />
              </View>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>QR 코드 스캔</Text>
              <Text style={styles.actionDescription}>
                킥보드의 QR 코드를 스캔하세요
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.mapCard]}
            onPress={() => navigation.navigate('Map')}>
            <View style={styles.actionIconContainer}>
              <View style={[styles.actionIcon, {backgroundColor: '#16a34a'}]}>
                <Ionicons name="map-outline" size={28} color="#ffffff" />
              </View>
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>지도에서 찾기</Text>
              <Text style={styles.actionDescription}>
                주변 킥보드 위치를 확인하세요
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 더 알아보기 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>더 알아보기</Text>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() =>
              navigation.navigate('HistoryTab', {
                screen: 'History',
              })
            }>
            <View style={[styles.linkIcon, {backgroundColor: '#ede9fe'}]}>
              <Ionicons name="time-outline" size={24} color="#7c3aed" />
            </View>
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>이용 내역</Text>
              <Text style={styles.linkDescription}>
                나의 라이딩 기록을 확인하세요
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('Analysis')}>
            <View style={[styles.linkIcon, {backgroundColor: '#d1fae5'}]}>
              <Ionicons name="bar-chart-outline" size={24} color="#16a34a" />
            </View>
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>운전 분석</Text>
              <Text style={styles.linkDescription}>
                운전 습관과 안전 점수를 분석해요
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() =>
              Alert.alert('준비 중', '고객센터 기능은 준비 중입니다.')
            }>
            <View style={[styles.linkIcon, {backgroundColor: '#dbeafe'}]}>
              <Ionicons name="help-circle-outline" size={24} color="#2563eb" />
            </View>
            <View style={styles.linkContent}>
              <Text style={styles.linkTitle}>고객센터</Text>
              <Text style={styles.linkDescription}>문의사항이 있으신가요?</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  userCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  userGreeting: {
    fontSize: 14,
    color: '#d1fae5',
  },
  scoreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
  },
  scoreContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreLeft: {
    flex: 1,
  },
  // ★ [추가] 라벨과 배지를 감싸는 스타일
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  scoreLabel: {
    fontSize: 14,
    color: '#d1fae5',
    // marginBottom 제거 (labelRow에서 제어)
  },
  // ★ [추가] 할인 배지 스타일
  discountBadge: {
    backgroundColor: '#ffffff', // 흰색 배경
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ea580c', // 진한 주황/골드 텍스트
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  scoreMax: {
    fontSize: 18,
    color: '#d1fae5',
    marginBottom: 4,
  },
  scoreIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
  },
  scoreMessage: {
    fontSize: 12,
    color: '#d1fae5',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    paddingLeft: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrCard: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  mapCard: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  actionIconContainer: {
    marginRight: 16,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  linkIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  linkDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
  },
  qrPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeButton: {
    backgroundColor: '#2563eb',
    borderRadius: 8,
    height: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
