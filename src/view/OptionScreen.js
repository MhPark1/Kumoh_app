/**
 * 파일 경로: src/view/ProfileScreen.js
 */
import React, {useState, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors} from '../component/constants/colors'; // 기존 색상 상수
import {AuthContext} from '../context/AuthContext'; // 로그아웃 기능 연동

export default function ProfileScreen({navigation}) {
  const {logout} = useContext(AuthContext);
  const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);

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
          // AuthContext 내부 로직에 따라 로그인 화면으로 전환될 것입니다.
        },
      },
    ]);
  };

  // 공통 메뉴 아이템 컴포넌트
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 1. 프로필 카드 */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {/* 실제 이미지 URL이 있다면 source={{ uri: '...' }} 사용 */}
              <Image
                source={require('../asset/logo.png')} // 임시로 로고 혹은 기본 이미지 사용
                style={styles.avatar}
                resizeMode="cover"
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>김철수</Text>
              <Text style={styles.userEmail}>chulsoo@email.com</Text>
            </View>
            <TouchableOpacity>
              <Text style={styles.editButton}>편집</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {color: colors.blue600}]}>
                124회
              </Text>
              <Text style={styles.statLabel}>총 이용</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {color: colors.green600}]}>
                87.5km
              </Text>
              <Text style={styles.statLabel}>총 거리</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {color: colors.purple600}]}>
                18시간
              </Text>
              <Text style={styles.statLabel}>총 시간</Text>
            </View>
          </View>
        </View>

        {/* 2. 내 지갑 */}
        <View style={styles.card}>
          <View style={styles.walletRow}>
            <View style={styles.walletLeft}>
              <View style={styles.walletIconBg}>
                <Ionicons name="wallet" size={20} color={colors.blue600} />
              </View>
              <View>
                <Text style={styles.walletLabel}>내 지갑</Text>
                <Text style={styles.walletBalance}>₩5,000</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.chargeButton}>
              <Text style={styles.chargeButtonText}>충전</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. 결제 수단 */}
        <Text style={styles.sectionTitle}>결제 수단</Text>
        <View style={styles.card}>
          <MenuItem
            icon="card-outline"
            label="결제 카드 관리"
            onPress={() => {}}
          />
          <MenuItem
            icon="receipt-outline"
            label="충전 내역"
            onPress={() => {}}
            isLast
          />
        </View>

        {/* 4. 설정 */}
        <Text style={styles.sectionTitle}>설정</Text>
        <View style={styles.card}>
          <MenuItem
            icon="notifications-outline"
            label="알림 설정"
            onPress={null} // 스위치 클릭을 위해 null 처리하거나 별도 처리
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

        {/* 5. 지원 */}
        <Text style={styles.sectionTitle}>지원</Text>
        <View style={styles.card}>
          <MenuItem
            icon="help-circle-outline"
            label="도움말"
            onPress={() => navigation.navigate('Guide')} // GuideScreen으로 이동
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
    backgroundColor: '#f9fafb', // colors.gray50
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Card Styles
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16, // 내부 패딩
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
  userEmail: {
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
  // Wallet
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff', // blue50
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletLabel: {
    fontSize: 12,
    color: colors.gray500,
    marginBottom: 2,
  },
  walletBalance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  chargeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chargeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
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
    color: '#374151', // gray700
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
    borderColor: colors.red200, // red200
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
