import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import moment from 'moment';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Api from '../api/ApiUtils';  // API 호출 함수 임포트
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from "react-native-safe-area-context";


// ------------------------------------
// 1) 주간 옵션
//    - 주차 라벨: YYYY.MM.DD - YYYY.MM.DD
//    - 오래된 주부터 차례대로 쌓기(최신이 마지막)
// ------------------------------------
const baseDate = moment('2024-01-01');
const today = moment();
const screenWidth = Dimensions.get('window').width;

let tempWeekList = [];
let startOfWeek = baseDate.clone().startOf('isoWeek');

while (startOfWeek.isBefore(today)) {
  const endOfWeek = startOfWeek.clone().endOf('isoWeek');
  // 주차 라벨을 "YYYY.MM.DD - YYYY.MM.DD" 형태로
  const label = `${startOfWeek.format('YYYY.MM.DD')} - ${endOfWeek.format('YYYY.MM.DD')}`;
  tempWeekList.push(label);
  startOfWeek.add(1, 'week');
}

// 최종 주간 옵션
const weekOptions = [...tempWeekList];

// ------------------------------------
// 2) 연간 옵션
//    - 2024년 ~ 올해까지 오름차순 (가장 오래된 연도가 맨 앞, 최신 연도가 맨 뒤)
// ------------------------------------
const tempYearList = [];
let yearCursor = baseDate.clone().startOf('year');

while (yearCursor.isBefore(today) || yearCursor.isSame(today, 'year')) {
  tempYearList.push(yearCursor.format('YYYY'));
  yearCursor.add(1, 'year');
}

const yearOptions = [...tempYearList];

// ------------------------------------
// 3) 월간 옵션: 1 ~ 12 오름차순
//    - 가장 최신(12)이 배열 맨 뒤
// ------------------------------------
const getAvailableMonths = (selectedYear) => {
  const currentY = today.year();     // 예: 2025
  const currentM = today.month() + 1; // 예: 3 (3월)
  const y = parseInt(selectedYear, 10);

  // 결과 담을 배열
  const months = [];
  for (let i = 1; i <= 12; i++) {
    // 만약 선택된 연도가 올해라면, 현재 달까지만
    if (y === currentY && i > currentM) {
      break;
    }
    months.push(String(i)); // '1', '2', '3' ...
  }
  return months;
};

// ------------------------------------
// 공통 "점수 산출 기준" 컴포넌트
// ------------------------------------
const ScoreCriteria = () => (
  <View style={styles.scoreCriteriaBox}>
    <Text style={styles.scoreCriteriaText}>
      생성형 AI를 통한 주행 분석은
      <Text style={styles.boldText}> 헬맷 착용 여부, 급가속•급감속•급출발•급정지 횟수</Text>
      를 기준으로 산출합니다. 또한, 운행의
      <Text style={styles.boldText}> 안전 점수 </Text>추세를 바탕으로
      사용자의 안전 운전 습관을 평가합니다.
    </Text>
  </View>
);

// ------------------------------------
// 공통 카드 컴포넌트
// ------------------------------------
const DrivingRecordCard = ({ periodLabel, onPressPeriod, hdata, defaultScore = 0 }) => {
  // hdata가 존재하면 백엔드에서 받은 전체 평균 점수를 사용하고, 없으면 기본값 사용
  const score = hdata && hdata.overall_avg_score !== undefined ? hdata.overall_avg_score : defaultScore;

  // hdata.history로부터 이벤트 합계 계산
  let totalAbruptAcceleration = 0;
  let totalAbruptDeceleration = 0;
  let totalAbruptStart = 0;
  let totalAbruptStop = 0;
  let totalTurnCnt = 0;
  if (hdata && hdata.history) {
    hdata.history.forEach(item => {
      totalAbruptAcceleration += item.abrupt_acceleration_count;
      totalAbruptDeceleration += item.abrupt_deceleration_count;
      totalAbruptStart += item.abrupt_start_count;
      totalAbruptStop += item.abrupt_stop_count;
      totalTurnCnt += item.turn_noslow_cnt;
    });
  }

  // hdata.daily_avg_scores가 null인 경우 기본 빈 객체를 사용
  const dailyAvgScores = (hdata && hdata.daily_avg_scores) || {};

  // 📌 기간에서 시작 날짜 가져오기
  const [startStr, endStr] = periodLabel.split(' - ');
  const startMoment = moment(startStr, 'YYYY.MM.DD');

  // 📌 날짜 및 점수를 날짜 객체 기준으로 정렬 (월 변경 고려!)
  const sortedEntries = Object.entries(dailyAvgScores)
    .map(([dayStr, score]) => {
      const day = parseInt(dayStr, 10);

      // 시작 날짜에서 day값이 더 작으면 다음 달로 간주
      let date = startMoment.clone().date(day);
      if (day < startMoment.date()) {
        date.add(1, 'month'); // 다음 달로 이동
      }

      return { date, score };
    })
    .sort((a, b) => a.date - b.date); // 날짜 기준 정렬

  // 📌 라벨
  const chartLabels = sortedEntries.map(({ date }, idx) => {
    if (sortedEntries.length >= 15) {
      return date.date() % 5 === 1 ? String(date.date()) : '';
    }
    return String(date.date());
  });

  // 📌 차트 데이터
  const chartData = sortedEntries.map(({ score }) => score);

  return (
    <View style={styles.cardContainer}>
      {/* 기간 버튼 (모달 오픈) */}
      <TouchableOpacity style={styles.periodBtn} onPress={onPressPeriod}>
        <View style={styles.periodBtnContent}>
          <Text style={styles.periodBtnText}>{periodLabel}</Text>
          <Icon name="chevron-down" size={15} color="#000" style={styles.periodBtnIcon} />
        </View>
      </TouchableOpacity>

      {/* 평균 점수 표시 */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreNumber}>{score}</Text>
        <Text style={styles.scoreLabel}>평균 점수</Text>
      </View>

      {/* 차트: 날짜별 평균 점수 */}
      {chartLabels.length > 0 && (
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: chartLabels,
              datasets: [
                {
                  data: chartData,
                  color: (opacity = 1) => `rgba(255,122,34,${opacity})`,
                  strokeWidth: 2,
                },
              ],
            }}
            width={screenWidth - 48}
            height={220}
            yLabelsOffset={5}
            chartConfig={{
              backgroundGradientFrom: "#FFF8F5",
              backgroundGradientTo: "#FFF8F5",
              fillShadowGradient: "#FF5722",
              fillShadowGradientOpacity: 0,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255,122,34,${opacity})`,
              labelColor: (opacity = 1) => `rgba(255,122,34,${opacity})`,
              style: { borderRadius: 8 },
              propsForDots: { r: "0", strokeWidth: "1" },
              propsForBackgroundLines: { strokeWidth: 0 },
            }}
            bezier
            style={{ alignSelf: "center", paddingLeft: 24, paddingRight: 24 }}
          />
        </View>
      )}

      {/* 이벤트 통계: 급가속, 급감속, 급정지, 급출발 */}
      <View style={styles.statsRow}>
        <View style={styles.statsItem}>
          <Text style={styles.statsNumber}>{totalAbruptAcceleration}</Text>
          <Text style={styles.statsLabel}>급가속</Text>
        </View>
        <View style={styles.statsItem}>
          <Text style={styles.statsNumber}>{totalAbruptDeceleration}</Text>
          <Text style={styles.statsLabel}>급감속</Text>
        </View>
        <View style={styles.statsItem}>
          <Text style={styles.statsNumber}>{totalAbruptStop}</Text>
          <Text style={styles.statsLabel}>급정지</Text>
        </View>
        <View style={styles.statsItem}>
          <Text style={styles.statsNumber}>{totalAbruptStart}</Text>
          <Text style={styles.statsLabel}>급출발</Text>
        </View>
        <View style={styles.statsItem}>
          <Text style={styles.statsNumber}>{totalTurnCnt}</Text>
          <Text style={styles.statsLabel}>급회전</Text>
        </View>
      </View>
    </View>
  );
};

// ------------------------------------
// 주간 탭
// ------------------------------------
const WeeklyRecord = ({ hdata, onPeriodChange }) => {
  const [selectedWeek, setSelectedWeek] = useState(
    weekOptions.length > 0 ? weekOptions[weekOptions.length - 1] : ''
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [tempSelectedWeek, setTempSelectedWeek] = useState(selectedWeek);
  const flatListRef = React.useRef(null);

  const computeWeekPeriod = (weekLabel) => {
    const [start, end] = weekLabel.split(' - ');
    return {
      start_date: start.replace(/\./g, '-'),
      end_date: end.replace(/\./g, '-'),
    };
  };

  const handleSelect = () => {
    setSelectedWeek(tempSelectedWeek);
    setModalVisible(false);
    const newPeriod = computeWeekPeriod(tempSelectedWeek);
    onPeriodChange(newPeriod);
  };

  useEffect(() => {
    if (modalVisible && flatListRef.current) {
      setTimeout(() => {
        const index = weekOptions.findIndex((w) => w === tempSelectedWeek);
        if (index !== -1) {
          try {
            // 인덱스가 범위를 초과하는 경우 마지막 인덱스로 설정
            const validIndex = Math.min(index, weekOptions.length - 1);
            flatListRef.current.scrollToOffset({
              offset: validIndex * 50, // 아이템 높이(예제에서는 50px)
              animated: true,
            });
          } catch (error) {
            console.log("스크롤 이동 오류:", error);
          }
        }
      }, 100);
    }
  }, [modalVisible]);

  return (
    <View style={styles.screenContainer}>
      <DrivingRecordCard
        periodLabel={selectedWeek}
        onPressPeriod={() => {
          setTempSelectedWeek(selectedWeek);
          setModalVisible(true);
        }}
        hdata={hdata}
      />

      <View style={styles.header}>
        <Text style={styles.scoreCriteriaTitle}>점수 산출 기준</Text>
      </View>
      <ScoreCriteria />

      {/* 주간 모달 */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <FlatList
              ref={flatListRef}
              data={weekOptions}
              keyExtractor={(item) => item}
              getItemLayout={(data, index) => ({
                length: 50, offset: 50 * index, index,
              })}
              renderItem={({ item }) => {
                const isSelected = item === tempSelectedWeek;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.selectedItem]}
                    onPress={() => setTempSelectedWeek(item)}
                  >
                    <Text style={[styles.modalItemText, isSelected && styles.selectedItemText]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            {/* 선택 버튼 */}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={handleSelect}>
              <Text style={styles.modalCloseBtnText}>선택</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};
// ------------------------------------
// 연간 탭
// ------------------------------------
const YearlyRecord = () => {
  const [selectedYear, setSelectedYear] = useState(
    yearOptions.length > 0 ? yearOptions[yearOptions.length - 1] : ''
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [tempSelectedYear, setTempSelectedYear] = useState(selectedYear);

  const handleSelect = () => {
    setSelectedYear(tempSelectedYear);
    setModalVisible(false);
  };

  return (
    <View style={styles.screenContainer}>
      <DrivingRecordCard
        periodLabel={selectedYear}
        onPressPeriod={() => {
          setTempSelectedYear(selectedYear);
          setModalVisible(true);
        }}
      />

      <View style={styles.header}>
        <Text style={styles.scoreCriteriaTitle}>점수 산출 기준</Text>
      </View>
      <ScoreCriteria />

      {/* 연간 모달 */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <FlatList
              data={yearOptions}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = item === tempSelectedYear;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.selectedItem]}
                    onPress={() => setTempSelectedYear(item)}
                  >
                    <Text
                      style={[styles.modalItemText, isSelected && styles.selectedItemText]}
                    >
                      {item}년
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />

            {/* 선택 버튼 (가로 가득) */}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={handleSelect}>
              <Text style={styles.modalCloseBtnText}>선택</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ------------------------------------
// 월간 탭: 년도/월 따로 선택, 내림차순
// ------------------------------------
const MonthlyRecord = ({ hdata, onPeriodChange }) => {
  // 초기값: 올해-현재달 (예: "2025-03")
  const initialYear = today.format('YYYY');
  const initialMonth = today.format('MM');
  const [selectedMonth, setSelectedMonth] = useState(`${initialYear}-${initialMonth}`);
  const [modalVisible, setModalVisible] = useState(false);
  const [tempSelectedYear, setTempSelectedYear] = useState(initialYear);
  const [tempSelectedMonth, setTempSelectedMonth] = useState(initialMonth);

  // "YYYY-MM" 형식을 "YYYY년 M월"로 변환
  const getMonthLabel = (value) => {
    const [yyyy, mm] = value.split('-');
    return `${yyyy}년 ${Number(mm)}월`;
  };

  // 선택된 월에 따른 기간 계산 (해당 월의 1일 ~ 말일)
  const computeMonthPeriod = (monthStr) => {
    // monthStr 형식: "YYYY-MM"
    const start_date = moment(monthStr, "YYYY-MM").startOf('month').format("YYYY-MM-DD");
    const end_date = moment(monthStr, "YYYY-MM").endOf('month').format("YYYY-MM-DD");
    return { start_date, end_date };
  };

  // handleYearChange: 연도가 바뀌면 월은 "1"로 초기화
  const handleYearChange = (newYear) => {
    if (newYear !== tempSelectedYear) {
      setTempSelectedYear(newYear);
      setTempSelectedMonth("1"); // 연도 변경 시 월을 1월로 초기화
    }
  };
  const handleMonthChange = (newMonth) => {
    setTempSelectedMonth(newMonth);
  };

  // "선택" 버튼 클릭 시 최종 선택값을 반영하고 부모 콜백 호출
  const handleSelect = () => {
    const twoDigitMonth = String(tempSelectedMonth).padStart(2, '0');
    const newSelectedMonth = `${tempSelectedYear}-${twoDigitMonth}`;
    setSelectedMonth(newSelectedMonth);
    setModalVisible(false);
    // 선택된 월을 기반으로 기간 계산 후 부모에 전달
    const newPeriod = computeMonthPeriod(newSelectedMonth);
    onPeriodChange(newPeriod);
  };

  return (
    <View style={styles.screenContainer}>
      <DrivingRecordCard
        periodLabel={getMonthLabel(selectedMonth)}
        onPressPeriod={() => {
          // 모달 열 때, 기존 선택값으로 초기화
          const [yyyy, mm] = selectedMonth.split('-');
          setTempSelectedYear(yyyy);
          setTempSelectedMonth(String(Number(mm)));
          setModalVisible(true);
        }}
        hdata={hdata}
        score={85}
      />

      <View style={styles.header}>
        <Text style={styles.scoreCriteriaTitle}>점수 산출 기준</Text>
      </View>
      <ScoreCriteria />
      {/* 월간 모달 */}
      <Modal
        transparent={true}
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { flexDirection: 'column', height: '60%' }]}>
            {/* 위쪽: 2개 컬럼(연도 / 월) */}
            <View style={{ flex: 1, flexDirection: 'row' }}>
              {/* 연도 목록 */}
              <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                data={yearOptions}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                  const isSelected = item === tempSelectedYear;
                  return (
                    <TouchableOpacity
                      style={[styles.modalItem, isSelected && styles.selectedItem]}
                      onPress={() => handleYearChange(item)}
                    >
                      <Text
                        style={[styles.modalItemText, isSelected && styles.selectedItemText]}
                      >
                        {item}년
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />

              {/* 월 목록 */}
              <FlatList
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingBottom: 20 }}
                data={getAvailableMonths(tempSelectedYear)}
                keyExtractor={(item) => item}
                renderItem={({ item }) => {
                  const isSelected = item === tempSelectedMonth;
                  return (
                    <TouchableOpacity
                      style={[styles.modalItem, isSelected && styles.selectedItem]}
                      onPress={() => handleMonthChange(item)}
                    >
                      <Text
                        style={[styles.modalItemText, isSelected && styles.selectedItemText]}
                      >
                        {item}월
                      </Text>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>

            {/* 아래쪽: 선택 버튼 (항상 모달 하단에 고정) */}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={handleSelect}>
              <Text style={styles.modalCloseBtnText}>선택</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ------------------------------------
// 탭 네비게이션
// ------------------------------------
const DrivingRecordTabs = () => {
  const [selectedTab, setSelectedTab] = useState('weekly');
  // 초기 period를 선택된 탭에 맞게 동적으로 설정
  // 탭에 따라 기본 날짜 범위를 동적으로 설정하는 예시 함수
  const getDefaultDateRange = (tab) => {
    let start_date, end_date;
    if (tab === 'weekly') {
      // 최근 7일 예시
      start_date = moment().startOf('isoWeek').format("YYYY-MM-DD");
      end_date = moment().endOf('isoWeek').format("YYYY-MM-DD");
    } else if (tab === 'monthly') {
      // 이번 달 전체 예시
      start_date = moment().startOf('month').format("YYYY-MM-DD");
      end_date = moment().endOf('month').format("YYYY-MM-DD");
    } else if (tab === 'yearly') {
      // 올해 전체 예시
      start_date = moment().startOf('year').format("YYYY-MM-DD");
      end_date = moment().endOf('year').format("YYYY-MM-DD");
    }
    return { start_date, end_date };
  };


  const [period, setPeriod] = useState(getDefaultDateRange('weekly'));
  const [hdata, sethData] = useState(null);
  const fetchData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('user_id');
      const userData = { user_id: storedUserId, ...period };
      const response = await Api.getHistoryByPeriod(userData);
      const responseData = JSON.parse(response.data);
      sethData(responseData);
    } catch (error) {
      console.log(error);
    }
  };

  // 탭이나 period 변경 시 API 호출 (둘 다 의존성에 포함)
  useEffect(() => {
    fetchData();
  }, [selectedTab, period]);
  useFocusEffect(
    React.useCallback(() => {
      // 탭 이동 시마다 데이터 다시 가져오기
      fetchData();
    }, [])
  );

  // 각 탭에서 날짜(기간)가 변경되면 부모로부터 콜백을 받아 period 상태 업데이트
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const renderContent = () => {
    if (selectedTab === 'weekly') {
      return <WeeklyRecord hdata={hdata} onPeriodChange={handlePeriodChange} />;
    } else if (selectedTab === 'monthly') {
      return <MonthlyRecord hdata={hdata} onPeriodChange={handlePeriodChange} />;
    } else if (selectedTab === 'yearly') {
      return <YearlyRecord hdata={hdata} onPeriodChange={handlePeriodChange} />;
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>주행 기록</Text>
      </View>

      {/* 탭 메뉴 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'weekly' && styles.activeTab]}
          onPress={() => {
            setSelectedTab('weekly');
            setPeriod(getDefaultDateRange('weekly'));
          }}
        >
          <Text style={styles.tabText}>주간</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, selectedTab === 'monthly' && styles.activeTab]}
          onPress={() => {
            setSelectedTab('monthly');
            setPeriod(getDefaultDateRange('monthly'));
          }}
        >
          <Text style={styles.tabText}>월간</Text>
        </TouchableOpacity>
      </View>

      {/* 탭 내용 */}
      <ScrollView>
        <View style={styles.contentContainer}>{renderContent()}</View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DrivingRecordTabs;

/* ---------------------------------------
  스타일
--------------------------------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 5,
  },
  header: {
    alignItems: "left",
    marginTop: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#545454",
    margin: 5,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  tabButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#FF5722',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  boldText: {
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    alignItems: 'flex-start',
    margin: 10,
  },
  scoreCriteriaTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  cardContainer: {
    backgroundColor: '#FFF8F5',
    margin: 16,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  periodBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'transparent',
    borderRadius: 8,
    marginBottom: 12,
  },
  periodBtnContent: {
    flexDirection: 'row',  // 텍스트와 아이콘 가로 정렬
  },
  periodBtnText: {
    fontSize: 16,
    marginRight: 5,  // 아이콘과 텍스트 간격
  },
  periodBtnIcon: {
    marginTop: 0,
  },
  scoreContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
    marginLeft: 8,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#FF5722',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  statsItem: {
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5722',
  },
  statsLabel: {
    fontSize: 14,
    color: '#FF5722',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: 'transparent',
    justifyContent: 'center',
    overflow: "hidden",
  },
  scoreCriteriaBox: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFF8F5',
    borderRadius: 8,
  },
  scoreCriteriaText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#ff6a33',
  },

  /* ============ 모달 공통 스타일 ============ */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    maxHeight: '60%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 8,
    // 그림자(선택)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalItem: {
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 4,
  },
  modalItemText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  /* 선택된 항목 하이라이트 */
  selectedItem: {
    backgroundColor: '#FFECE4', // 주황빛 배경
  },
  selectedItemText: {
    color: '#FF5722',
    fontWeight: 'bold',
  },
  /* 선택 버튼: 가로 가득 채우기 */
  modalCloseBtn: {
    marginTop: 16,
    alignSelf: 'stretch',   // 부모의 가로폭만큼
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FF5722',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
