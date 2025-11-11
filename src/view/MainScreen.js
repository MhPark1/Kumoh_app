import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet,ScrollView } from 'react-native';
import Api from '../api/ApiUtils';  // API 호출 함수 임포트
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import 'moment/locale/ko';  // 한글 로케일 추가
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";

const MainScreen = ({ navigation }) => {
  const [hdata, sethData] = useState(null);
  const [userId, setUserId] = useState(null);
  const fetchData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('user_id');
      setUserId(storedUserId);
      const userData = { user_id: storedUserId };

      const response = await Api.getMainScreenData(userData);
      const responseData = JSON.parse(response.data);

      sethData(responseData);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);
  useFocusEffect(
    React.useCallback(() => {
      // 탭 이동 시마다 데이터 다시 가져오기
      fetchData();
    }, [])
  );

  const latestRecord = hdata?.latest_record || null;
  const totalCount = hdata?.total_count ?? "-";
  const countAbove95 = hdata?.count_above_95 ?? "-";
  const avgFinalScore = hdata?.average_final_score ?? "-";

  // 시작 시간과 종료 시간 계산
  let recordDate = "-";
  let recordTime = "-";

  if (latestRecord) {
    moment.locale('ko');
    const startTime = moment(latestRecord.timestamp); // 시작 시간
    const endTime = startTime.clone().add(latestRecord.total_time_s, 'seconds'); // 종료 시간 계산

    recordDate = startTime.format("YY.MM.DD dddd"); // "24.10.15 화요일"
    recordTime = `${startTime.format("HH:mm")}~${endTime.format("HH:mm")}`; // "11:46~11:47"
  }
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollContainer}> 
      {/* 인사말 섹션 */}
      <View style={styles.header}>
        <Image style={styles.logoImg}
          source={require('../asset/logo.png')}
          alt="logo"
        />
        <Text style={styles.greeting}>{userId}님 안녕하세요.</Text>
        <Text style={styles.subText}>오늘도 안전 주행을 도와드릴게요!</Text>
      </View>
      {/* 통계 카드 섹션 */}
      <View style={styles.statsContainer}>
        <View style={styles.card}>
          <View style={styles.innerCard}>
            <Text style={styles.cardLabel}>안전주행</Text>
          </View>
          <Text style={styles.cardValue}>{totalCount}회</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.innerCard}>
            <Text style={styles.cardLabel}>95점 이상</Text>
          </View>
          <Text style={styles.cardValue}>{countAbove95}회</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.innerCard}>
            <Text style={styles.cardLabel}>평균점수</Text>
          </View>
          <Text style={styles.cardValue}>{avgFinalScore}점</Text>
        </View>
      </View>

      {/* 최근 주행 기록 */}
      <View style={styles.recordContainer}>
        <Text style={styles.recordTitle}>최근 주행 기록</Text>
        {latestRecord ? (
          <>
            <View style={styles.recordHeader}>
              <Text style={styles.recordDate}>{recordDate}</Text>
              <Text style={styles.recordTime}>{recordTime}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.recordDetails}>
              <Text style={styles.recordLeft}>{latestRecord.final_score}</Text>
              <Text style={styles.recordCenter}>{formatTime(latestRecord.total_time_s)}</Text>
              <Text style={styles.recordRight}>{(latestRecord.total_distance_m / 1000).toFixed(2)}km</Text>
            </View>
            <View style={styles.recordDetails}>
              <Text style={styles.recordLeft2}>점수</Text>
              <Text style={styles.recordCenter2}>시간</Text>
              <Text style={styles.recordRight2}>킬로미터</Text>
            </View>
            <View style={styles.recordDetails}>
              <View style={styles.helmetContainer}>
                <Text style={styles.habitValue}>
                  {
                    latestRecord.helmet_on === true ?
                      <Image
                        source={require('../asset/helmet_on.png')}
                        style={styles.helmetImage}
                        alt="Helmet On"
                      /> :
                      <Image
                        source={require('../asset/helmet_off.png')}
                        style={styles.helmetImage}
                        alt="Helmet Off"
                      />
                  }
                </Text>
                <Text style={styles.habitLabel}>헬멧 착용 여부</Text>
              </View>
              <View style={styles.eventContainer}>
                <View style={styles.eventItem}>
                  <Text style={styles.habitValue}>{latestRecord.abrupt_acceleration_count}</Text>
                  <Text style={styles.habitLabel}>급가속</Text>
                </View>
                <View style={styles.eventItem}>
                  <Text style={styles.habitValue}>{latestRecord.abrupt_deceleration_count}</Text>
                  <Text style={styles.habitLabel}>급감속</Text>
                </View>
                <View style={styles.eventItem}>
                  <Text style={styles.habitValue}>{latestRecord.abrupt_stop_count}</Text>
                  <Text style={styles.habitLabel}>급정지</Text>
                </View>
                <View style={styles.eventItem}>
                  <Text style={styles.habitValue}>{latestRecord.abrupt_start_count}</Text>
                  <Text style={styles.habitLabel}>급출발</Text>
                </View>
                <View style={styles.eventItem}>
                  <Text style={styles.habitValue}>{latestRecord.turn_noslow_cnt}</Text>
                  <Text style={styles.habitLabel}>급회전</Text>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.noRecordContainer}>
            <Text style={styles.noRecordText}>주행 기록이 없습니다</Text>
          </View>
        )}
      </View>

      {/* 주행 시작 버튼 */}
      <TouchableOpacity style={styles.startButton} onPress={() => navigation.navigate("Camera")}>
        <Text style={styles.startButtonText}>주행 시작(카메라 페이지)</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.startButton} onPress={() => navigation.navigate("Gps")}>
        <Text style={styles.startButtonText}>주행 시작</Text>
      </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 10,
    justifyContent: "space-between",
    marginTop: 10,
  },
  header: {
    alignItems: "left",
    marginBottom: 20,
  },
  logoImg: {
    width: 100,
    height: 50,
    obectFit: 'cover',
    marginBottom: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
    marginLeft: 10,
  },
  subText: {
    fontSize: 18,
    color: "#333",
    marginLeft: 10,
  },
  scrollContainer:{
    marginTop: 10,
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  card: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: "#fff3ef",
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: '10%',
  },
  innerCard: {
    backgroundColor: "#ffd9cc", // 강조 배경색
    paddingVertical: '5%',
    paddingHorizontal: 8,
    borderRadius: 6,
    marginBottom: 10,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6a33",
  },
  cardValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ff6a33",
  },
  recordContainer: {
    backgroundColor: "#fff3ef",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  recordTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff6a33",
    marginBottom: 10,
  },
  recordHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  recordDate: {
    fontSize: 16,
    color: "#ff6a33",
  },
  recordTime: {
    fontSize: 16,
    color: "#ff6a33",
  },
  divider: {
    height: 1,
    backgroundColor: "#ff6a33",
    width: "100%",
    marginVertical: 10,
  },
  recordDetails: {
    flexDirection: "row",
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  recordLeft: {
    flex: 1,
    textAlign: "left",
    fontSize: 20,
    fontWeight: "bold",
    color: "#ff6a33",
  },
  recordCenter: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#ff6a33",
  },
  recordRight: {
    flex: 1,
    textAlign: "right",
    fontSize: 20,
    fontWeight: "bold",
    color: "#ff6a33",
  },
  recordLeft2: {
    flex: 1,
    textAlign: "left",
    fontSize: 20,
    color: "#ff6a33",
  },
  recordCenter2: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    color: "#ff6a33",
  },
  recordRight2: {
    flex: 1,
    textAlign: "right",
    fontSize: 20,
    color: "#ff6a33",
  },
  helmetContainer: {
    flex: 3,
    alignItems: "center",
  },
  eventContainer: {
    flex: 7,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  eventItem: {
    alignItems: "center",
    flex: 1,
  },
  habitValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ff6a33",
  },
  habitLabel: {
    fontSize: 14,
    color: "#ff6a33",
  },
  startButton: {
    backgroundColor: "#ff6a33",
    paddingVertical: '5%',
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
});

export default MainScreen;
