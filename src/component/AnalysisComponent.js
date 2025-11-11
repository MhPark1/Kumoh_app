import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';

export default function AnalysisComponent() {
  const [selectedComponent, setSelectedComponent] = useState('MainMark');

  const renderComponent = () => {
    switch (selectedComponent) {
      case 'MainMark':
        return <MainMark />;
      case 'DistanceMark':
        return <DistanceMark />;
      case 'DriveScore':
        return <DriveScore />;
      default:
        return null;
    }
  };

  return (
    <>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            selectedComponent === 'MainMark' && styles.selectedButton,
          ]}
          onPress={() => setSelectedComponent('MainMark')}>
          <Text
            style={[
              styles.buttonText,
              selectedComponent === 'MainMark' && styles.selectedButtonText,
            ]}>
            주요 감점 요인
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            selectedComponent === 'DistanceMark' && styles.selectedButton,
          ]}
          onPress={() => setSelectedComponent('DistanceMark')}>
          <Text
            style={[
              styles.buttonText,
              selectedComponent === 'DistanceMark' && styles.selectedButtonText,
            ]}>
            거리별 감점 현황
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.button,
            selectedComponent === 'DriveScore' && styles.selectedButton,
          ]}
          onPress={() => setSelectedComponent('DriveScore')}>
          <Text
            style={[
              styles.buttonText,
              selectedComponent === 'DriveScore' && styles.selectedButtonText,
            ]}>
            운행 점수 비교
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chartContainer}>{renderComponent()}</View>
    </>
  );
}

// 주요 감점 요인 차트
const mainData = [
  { value: 60, label: '급가속' },
  { value: 90, label: '급감속' },
  { value: 88, label: '급출발' },
  { value: 75, label: '급정지' },
  { value: 97, label: '안전모착용' },
  { value: 80, label: '충돌위험' },
];

function MainMark() {
  return (
    <BarChart
      horizontal
      data={mainData}
      barWidth={25}
      shiftY={-40} // Remove or adjust shift values
      shiftX={-20} // Remove or adjust shift values
      xAxisColor="#959595"
      yAxisColor="#959595"
      barBorderTopRightRadius={10}
      barBorderTopLeftRadius={10}
      labelsExtraHeight={40}
      xAxisLabelTextStyle={{ fontSize: 12, marginLeft: -35, textAlign: 'left' }}
      stepHeight={25}
      spacing={15}
      showGradient
      frontColor={'#D3E0FF'}
      gradientColor={'#5488FF'}
      initialSpacing={0}
      height={230}
    />
  );
}

// 거리별 감점 현황 차트
const distanceData = [
  { value: 15, label: '10km' },
  { value: 30, label: '20km' },
  { value: 23, label: '30km' },
  { value: 40, label: '40km' },
  { value: 16, label: '50km' },
  { value: 50, label: '60km' },
];

function DistanceMark() {
  return (
    <LineChart
      areaChart
      data={distanceData}
      color="#5488FF"
      xAxisColor="#959595"
      yAxisColor="#959595"
      startFillColor="#5488FF"
      endFillColor="#ffffff"
      startOpacity={0.8}
      endOpacity={0.3}
      isAnimated
      noOfSections={5}
    />
  );
}

// 운행 점수 비교 차트
const driveData = [
  {
    value: 65,
    label: '이전 운행 점수',
    frontColor: '#FFA311',
    topLabelComponent: () => (
      <Text style={{ color: '#bdbdbd', fontSize: 15 }}>65</Text>
    ),
  },
  {
    value: 94,
    label: '현재 운행 점수',
    frontColor: '#0F4BD3',
    topLabelComponent: () => (
      <Text style={{ color: '#bdbdbd', fontSize: 15 }}>94</Text>
    ),
  },
];

function DriveScore() {
  return (
    <BarChart
      data={driveData}
      barBorderTopRightRadius={10}
      barBorderTopLeftRadius={10}
      barWidth={50}
      spacing={70}
      noOfSections={5}
      xAxisColor="#959595"
      yAxisColor="#959595"
    />
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    backgroundColor: '#BDBDBD',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  selectedButton: {
    backgroundColor: '#DDE7FF',
  },
  buttonText: {
    color: '#ffffff',
  },
  selectedButtonText: {
    color: '#5488FF',
  },
  chartContainer: {
    flex: 1,
    padding: 10,
    marginTop: 30,
  },
});
