import React, {useContext, useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  Alert,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
// [수정] ../../ (두 단계 상위)에서 ../ (한 단계 상위)로 경로를 수정합니다.
import {AuthContext} from '../context/AuthContext';

const {width, height} = Dimensions.get('window');

// [수정] 컴포넌트 이름을 파일 이름과 동일하게 'QRScannerScreen'으로 변경
const QRScannerScreen = ({navigation, route}) => {
  const {userId} = useContext(AuthContext) || {};

  const device = useCameraDevice('back');
  const camera = useRef(null);

  const [isCameraActive, setIsCameraActive] = useState(true);
  const [isScanning, setIsScanning] = useState(false);

  // -----------------------------
  // QR 스캔 처리 함수
  // -----------------------------
  const handleCodeScanned = async codes => {
    if (!codes || codes.length === 0) return;

    const rawValue = codes[0]?.value;
    if (!rawValue) return;

    if (isScanning) return;
    setIsScanning(true);

    try {
      const kickboardId = rawValue;

      Alert.alert(
        '스캔 성공',
        `킥보드 ID: ${kickboardId}\n운행을 시작하시겠습니까?`,
        [
          {
            text: '취소',
            style: 'cancel',
            onPress: () => {
              setTimeout(() => setIsScanning(false), 500);
            },
          },
          {
            text: '확인',
            onPress: () => {
              setIsCameraActive(false);
              // [수정] 스캔 성공 시 'HelmetVerification' (헬멧 인증) 화면으로 이동
              navigation.navigate('HelmetVerification', {
                kickboardId: kickboardId,
                userId: userId,
              });

              setTimeout(() => setIsScanning(false), 500);
            },
          },
        ],
        {cancelable: false},
      );
    } catch (err) {
      Alert.alert('오류', 'QR 코드 형식이 올바르지 않습니다.');
      setTimeout(() => setIsScanning(false), 500);
    }
  };

  // -----------------------------
  // VisionCamera 최신 스캔 훅
  // -----------------------------
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: codes => {
      if (!isScanning) {
        handleCodeScanned(codes);
      }
    },
  });

  // -----------------------------
  // 화면 포커스 상태에 따라 카메라 on/off
  // -----------------------------
  useFocusEffect(
    React.useCallback(() => {
      setIsCameraActive(true);
      return () => setIsCameraActive(false);
    }, []),
  );

  // -----------------------------
  // 권한 요청
  // -----------------------------
  useEffect(() => {
    (async () => {
      const permission = await Camera.requestCameraPermission();
      if (permission !== 'granted') {
        Alert.alert('오류', '카메라 권한이 필요합니다.');
        navigation.goBack();
      }
    })();
  }, [navigation]);

  // [추가] 임시 버튼 클릭 핸들러
  const handleTempButtonPress = () => {
    setIsCameraActive(false);
    // [수정] 헬멧 인증 화면으로 임시 ID와 함께 이동
    navigation.navigate('HelmetVerification', {
      kickboardId: 'temp-kickboard-123', // 임시 킥보드 ID
      userId: userId,
    });
  };

  if (!device) {
    return (
      <View style={styles.centered}>
        <Text>카메라를 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* X 버튼 */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => navigation.goBack()}>
        <Icon name="close" size={30} color="#fff" />
      </TouchableOpacity>

      {/* 카메라 */}
      <Camera
        ref={camera}
        style={styles.camera}
        device={device}
        isActive={isCameraActive}
        codeScanner={codeScanner}
      />

      {/* 스캔 가이드 박스 */}
      <View style={styles.overlay}>
        <View style={styles.box} />
      </View>

      <Text style={styles.scanText}>킥보드 QR 코드를 스캔하세요</Text>

      {/* 하단 안내창 */}
      <View style={styles.bottomPanel}>
        <Text style={styles.bottomText}>자동으로 QR을 인식합니다.</Text>

        {/* [추가] 임시 이동 버튼 */}
        <TouchableOpacity
          style={styles.tempButton}
          onPress={handleTempButtonPress}>
          <Text style={styles.tempButtonText}>(임시) 스캔 완료했다고 가정</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default QRScannerScreen; // [수정] export 이름 변경

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  closeButton: {
    position: 'absolute',
    zIndex: 10,
    top: Platform.OS === 'ios' ? 60 : 30,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    width: width * 0.7,
    height: width * 0.7,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 15,
  },
  scanText: {
    position: 'absolute',
    top: height * 0.25,
    width: '100%',
    textAlign: 'center',
    fontSize: 18,
    color: '#fff',
    fontWeight: '600',
  },
  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    // [수정] 임시 버튼을 포함하기 위해 높이 및 패딩 조절
    height: height * 0.22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingVertical: 20, // [수정] 상하 패딩
  },
  bottomText: {
    fontSize: 16,
    color: '#ccc',
  },
  // [추가] 임시 버튼 스타일
  tempButton: {
    marginTop: 15,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  tempButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
