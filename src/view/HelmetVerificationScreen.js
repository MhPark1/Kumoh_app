import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {Card} from '../component/Card';
import {Button} from '../component/Button';
import {colors} from '../component/constants/colors';

export default function HelmetVerificationScreen({route, navigation}) {
  // MapScreen에서 넘겨준 킥보드 정보
  const {scooter} = route.params || {};

  // 상태 관리
  const [photoTaken, setPhotoTaken] = useState(false);
  const [agreedToSafety, setAgreedToSafety] = useState(false);

  // CameraScreen에서 인증 완료 후 되돌아왔을 때 처리
  useEffect(() => {
    if (route.params?.verificationSuccess) {
      setPhotoTaken(true);
    }
  }, [route.params?.verificationSuccess]);

  // 사진 촬영 버튼 클릭 시 -> 카메라 화면으로 이동
  const handleTakePhoto = () => {
    navigation.navigate('Camera', {returnScreen: 'HelmetVerification'});
  };

  // 최종 라이딩 시작 버튼 클릭
  const handleConfirm = () => {
    if (photoTaken && agreedToSafety) {
      // Gps 화면(주행 시작)으로 이동하면서 킥보드 정보 전달
      navigation.navigate('Gps', {scooterId: scooter?.id});
    } else {
      Alert.alert('알림', '모든 단계를 완료해주세요.');
    }
  };

  const canProceed = photoTaken && agreedToSafety;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* 헤더 (그라데이션) */}
      <LinearGradient colors={['#16a34a', '#059669']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>헬멧 착용 인증</Text>
            <Text style={styles.headerSubtitle}>
              안전한 라이딩을 위해 헬멧 착용을 확인해주세요
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        {/* 1. 킥보드 정보 카드 */}
        <Card
          style={[
            styles.scooterCard,
            {
              backgroundColor: '#eff6ff',
              borderColor: '#bfdbfe',
              borderWidth: 1,
            },
          ]}>
          <View style={styles.scooterInfo}>
            <View style={styles.scooterIcon}>
              <Ionicons name="shield-checkmark" size={24} color="#ffffff" />
            </View>
            <View>
              <Text style={styles.scooterNumber}>
                킥보드 #{scooter?.number || '0000'}
              </Text>
              <Text style={styles.scooterDetails}>
                배터리 {scooter?.battery || 100}% • {scooter?.distance || 0}km
                거리
              </Text>
            </View>
          </View>
        </Card>

        {/* 2. 헬멧 사진 촬영 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 헬멧 착용 사진 촬영</Text>

          {!photoTaken ? (
            // 촬영 전 상태
            <Card style={styles.cameraCard}>
              <View style={styles.cameraPlaceholder}>
                <Ionicons name="camera" size={64} color={colors.gray400} />
                <Text style={styles.cameraText}>
                  헬멧을 착용한 모습을 촬영해주세요
                </Text>
              </View>
              <Button
                title="사진 촬영하기"
                onPress={handleTakePhoto}
                style={{backgroundColor: colors.blue600}}
              />
            </Card>
          ) : (
            // 촬영 완료 상태
            <Card style={styles.photoTakenCard}>
              <View style={styles.photoTakenHeader}>
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color={colors.green600}
                />
                <View style={{flex: 1, marginLeft: 10}}>
                  <Text style={styles.photoTakenTitle}>사진 촬영 완료</Text>
                  <Text style={styles.photoTakenText}>
                    헬멧 착용이 확인되었습니다
                  </Text>
                </View>
              </View>
              <View style={styles.photoPreview}>
                <Ionicons
                  name="shield-checkmark"
                  size={48}
                  color={colors.green600}
                />
                <Text style={styles.photoPreviewText}>인증 완료</Text>
              </View>
              <Button
                title="다시 촬영하기"
                onPress={handleTakePhoto}
                variant="outline"
                style={{marginTop: 10, borderColor: colors.gray300}}
                textStyle={{color: colors.gray600}}
              />
            </Card>
          )}
        </View>

        {/* 3. 안전 수칙 확인 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 안전 수칙 확인</Text>

          <Card>
            <View style={styles.safetyRules}>
              <SafetyRuleItem text="자전거 도로를 이용하고 인도 주행을 피해주세요" />
              <SafetyRuleItem text="제한 속도를 준수하고 안전 운전을 실천해주세요" />
              <SafetyRuleItem text="주차 구역에 올바르게 반납해주세요" />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.agreementRow}
              onPress={() => setAgreedToSafety(!agreedToSafety)}>
              <Ionicons
                name={agreedToSafety ? 'checkbox' : 'square-outline'}
                size={24}
                color={colors.green600}
              />
              <Text style={styles.agreementText}>
                안전 수칙을 확인했으며, 헬멧을 착용한 상태로 안전 운전을
                실천하겠습니다.
              </Text>
            </TouchableOpacity>
          </Card>
        </View>
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View style={styles.bottomAction}>
        <Button
          title={canProceed ? '라이딩 시작하기' : '모든 단계를 완료해주세요'}
          onPress={handleConfirm}
          disabled={!canProceed}
          style={
            !canProceed
              ? {backgroundColor: colors.gray300}
              : {backgroundColor: colors.green600}
          }
        />
      </View>
    </SafeAreaView>
  );
}

// 안전 수칙 아이템 컴포넌트
const SafetyRuleItem = ({text}) => (
  <View style={styles.safetyRule}>
    <Ionicons name="information-circle" size={20} color={colors.blue600} />
    <Text style={styles.safetyRuleText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#fff'},
  header: {paddingHorizontal: 16, paddingVertical: 16},
  headerContent: {flexDirection: 'row', alignItems: 'center', gap: 12},
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {flex: 1, marginLeft: 10},
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {fontSize: 14, color: '#dcfce7'},

  scrollView: {flex: 1},
  scrollContent: {padding: 16, paddingBottom: 32},

  scooterCard: {marginBottom: 24, padding: 16},
  scooterInfo: {flexDirection: 'row', alignItems: 'center', gap: 12},
  scooterIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  scooterNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  scooterDetails: {fontSize: 14, color: colors.gray600},

  section: {marginBottom: 24},
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },

  cameraCard: {
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.gray50,
    gap: 16,
    padding: 20,
  },
  cameraPlaceholder: {
    aspectRatio: 1,
    backgroundColor: colors.gray200,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 16,
  },
  cameraText: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  photoTakenCard: {
    backgroundColor: colors.green50,
    borderColor: colors.green200,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  photoTakenHeader: {flexDirection: 'row', alignItems: 'center'},
  photoTakenTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.green900,
    marginBottom: 2,
  },
  photoTakenText: {fontSize: 14, color: colors.green700},
  photoPreview: {
    aspectRatio: 16 / 9,
    backgroundColor: colors.gray200,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 10,
  },
  photoPreviewText: {fontSize: 14, color: colors.gray600},

  safetyRules: {gap: 12, marginBottom: 16},
  safetyRule: {flexDirection: 'row', gap: 12, alignItems: 'flex-start'},
  safetyRuleText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray700,
    lineHeight: 20,
    marginLeft: 8,
  },
  divider: {height: 1, backgroundColor: colors.border, marginVertical: 16},

  agreementRow: {flexDirection: 'row', gap: 12, alignItems: 'flex-start'},
  agreementText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginLeft: 8,
  },

  bottomAction: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
