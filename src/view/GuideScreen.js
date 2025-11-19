import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../component/constants/colors';

const GuideScreen = () => {
  const navigation = useNavigation(); // 네비게이션 훅 사용

  const goBack = () => {
    setTimeout(() => {
      navigation.goBack();
    }, 50);
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
          <Text style={styles.headerTitle}>주행 가이드</Text>
          <View style={{width: 40}} />
        </View>
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>주행 전 체크리스트</Text>
          <Text style={styles.item}>
            ✅ 킥보드의 <Text style={styles.highlight}>배터리 잔량</Text> 확인
          </Text>
          <Text style={styles.item}>
            ✅ <Text style={styles.highlight}>브레이크, 핸들, 타이어</Text> 상태
            점검
          </Text>
          <Text style={styles.item}>
            ✅ <Text style={styles.highlight}>헬멧 착용</Text> (필수)
          </Text>
          <Text style={styles.item}>
            ✅ 야간 주행 시 <Text style={styles.highlight}>전조등 점등</Text>{' '}
            확인
          </Text>
          <Text style={styles.item}>
            ✅ 주변 환경 및 <Text style={styles.highlight}>날씨 확인</Text> (비
            오는 날 주행 금지)
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>안전한 주행 방법</Text>
          <Text style={styles.subTitle}>🚦 도로에서의 기본 규칙 준수</Text>
          <Text style={styles.item}>
            • 인도 주행 금지, 자전거 도로 우선 이용
          </Text>
          <Text style={styles.item}>
            • 차도 주행 시 <Text style={styles.highlight}>우측 통행</Text>
          </Text>
          <Text style={styles.item}>
            • 교차로 및 횡단보도에서는{' '}
            <Text style={styles.highlight}>내려서 이동</Text>
          </Text>

          <Text style={styles.subTitle}>⚠️ 위험 주행 금지</Text>
          <Text style={styles.item}>• 한 손 운전 ❌ (양손으로 핸들 잡기)</Text>
          <Text style={styles.item}>• 2인 이상 동승 ❌</Text>
          <Text style={styles.item}>• 급가속, 급감속, 급회전 ❌</Text>

          <Text style={styles.subTitle}>📵 운전 중 스마트폰 사용 금지</Text>
          <Text style={styles.item}>
            • 길을 확인해야 할 경우{' '}
            <Text style={styles.highlight}>안전한 곳에 정차 후 확인</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  title: {fontSize: 22, fontWeight: 'bold', color: '#ff6a33', marginBottom: 20},
  section: {
    backgroundColor: '#dcfce7',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6a33',
    marginBottom: 10,
  },
  subTitle: {fontSize: 16, fontWeight: 'bold', color: '#ff6a33', marginTop: 10},
  item: {fontSize: 16, color: '#333', marginTop: 5},
  highlight: {fontWeight: 'bold', color: '#ff6a33'},
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
});

export default GuideScreen;
