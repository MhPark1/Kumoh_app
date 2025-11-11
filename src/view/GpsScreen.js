import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Alert,
    TouchableOpacity,
    ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import crypto from 'crypto-js';
import Api from '../api/ApiUtils';
import { useNavigation } from '@react-navigation/native';
import { useKeepAwake } from '@sayem314/react-native-keep-awake';
import { useLocation } from '../context/LocationProvider';
import { accelerometer, gyroscope, magnetometer, setUpdateIntervalForType, SensorTypes } from 'react-native-sensors';
import { SafeAreaView } from "react-native-safe-area-context";
import CompassHeading from 'react-native-compass-heading';

// 각도 계산을 위한 유틸
const toDegrees = rad => rad * (180 / Math.PI);

// Pitch, Roll, Yaw 계산 함수 (소수점 5자리 반올림)
const calculateOrientation = (accel, mag) => {
    const pitch = Math.atan2(accel.x, Math.hypot(accel.y, accel.z));
    const roll = Math.atan2(accel.y, Math.hypot(accel.x, accel.z));

    const xM2 = mag.x * Math.cos(pitch) + mag.z * Math.sin(pitch);
    const yM2 =
        mag.x * Math.sin(roll) * Math.sin(pitch) +
        mag.y * Math.cos(roll) -
        mag.z * Math.sin(roll) * Math.cos(pitch);

    let yaw = Math.atan2(yM2, xM2);
    let yawDeg = toDegrees(yaw);
    if (yawDeg < 0) yawDeg += 360;

    return {
        pitch: parseFloat(toDegrees(pitch).toFixed(5)),
        roll: parseFloat(toDegrees(roll).toFixed(5)),
        yaw: parseFloat(yawDeg.toFixed(5)),
    };
};
const GpsScreen = () => {
    const [isMeasuring, setIsMeasuring] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [tripId, setTripId] = useState('');
    const [userId, setUserId] = useState('');
    const [safty, setSafty] = useState('');
    const [startTimestamp, setStartTimestamp] = useState(null);
    const { locationData, setLocationData } = useLocation();
    const [resultData, setResultData] = useState(null);
    const navigation = useNavigation();
    useKeepAwake();

    const [accelData, setAccelData] = useState([]);
    const [gyroData, setGyroData] = useState([]);
    const [motionData, setMotionData] = useState([]);
    const [headingData, setHeadingData] = useState([]);

    const [accelSubscription, setAccelSubscription] = useState(null);
    const [gyroSubscription, setGyroSubscription] = useState(null);
    const [magnetSubscription, setMagnetSubscription] = useState(null);

    // --------------------- 타이머 ---------------------
    useEffect(() => {
        let timer;
        if (isMeasuring) {
            timer = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timer);
        }
        return () => clearInterval(timer);
    }, [isMeasuring]);

    // --------------------- 초기 로드(AsyncStorage) ---------------------
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const storedUserId = await AsyncStorage.getItem('user_id');
                setSafty(storedSafty || '');
                if (storedUserId) {
                    setUserId(storedUserId);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            }
        };
        fetchUserData();
    }, []);
    // --------------------- 센서 구독/해제 (react-native-sensors) ---------------------
    const formatData = (x, y, z) => ({
        x: parseFloat(x.toFixed(5)),
        y: parseFloat(y.toFixed(5)),
        z: parseFloat(z.toFixed(5)),
    });

    let latestAccel = null;

    // 센서 구독 최적화
    const subscribeSensors = () => {
        // 센서 업데이트 간격 설정 (200ms로 변경)
        setUpdateIntervalForType(SensorTypes.accelerometer, 200);
        setUpdateIntervalForType(SensorTypes.gyroscope, 200);
        setUpdateIntervalForType(SensorTypes.magnetometer, 200);

        // Accelerometer 구독 시작
        const accelSub = accelerometer.subscribe(({ x, y, z }) => {
            const timestamp = Date.now();
            const formattedData = formatData(x, y, z);
            latestAccel = formattedData;
            setAccelData(prev => [...prev, { ...formattedData, timestamp }]);
        });

        // Gyroscope 구독 시작
        const gyroSub = gyroscope.subscribe(({ x, y, z }) => {
            const timestamp = Date.now();
            const formattedData = formatData(x, y, z);
            setGyroData(prev => [...prev, { ...formattedData, timestamp }]);
        });

        // Magnetometer 구독 시작
        const magSub = magnetometer.subscribe(({ x, y, z }) => {
            const timestamp = Date.now();
            const formattedMag = formatData(x, y, z);

            if (latestAccel) {
                const orientation = calculateOrientation(latestAccel, formattedMag);
                setMotionData(prev => [...prev, { ...orientation, timestamp }]);
            }
        });
        CompassHeading.start(3, ({ heading }) => {
            const timestamp = Date.now();
            setHeadingData(prev => [
                ...prev,
                { heading: parseFloat(heading.toFixed(5)), timestamp },
            ]);
        });

        setAccelSubscription(accelSub);
        setGyroSubscription(gyroSub);
        setMagnetSubscription(magSub);
    };

    const unsubscribeSensors = () => {
        accelSubscription?.unsubscribe();
        gyroSubscription?.unsubscribe();
        magnetSubscription?.unsubscribe();

        setAccelSubscription(null);
        setGyroSubscription(null);
        setMagnetSubscription(null);

        CompassHeading.stop(); // heading stop
    };

    // 센서 데이터 필터링: 시작시간과 종료시간 사이의 데이터만 선택
    const filterSensorData = (dataArray, start, stop) => {
        const startTime = new Date(start).getTime();
        const stopTime = new Date(stop).getTime();
        return dataArray.filter(item => item.timestamp >= startTime && item.timestamp <= stopTime);
    };

    // 유틸 함수: 배열 포맷 변환
    const arrayToColumnar = (dataArray, keys) => {
        const result = {};
        keys.forEach(key => result[key] = []);
        result.timestamp = [];

        dataArray.forEach(item => {
            keys.forEach(key => result[key].push(item[key]));
            result.timestamp.push(formatDate(item.timestamp));
        });

        return result;
    };

    // --------------------- 핸들러들 ---------------------
    // UUID 아이디 생성
    const generateTripId = () => {
        const rand = Math.random().toString();
        const date = new Date();
        return crypto
            .SHA256(rand + ',' + date.toString())
            .toString(crypto.enc.Hex);
    };

    const handleStart = () => {
        const now = new Date().toISOString();
        setStartTimestamp(formatDate(now));
        setIsMeasuring(true);
        setTripId(generateTripId());
        subscribeSensors();
    };

    const handleStop = () => {
        Alert.alert(
            '운행 종료',
            '운행을 종료하시겠습니까?',
            [
                {
                    text: '아니요',
                    style: 'cancel',
                },
                {
                    text: '네',
                    onPress: async () => {
                        setIsMeasuring(false);
                        const now = new Date().toISOString();
                        const stopTimestamp = formatDate(now);
                        setElapsedTime(0);

                        // 측정 구간의 위치 데이터만 필터링
                        const filteredData = { latitude: [], longitude: [], timestamp: [] };
                        locationData.timestamp.forEach((t, i) => {
                            if (t >= startTimestamp && t <= stopTimestamp) {
                                filteredData.latitude.push(locationData.latitude[i]);
                                filteredData.longitude.push(locationData.longitude[i]);
                                filteredData.timestamp.push(t);
                            }
                        });
                        // 센서 데이터 필터링 (시작~종료 시간)
                        const filteredAccel = filterSensorData(accelData, startTimestamp, stopTimestamp);
                        const filteredGyro = filterSensorData(gyroData, startTimestamp, stopTimestamp);
                        const filteredMotionData = filterSensorData(motionData, startTimestamp, stopTimestamp);
                        const filteredCompasData = filterSensorData(headingData, startTimestamp, stopTimestamp);
            
                        unsubscribeSensors();
            
                        // Columnar 변환
                        const accelFormatted = arrayToColumnar(filteredAccel, ['x', 'y', 'z']);
                        const gyroFormatted = arrayToColumnar(filteredGyro, ['x', 'y', 'z']);
                        const motionFormatted = arrayToColumnar(filteredMotionData, ['pitch', 'roll', 'yaw']);
                        const azimuthFormatted = arrayToColumnar(filteredCompasData, ['heading']);
            
                        // 최종 전송 데이터
                        const dataToSend = {
                            user_id: userId,
                            trip_id: tripId,
                            safty_helmet_on: "true",
                            trip_log: filteredData,
                            accel: accelFormatted,
                            gyro: gyroFormatted,
                            motion: motionFormatted,
                            azimuth: azimuthFormatted,
                          };
                          
                        console.log("보내는 데이터:", JSON.stringify(dataToSend, null, 2));

                        // 주행 결과 AI로 관리하는 API 호출
                        try {
                        /*
                            const [send, save] = await Promise.all([
                                Api.sendTripLog(dataToSend),
                                Api.saveTripLog(dataToSend, navigation),
                            ]);
                            setResultData(send);
                            */

                            try {
                                // 호출 결과 저장
                                // const saveResponse = await Api.saveResult(send);
                                // console.log("Save Result Response:", saveResponse);
                            } catch (error) {
                                // Alert.alert('서버 오류', '결과를 저장할 수 없습니다.');
                            }

                            const send = { "trip_id": "e0ed07302d826b9f1774d78089f8d3deb7ebeee45bddda41e5aa4f",
                                           "total_distance_m": 431.11,
                                           "total_time_sec": 1290,
                                           "sudden_start_cnt": 0,
                                           "sudden_stop_cnt": 0,
                                           "sudden_accel_cnt": 5,
                                           "sudden_decel_cnt": 5,
                                           "turn_noslow_cnt": 3,
                                           "helmet_on": "true",
                                           "final_score": 97 }; // 응답 예시 데이터

                            if (send.final_score) {
                                navigation.navigate('Analysis', { result: send });
                            } else {
                                Alert.alert(
                                    '분석결과 없음',
                                    '운행 점수를 측정할 수 없습니다.',
                                    [{ text: 'OK' }]
                                );
                            }
                        } catch (error) {
                            //Alert.alert('서버 오류', '서버로 데이터를 전송할 수 없습니다.');
                        }

                        // 위치 데이터 초기화
                        setLocationData({ latitude: [], longitude: [], timestamp: [] });
                        setStartTimestamp(null);
                        setAccelData([]);
                        setGyroData([]);

                    },
                },
            ],
            { cancelable: false }
        );
    };

    // (분석결과 이동 로직 - 버튼은 화면에 없음)
    const handleHistory = () => {
        if (resultData) {
            Alert.alert(
                '분석결과',
                '분석결과 화면으로 이동합니다.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.navigate('Analysis', { result: resultData })
                    }
                ]
            );
        } else {
            Alert.alert('분석결과 없음', '운행 분석 결과가 없습니다.', [{ text: 'OK' }]);
        }
    };

    // --------------------- 유틸(시간 포맷/날짜 포맷) ---------------------
    const formatTime = (sec) => {
        const minutes = Math.floor(sec / 60);
        const seconds = sec % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const formatDate = (time) => {
        const date = new Date(time);
        const year = date.getFullYear();
        const month = `0${date.getMonth() + 1}`.slice(-2);
        const day = `0${date.getDate()}`.slice(-2);
        const hours = `0${date.getHours()}`.slice(-2);
        const minutes = `0${date.getMinutes()}`.slice(-2);
        const seconds = `0${date.getSeconds()}`.slice(-2);
        const ms = `00${date.getMilliseconds()}`.slice(-3);
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${ms}`;
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* 스크롤 가능 영역 */}
            <ScrollView>
                {/* 상단 제목/부제목 */}
                <View style={styles.headerContainer}>
                    <Text style={styles.title}>주행 중입니다.</Text>
                    <Text style={styles.subtitle}>
                        킥보드가 멈춘 상태에서 화면을 확인해주세요!
                    </Text>
                </View>

                {/* 시간 / 킬로미터 (좌우 박스) */}
                <View style={styles.infoContainer}>
                    <View style={styles.infoBox}>
                        <Text style={styles.infoValue}>{formatTime(elapsedTime)}</Text>
                        <Text style={styles.infoLabel}>시간</Text>
                    </View>{/* 
                    <View style={styles.infoBox}>
                        <Text style={styles.infoValue}>1.54</Text>
                        <Text style={styles.infoLabel}>킬로미터</Text>
                    </View>*/}
                </View>

                {/* 주의 문구 (테이블 밖, 별도 영역) */}
                <View style={styles.warningContainer}>
                    <Text style={styles.warningText}>• <Text style={styles.boldText}>급감속</Text>에 유의하세요</Text>
                    <Text style={styles.warningText}>• <Text style={styles.boldText}>교통법규</Text>를 준수하세요</Text>
                    <Text style={styles.warningText}>• <Text style={styles.boldText}>자전거 도로</Text>로 통행하세요</Text>
                </View>

                {/* 버튼 2개 (위/아래) */}
                <View style={styles.buttonsContainer}>
                    <TouchableOpacity
                        style={[
                            styles.button,
                            styles.pauseButton,
                            !isMeasuring && styles.activeButton
                        ]}
                        onPress={handleStart}
                        disabled={isMeasuring}
                    >
                        <Text
                            style={[
                                styles.buttonText,
                                !isMeasuring && styles.activeButtonText
                            ]}
                        >
                            측정 시작
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            styles.endButton,
                            !isMeasuring && styles.buttonDisabled
                        ]}
                        onPress={handleStop}
                        disabled={!isMeasuring}
                    >
                        <Text style={styles.buttonText}>측정 종료</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

// --------------------- 스타일 ---------------------
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fa8c64',
        padding: 20,
    },

    // 상단 제목/부제목
    headerContainer: {
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#000',
        marginBottom: 5,
        textAlign: 'left', // 왼쪽 정렬
    },
    subtitle: {
        fontSize: 14,
        color: '#333',
        textAlign: 'left',
    },

    // 시간/킬로미터 (좌우 박스)
    infoContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
    },
    infoBox: {
        alignItems: 'center',
        backgroundColor: '#ffd9cc',
        paddingVertical: '15%',
        borderRadius: 10,
        width: '100%',
    },
    infoValue: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#ff6a33',
        marginBottom: 5,
    },
    infoLabel: {
        fontSize: 22,
        color: '#ff6a33',
    },

    // 테이블 영역 (급가속/급감속/급정지/급출발)
    tableContainer: {
        backgroundColor: '#ffd9cc',
        borderWidth: 0,  // 🔹 외곽선 제거
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 20,
        padding: 20
    },
    tableRow: {
        flexDirection: 'row',
    },
    rowBorderTop: {
        borderTopWidth: 0,  // 🔹 가로선 제거
    },
    tableCell: {
        flex: 1,
        paddingVertical: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cellBorderLeft: {
        borderLeftWidth: 1,  // 🔹 세로선 제거
        borderLeftColor: '#FF6A33',
    },
    tableCellLabel: {
        fontSize: 14,
        color: '#ff6a33',
        fontWeight: '600',
    },
    tableCellValue: {
        fontSize: 18,
        color: '#FF6A33',
        fontWeight: 'bold',
    },
    // 주의 문구 (테이블 밖, 별도)
    warningContainer: {
        alignItems: 'left',
        backgroundColor: '#ffd9cc',
        paddingVertical: '10%',
        borderRadius: 10,
    },
    warningText: {
        fontSize: 16,
        color: '#FF6A33',
        marginHorizontal: 15,
        marginVertical: 5,
        fontWeight: '600',
    },
    boldText: {
        fontWeight: 'bold',
    },


    // 버튼
    buttonsContainer: {
        marginTop: 10,
        marginBottom: 40, // 하단 공간 확보
    },
    button: {
        borderRadius: 10,
        paddingVertical: '5%',
        alignItems: 'center',
        marginBottom: 10,
    },
    pauseButton: {
        backgroundColor: '#ff8f66',
        borderWidth: 1,
        borderColor: '#fa8c64',
    },
    endButton: {
        backgroundColor: '#FF3B30',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    activeButton: {
        borderColor: '#FF6A33',
    },
    activeButtonText: {
        color: '#d43108',
    },
    buttonDisabled: {
        opacity: 0.5,
    },
});

export default GpsScreen;
