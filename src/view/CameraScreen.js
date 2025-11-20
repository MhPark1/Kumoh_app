import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  Linking,
  Platform,
} from 'react-native';
import {Camera, useCameraDevice} from 'react-native-vision-camera';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Api from '../api/ApiUtils'; // API 유틸 (실제 연동 시 사용)
import Icon from 'react-native-vector-icons/Ionicons';
import ImageResizer from '@bam.tech/react-native-image-resizer';

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isDeviceReady, setIsDeviceReady] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [cameraPosition, setCameraPosition] = useState('front');
  const [isCameraActive, setIsCameraActive] = useState(false);

  const camera = useRef(null);
  const device = useCameraDevice(cameraPosition);
  const navigation = useNavigation();

  // 카메라 권한 확인
  useEffect(() => {
    const requestCameraPermission = async () => {
      const permission = await Camera.getCameraPermissionStatus();
      if (permission !== 'granted') {
        const newPermission = await Camera.requestCameraPermission();
        if (newPermission === 'granted') {
          setHasPermission(true);
          setIsDeviceReady(true);
        } else {
          setHasPermission(false);
          Alert.alert('카메라 권한 필요', '카메라 권한이 필요합니다.', [
            {text: '설정으로 이동', onPress: () => Linking.openSettings()},
            {text: '취소', style: 'cancel'},
          ]);
        }
      } else {
        setHasPermission(true);
        setIsDeviceReady(true);
      }
    };

    requestCameraPermission();
  }, []);

  // // 탭바 숨김 처리
  // useEffect(() => {
  //   navigation.getParent()?.setOptions({tabBarStyle: {display: 'none'}});

  //   return () => {
  //     setTimeout(() => {
  //       navigation.getParent()?.setOptions({tabBarStyle: {display: 'flex'}});
  //     }, 50);
  //   };
  // }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      // 화면 진입 시
      setIsCameraActive(true);
      return () => {
        // 화면을 벗어나기 전 처리
        setIsCameraActive(false);
        setTimeout(() => {
          if (camera.current) {
            camera.current = null;
          }
        }, 50);
      };
    }, []),
  );

  // 📌 뒤로 가기 시 카메라 정리
  const cleanupCamera = async () => {
    if (camera.current) {
      try {
        await camera.current.stopRecording();
      } catch (error) {
        console.log('카메라 정리 중 오류:', error);
      }
    }
  };

  useEffect(() => {
    return () => {
      cleanupCamera();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setIsDeviceReady(false);
      const timer = setTimeout(() => {
        setIsDeviceReady(true);
      }, 50);

      return () => {
        clearTimeout(timer);
      };
    }, []),
  );

  // [수정됨] 사진 촬영 및 서버 인증 로직
  const handleCapture = async () => {
    console.log('📸 촬영 버튼 눌림!');

    if (camera.current) {
      try {
        // 1. 촬영 (기존 코드)
        const photo = await camera.current.takePhoto({
          flash: 'off',
          qualityPrioritization: 'speed',
        });

        console.log('📸 원본 사진 크기:', photo.width, 'x', photo.height);

        // 2. [추가] 이미지 리사이징 (압축)
        // AI 모델(YOLO)은 보통 640x640이면 충분합니다.
        const resizedImage = await ImageResizer.createResizedImage(
          Platform.OS === 'android' ? 'file://' + photo.path : photo.path,
          800, // 너비 (800px 정도면 AI 인식에 충분하고 용량은 100KB 미만)
          800, // 높이
          'JPEG', // 포맷
          80, // 퀄리티 (0~100)
          0, // 회전
          null, // 출력 경로 (null이면 임시 폴더)
        );

        console.log('📦 압축된 사진 경로:', resizedImage.uri);
        console.log('📦 압축된 사진 용량:', resizedImage.size); // 용량 확인해보세요!

        // 3. 압축된 이미지를 전송
        const formData = new FormData();
        formData.append('image', {
          uri: resizedImage.uri, // 원본 대신 리사이징된 uri 사용
          type: 'image/jpeg',
          name: 'helmet.jpg',
        });
        console.log('📦 FormData 생성 완료');

        // API 호출 로그
        console.log('📡 API 호출 시도 중...');
        const response = await Api.verifyHelmet(formData, navigation);
        console.log('✅ API 호출 완료! 결과:', response); // 여기가 찍혀야 함

        const resultData = response?.data || {};
        const isVerified = resultData.verified === true;

        if (isVerified) {
          Alert.alert('인증 성공', '헬멧 착용이 확인되었습니다.');
          navigation.navigate({
            name: 'HelmetVerification',
            params: {verificationSuccess: true, isHelmetConfirmed: true},
            merge: true,
          });
        } else {
          Alert.alert(
            '헬멧 미감지',
            '헬멧을 찾을 수 없습니다.\n다시 촬영하시겠습니까? 아니면 감점을 감수하고 진행하시겠습니까?',
            [
              {
                text: '다시 촬영',
                style: 'cancel', // 아무것도 안 하고 알림창 닫기 (카메라 화면 유지)
              },
              {
                text: '그냥 진행 (감점)',
                style: 'destructive', // 빨간색 버튼 (위험 표시)
                onPress: () => {
                  // 실패했지만 절차는 완료했으므로 verificationSuccess: true
                  // 하지만 헬멧은 안 썼으므로 isHelmetConfirmed: false
                  navigation.navigate({
                    name: 'HelmetVerification',
                    params: {
                      verificationSuccess: true,
                      isHelmetConfirmed: false,
                    },
                    merge: true,
                  });
                },
              },
            ],
          );
        }
      } catch (error) {
        console.error('❌ 전체 프로세스 에러:', error); // 에러 발생 시 여기 확인
        Alert.alert(
          '오류',
          '서버 통신 중 오류가 발생했습니다: ' +
            (error.message || '알 수 없음'),
        );
      }
    }
  };

  const toggleCamera = () => {
    setIsDeviceReady(false);
    setCameraPosition(prev => (prev === 'back' ? 'front' : 'back'));
    setTimeout(() => {
      setIsDeviceReady(true);
    }, 50);
  };

  if (hasPermission === null) {
    return (
      <View style={styles.permissionContainer}>
        <Text>권한을 확인 중입니다...</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <Text>카메라 권한이 필요합니다. 설정에서 권한을 허용해 주세요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {isDeviceReady && device ? (
        <Camera
          // key 속성 삭제 (또는 필요한 경우 key={device.id} 로 설정)
          ref={camera}
          style={styles.camera}
          device={device}
          isActive={isCameraActive}
          photo={true}
        />
      ) : (
        <View style={styles.buttonContainer}>
          <Text>카메라 장치를 찾을 수 없습니다.</Text>
        </View>
      )}

      {/* 헤더 */}
      <View style={styles.header}>
        {/* X 버튼 */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}>
          <Icon name="close" size={30} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerText}>
          {'헬멧 착용한 모습을\n촬영해주세요.'}
        </Text>
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={styles.infoButton}>
          <Text style={styles.infoButtonText}>i</Text>
        </TouchableOpacity>
      </View>

      {/* 가이드 프레임 */}
      <View style={styles.guideFrame}>
        <View style={styles.cornerTopLeft} />
        <View style={styles.cornerTopRight} />
        <View style={styles.cornerBottomLeft} />
        <View style={styles.cornerBottomRight} />
      </View>

      {/* 안내 텍스트 */}
      <View style={styles.bottomTextContainer}>
        <Text style={styles.bottomText}>
          표시선 안에 헬멧과 얼굴이 들어오도록 해주세요.
        </Text>
      </View>

      {/* 촬영 및 카메라 전환 버튼 */}
      <View style={styles.bottomButtonsContainer}>
        <View style={{flex: 1}} />
        <TouchableOpacity onPress={handleCapture} style={styles.captureButton}>
          <View style={styles.captureInnerButton} />
        </TouchableOpacity>
        <View style={{flex: 1, alignItems: 'flex-end', paddingRight: 20}}>
          <TouchableOpacity
            onPress={toggleCamera}
            style={styles.toggleCameraButton}>
            <Text style={styles.toggleCameraText}>↺</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 모달 창 */}
      <Modal visible={modalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>킥보드 헬멧의 올바른 착용법</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalText}>
              <Text style={[styles.boldText, styles.sectionTitle]}>
                1. 이마를 보호하는 위치
              </Text>
              {'\n'}&nbsp;헬멧의 앞부분이 이마 중앙까지 내려와야 합니다.
              {'\n'}&nbsp;눈썹 위 약 2cm 정도의 위치가 적절합니다.
            </Text>
            <Text style={styles.spacer} />

            <Text style={styles.modalText}>
              <Text style={[styles.boldText, styles.sectionTitle]}>
                2. 턱끈(스트랩) 조절
              </Text>
              {'\n'}&nbsp;스트랩을 조여 손가락 하나 정도 들어갈 정도로 고정해야
              합니다.
              {'\n'}&nbsp;‘Y’자 모양 스트랩이 귀 아래쪽에서 균형을 맞추도록
              합니다.
            </Text>
            <Text style={styles.spacer} />

            <Text style={styles.modalText}>
              <Text style={[styles.boldText, styles.sectionTitle]}>
                3. 헬멧의 흔들림 체크
              </Text>
              {'\n'}&nbsp;헬멧을 손으로 움직였을 때, 쉽게 흔들리지 않아야
              합니다.
              {'\n'}&nbsp;고개를 흔들어도 헬멧이 움직이지 않으면 올바르게 착용한
              것입니다.
            </Text>
            <Text style={styles.spacer} />

            <Text style={styles.modalText}>
              <Text style={[styles.boldText, styles.sectionTitle]}>
                4. 착용 전 최종 점검
              </Text>
              {'\n'}&nbsp;헬멧이 수평으로 잘 맞춰졌는지 확인합니다.
              {'\n'}&nbsp;턱끈이 풀리지 않도록 한 번 더 점검합니다.
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  header: {
    position: 'absolute',
    top: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '90%',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  infoButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007BFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButtonText: {color: 'white', fontWeight: 'bold', fontSize: 16},
  camera: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: -2,
  },

  guideFrame: {
    position: 'absolute',
    top: '15%',
    width: '60%',
    height: '30%',
    borderColor: 'transparent',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 50,
    height: 50,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FF6A33',
  },
  cornerTopRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 50,
    height: 50,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FF6A33',
  },
  cornerBottomLeft: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 50,
    height: 50,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FF6A33',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 50,
    height: 50,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FF6A33',
  },

  buttonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    top: '17%',
  },

  bottomTextContainer: {
    position: 'absolute',
    bottom: 120,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 8,
  },
  bottomText: {color: 'white', fontSize: 16, textAlign: 'center'},

  bottomButtonsContainer: {
    position: 'absolute',
    bottom: 40,
    width: '95%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInnerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF6A33',
  },
  toggleCameraButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(128,128,128,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  toggleCameraText: {
    color: 'white',
    fontSize: 20,
  },

  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  modalText: {
    fontSize: 14,
    lineHeight: 18,
  },
  boldText: {
    fontWeight: 'bold',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FF6347',
    flex: 1,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {fontSize: 20, fontWeight: 'bold'},
});

export default CameraScreen;
