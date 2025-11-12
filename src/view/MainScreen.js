/**
 * 파일 경로: src/view/HomeScreen.js
 */
import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {SafeAreaView} from 'react-native-safe-area-context';
import {colors} from '../component/constants/colors'; // 기존 색상 파일 활용

export default function HomeScreen({navigation}) {
  const [showQRScanner, setShowQRScanner] = useState(false);
  const safetyScore = 92;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {/* User Info Card (Gradient) */}
        <LinearGradient
          colors={['#16a34a', '#059669']} // colors.green600, emerald700
          style={styles.userCard}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}>
          <View style={styles.userHeader}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={32} color="#16a34a" />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>김철수님</Text>
              <Text style={styles.userGreeting}>안전한 하루 되세요!</Text>
            </View>
          </View>

          <View style={styles.scoreCard}>
            <View style={styles.scoreContent}>
              <View style={styles.scoreLeft}>
                <Text style={styles.scoreLabel}>안전운전점수</Text>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreValue}>{safetyScore}</Text>
                  <Text style={styles.scoreMax}> / 100</Text>
                </View>
              </View>
              <View style={styles.scoreIcon}>
                <Ionicons name="shield-checkmark" size={28} color="#ffffff" />
              </View>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, {width: `${safetyScore}%`}]} />
            </View>
            <Text style={styles.scoreMessage}>
              우수한 운전 습관을 유지하고 계세요! 👍
            </Text>
          </View>
        </LinearGradient>

        {/* 빠른 시작 (Quick Start) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>빠른 시작</Text>

          <TouchableOpacity
            style={[styles.actionCard, styles.qrCard]}
            onPress={() => setShowQRScanner(true)}>
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
            onPress={() => navigation.navigate('Map')} // MapScreen으로 이동
          >
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

        {/* 더 알아보기 (Quick Links) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>더 알아보기</Text>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('History')} // HistoryScreen으로 이동
          >
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
            onPress={() => navigation.navigate('Analysis')} // AnalysisScreen으로 이동
          >
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
            onPress={() => navigation.navigate('CustomerService')} // 고객센터 화면 필요시 추가
          >
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

      {/* QR Scanner Modal */}
      <Modal
        visible={showQRScanner}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQRScanner(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>QR 코드 스캔</Text>
            <Text style={styles.modalDescription}>
              킥보드의 QR 코드를 스캔해주세요
            </Text>

            <View style={styles.qrPlaceholder}>
              <Ionicons name="qr-code-outline" size={96} color="#9ca3af" />
            </View>

            <Text style={styles.qrInfo}>
              QR 코드 인식 시 헬멧 착용 인증 단계로 이동합니다
            </Text>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowQRScanner(false)}>
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb', // colors.gray50
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  // User Card Styles
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
    color: '#d1fae5', // colors.green100
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
  scoreLabel: {
    fontSize: 14,
    color: '#d1fae5',
    marginBottom: 4,
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
  // Section Styles
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827', // colors.text
    marginBottom: 12,
    paddingLeft: 4,
  },
  // Action Card Styles
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 12,
    borderWidth: 2,
    // Shadow
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  qrCard: {
    borderColor: '#2563eb', // colors.blue600
    backgroundColor: '#eff6ff', // colors.blue50
  },
  mapCard: {
    borderColor: '#16a34a', // colors.green600
    backgroundColor: '#f0fdf4', // colors.green50
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
    color: '#6b7280', // colors.gray600
  },
  // Link Card Styles
  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 8,
    // Shadow
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
  // Modal Styles
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
  qrInfo: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
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
