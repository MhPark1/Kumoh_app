import React, {useState, useContext, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {useFocusEffect} from '@react-navigation/native';
import {colors} from '../component/constants/colors';
import {AuthContext} from '../context/AuthContext';
import Api from '../api/ApiUtils';

export default function OptionScreen({navigation}) {
  const {logout} = useContext(AuthContext);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // 사용자 정보 상태 (payment 제거됨)
  const [userInfo, setUserInfo] = useState({
    nickname: '사용자',
    telno: '',
    total_rides: 0,
    total_distance: 0,
    total_duration: 0,
  });

  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await Api.getUserProfile(navigation);
      if (response && response.success) {
        setUserInfo(response.data);
      }
    } catch (error) {
      console.error('프로필 로딩 실패:', error);
    }
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [fetchUserProfile]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserProfile();
    setRefreshing(false);
  };

  const toggleSwitch = () =>
    setIsNotificationEnabled(previousState => !previousState);

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      {text: '취소', style: 'cancel'},
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const MenuItem = ({
    icon,
    label,
    onPress,
    isLast,
    showChevron = true,
    rightElement,
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, !isLast && styles.menuItemBorder]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={!onPress}>
      <View style={styles.menuItemLeft}>
        <Ionicons name={icon} size={20} color={colors.gray600} />
        <Text style={styles.menuItemLabel}>{label}</Text>
      </View>
      {rightElement
        ? rightElement
        : showChevron && (
            <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
          )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 정보</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        {/* 1. 프로필 카드 */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image
                source={require('../asset/logo.png')}
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>
                {userInfo.nickname || '알 수 없음'}
              </Text>
              {userInfo.telno ? (
                <Text style={styles.userPhone}>{userInfo.telno}</Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('UserEdit')}>
              <Text style={styles.editButton}>편집</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {color: colors.blue600}]}>
                {userInfo.total_rides}회
              </Text>
              <Text style={styles.statLabel}>총 이용</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {color: colors.green600}]}>
                {userInfo.total_distance}km
              </Text>
              <Text style={styles.statLabel}>총 거리</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {color: colors.purple600}]}>
                {Math.floor(userInfo.total_duration / 60) > 0
                  ? `${Math.floor(userInfo.total_duration / 60)}시간 `
                  : ''}
                {userInfo.total_duration % 60}분
              </Text>
              <Text style={styles.statLabel}>총 시간</Text>
            </View>
          </View>
        </View>

        {/* 2. 결제 수단 (내 지갑 카드 삭제됨) */}
        <Text style={styles.sectionTitle}>결제 수단</Text>
        <View style={styles.card}>
          <MenuItem
            icon="card-outline"
            label="결제 카드 관리"
            onPress={() => Alert.alert('준비 중', '기능 준비 중입니다.')}
          />
          <MenuItem
            icon="time-outline" //receipt-outline
            label="이용 내역"
            onPress={() =>
              navigation.navigate('HistoryTab', {
                screen: 'History',
              })
            }
            isLast
          />
        </View>

        {/* 3. 설정 */}
        <Text style={styles.sectionTitle}>설정</Text>
        <View style={styles.card}>
          <MenuItem
            icon="notifications-outline"
            label="알림 설정"
            onPress={null}
            rightElement={
              <Switch
                trackColor={{false: colors.gray300, true: colors.green600}}
                thumbColor={colors.white}
                ios_backgroundColor={colors.gray300}
                onValueChange={toggleSwitch}
                value={isNotificationEnabled}
              />
            }
          />
          <MenuItem
            icon="shield-checkmark-outline"
            label="개인정보 보호"
            onPress={() => {}}
            isLast
          />
        </View>

        {/* 4. 지원 */}
        <Text style={styles.sectionTitle}>지원</Text>
        <View style={styles.card}>
          <MenuItem
            icon="help-circle-outline"
            label="도움말"
            onPress={() => navigation.navigate('Guide')}
          />
          <MenuItem
            icon="document-text-outline"
            label="이용약관"
            onPress={() => {}}
          />
          <MenuItem
            icon="lock-closed-outline"
            label="개인정보 처리방침"
            onPress={() => {}}
            isLast
          />
        </View>

        {/* 로그아웃 버튼 */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.red600} />
          <Text style={styles.logoutText}>로그아웃</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>버전 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
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
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Card Styles
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: colors.gray200,
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 14,
    color: colors.gray500,
  },
  editButton: {
    fontSize: 14,
    color: colors.blue600,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 16,
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray500,
  },
  // Section Titles
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    marginLeft: 4,
  },
  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemLabel: {
    fontSize: 16,
    color: '#374151',
  },
  // Logout & Version
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.red200,
    marginBottom: 24,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.red600,
  },
  versionText: {
    textAlign: 'center',
    color: colors.gray400,
    fontSize: 12,
  },
});
