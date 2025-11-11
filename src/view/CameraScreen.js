import React, { useEffect, useState, useRef } from 'react';
import { View, Button, Text, TouchableOpacity, StyleSheet, Alert, Modal, Linking } from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Api from '../api/ApiUtils'

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
                        { text: '설정으로 이동', onPress: () => Linking.openSettings() },
                        { text: '취소', style: 'cancel' },
                    ]);
                }
            } else {
                setHasPermission(true);
                setIsDeviceReady(true);
            }
        };

        requestCameraPermission();
    }, []);

    useEffect(() => {
        navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });

        return () => {
            setTimeout(() => {
                navigation.getParent()?.setOptions({ tabBarStyle: { display: 'flex' } });
            }, 50);
        };
    }, [navigation]);

    useEffect(() => {
        console.log('현재 카메라 장치:', device);
    }, [device]);

    useFocusEffect(
        React.useCallback(() => {
            // 화면 진입 시
            setIsCameraActive(true);
            return () => {
                // 화면을 벗어나기 전 isActive를 false로 설정하고 딜레이 후 cleanup 실행
                setIsCameraActive(false);
                setTimeout(() => {
                    // 필요하다면 추가 cleanup 작업 수행
                    if (camera.current) {
                        camera.current = null;
                    }
                }, 50); // 500ms 정도의 딜레이
            };
        }, [])
    );

    // 📌 뒤로 가기 시 카메라 정리
    const cleanupCamera = async () => {
        if (camera.current) {
            try {
                await camera.current.stopRecording(); // 비디오 촬영 중이면 정지
            } catch (error) {
                console.log('카메라 정리 중 오류:', error);
            }
        }
    };

    useEffect(() => {
        return () => {
            cleanupCamera(); // 페이지 벗어날 때 카메라 세션 정리
        };
    }, []);

    // 📌 페이지 다시 진입 시 카메라 재설정
    useEffect(() => {
        if (navigation.isFocused()) {
            setIsDeviceReady(false);
            setTimeout(() => {
                setIsDeviceReady(true);
            }, 50); // 0.5초 후에 카메라 재시작
        }
    }, [navigation.isFocused()]);

    const handleCapture = async () => {
        if (camera.current) {
            try {
                const photo = await camera.current.takePhoto({
                    flash: 'off',
                    qualityPrioritization: 'speed',
                });

                const uri = photo.path;
                // 헬멧 썼ㄴ느지 아닌지 API 호출
                //const response = await Api.uploadPhoto(uri);

                // 임의의 응답 데이터, 0이면 실패, 2이면 사람 없음, 1이면 통과였음
                const response = {
                    class_id: 0
                }

                // 응답 상태 코드에 따른 처리
                if (response.class_id !== 1) {
                    let alertMessage = '';
                    let alertTitle = '분석 실패';

                    // 클래스 ID에 따른 메시지 설정
                    switch (response.class_id) {
                        case 0:
                            alertMessage = '헬멧을 찾을 수 없습니다. 사진을 다시 찍으시겠습니까? 아니면 감점을 받고 넘어가시겠습니까?';
                            break;
                        case 2:
                            alertMessage = '사용자를 찾을 수 없습니다. 사진을 다시 찍으시겠습니까? 아니면 감점을 받고 넘어가시겠습니까?';
                            break;
                        default:
                            alertMessage = '사진 분석에 실패했습니다. 사진을 다시 찍으시겠습니까? 아니면 감점을 받고 넘어가시겠습니까?';
                    }

                    Alert.alert(
                        alertTitle,
                        alertMessage,
                        [
                            {
                                text: '사진 다시 찍기',
                                onPress: () => { } // 사진을 다시 찍는 함수 호출
                            },
                            {
                                text: '다음으로 넘어가기',
                                onPress: async () => { // onPress 핸들러를 async로 정의
                                    try {
                                        await AsyncStorage.setItem('safty_helmet_on', JSON.stringify(false));
                                        // 점수 감점 처리 로직 (필요시 추가)
                                        navigation.navigate('Gps'); // 다음 스텝으로 이동
                                    } catch (error) {
                                        console.error('AsyncStorage error:', error);
                                    }
                                },
                                style: 'destructive'
                            }
                        ]
                    );
                } else {
                    try {
                        await AsyncStorage.setItem('safty_helmet_on', JSON.stringify(true));
                        // 응답 상태 코드가 1일 경우 다음 페이지로 이동
                        navigation.navigate('Gps');
                    } catch (error) {
                        console.error('AsyncStorage error:', error);
                    }
                }
            } catch (error) {
                console.error('Photo capture error:', error.message);
                Alert.alert('오류', '사진 캡처 중 오류가 발생했습니다.');
            }
        }
    };

    const toggleCamera = () => {
        setIsDeviceReady(false); // 먼저 false로 설정하여 리셋
        setCameraPosition(prev => (prev === 'back' ? 'front' : 'back'));
        setTimeout(() => {
            setIsDeviceReady(true); // 약간의 딜레이 후 다시 true로 설정
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
                    key={`camera-${Date.now()}`} // 타임스탬프를 사용하여 항상 새로운 키 생성
                    ref={camera}
                    style={styles.camera}
                    device={device}
                    isActive={isCameraActive} // 위에서 관리하는 상태 변수 사용
                    photo={true}
                />
            ) : (
                <View style={styles.buttonContainer}>
                    <Text>카메라 장치를 찾을 수 없습니다.</Text>{/*
                    <Button title="다음 페이지로 이동" onPress={() => navigation.navigate('Gps')} />*/}
                </View>
            )}

            {/* 헤더 */}
            <View style={styles.header}>
                <Text style={styles.headerText}>{'헬멧 착용한 모습을\n촬영해주세요.'}</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.infoButton}>
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
                <Text style={styles.bottomText}>표시선 안에 헬멧과 얼굴이 들어오도록 해주세요.</Text>
            </View>

            {/* 촬영 및 카메라 전환 버튼 */}
            <View style={styles.bottomButtonsContainer}>
                <View style={{ flex: 1 }} />
                <TouchableOpacity onPress={handleCapture} style={styles.captureButton}>
                    <View style={styles.captureInnerButton} />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'flex-end', paddingRight: 20 }}>
                    <TouchableOpacity onPress={toggleCamera} style={styles.toggleCameraButton}>
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
                            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.modalText}>
                            <Text style={[styles.boldText, styles.sectionTitle]}>1. 이마를 보호하는 위치</Text>
                            {"\n"}&nbsp;헬멧의 앞부분이 이마 중앙까지 내려와야 합니다.
                            {"\n"}&nbsp;눈썹 위 약 2cm 정도의 위치가 적절합니다.
                        </Text>
                        <Text style={styles.spacer} />

                        <Text style={styles.modalText}>
                            <Text style={[styles.boldText, styles.sectionTitle]}>2. 턱끈(스트랩) 조절</Text>
                            {"\n"}&nbsp;스트랩을 조여 손가락 하나 정도 들어갈 정도로 고정해야 합니다.
                            {"\n"}&nbsp;‘Y’자 모양 스트랩이 귀 아래쪽에서 균형을 맞추도록 합니다.
                        </Text>
                        <Text style={styles.spacer} />

                        <Text style={styles.modalText}>
                            <Text style={[styles.boldText, styles.sectionTitle]}>3. 헬멧의 흔들림 체크</Text>
                            {"\n"}&nbsp;헬멧을 손으로 움직였을 때, 쉽게 흔들리지 않아야 합니다.
                            {"\n"}&nbsp;고개를 흔들어도 헬멧이 움직이지 않으면 올바르게 착용한 것입니다.
                        </Text>
                        <Text style={styles.spacer} />

                        <Text style={styles.modalText}>
                            <Text style={[styles.boldText, styles.sectionTitle]}>4. 착용 전 최종 점검</Text>
                            {"\n"}&nbsp;헬멧이 수평으로 잘 맞춰졌는지 확인합니다.
                            {"\n"}&nbsp;턱끈이 풀리지 않도록 한 번 더 점검합니다.
                        </Text>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', position: 'relative' },
    header: { position: 'absolute', top: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '90%' },
    headerText: { fontSize: 18, fontWeight: 'bold', color: 'white', textAlign: 'center', flex: 1 },
    infoButton: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#007BFF', alignItems: 'center', justifyContent: 'center' },
    infoButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    camera: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -2
    },

    guideFrame: { position: 'absolute', top: '15%', width: '60%', height: '30%', borderColor: 'transparent' },
    cornerTopLeft: { position: 'absolute', top: 0, left: 0, width: 50, height: 50, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#FF6A33' },
    cornerTopRight: { position: 'absolute', top: 0, right: 0, width: 50, height: 50, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#FF6A33' },
    cornerBottomLeft: { position: 'absolute', bottom: 0, left: 0, width: 50, height: 50, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#FF6A33' },
    cornerBottomRight: { position: 'absolute', bottom: 0, right: 0, width: 50, height: 50, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#FF6A33' },

    buttonContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
        top: '17%',
    },


    bottomTextContainer: { position: 'absolute', bottom: 120, backgroundColor: 'rgba(0,0,0,0.5)', padding: 10, borderRadius: 8 },
    bottomText: { color: 'white', fontSize: 16, textAlign: 'center' },

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
        backgroundColor: 'rgba(128,128,128,0.5)', // 반투명 회색
        justifyContent: 'center',
        alignItems: 'center',
    },
    toggleCameraText: {
        color: 'white',
        fontSize: 20,
    },


    modalBackground: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 10, padding: 20 },
    modalText: {
        fontSize: 14,
        lineHeight: 18,  // 줄 간격 조절
    },
    boldText: {
        fontWeight: 'bold',
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, },
    modalTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#FF6347', flex: 1 },

    closeButton: { padding: 10 },
    closeButtonText: { fontSize: 20, fontWeight: 'bold' },
});

export default CameraScreen;

