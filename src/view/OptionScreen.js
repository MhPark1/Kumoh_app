import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
} from "react-native";
import { useNavigation, CommonActions } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';

const OptionScreen = () => {
  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("010-1234-5678");

  const { logout } = useContext(AuthContext);

  const [agreementData, setAgreement] = useState({
    id: '',
    password: '',
    email: '',
    // sex: null,
    phone: '',
  });

  const handleInputChange = (field, value) => {
    setAgreement(prevAgreement => ({
      ...prevAgreement,
      [field]: value,
    }));
  };

  // 전화번호 포맷팅
  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, ''); // Remove all non-numeric characters
    if (cleaned.length === 11) {
      const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/);
      if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
      }
    }
    return text;
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    handleInputChange('phone', formatted);
  };

  const handleLogout = async () => {
    await logout();
  };

  const settingsData = [
    //{ title: "내정보", data: [{ label: phoneNumber, action: "수정", onPress: () => setModalVisible(true) }] },
    {
      title: "지원", data: [
        { label: "주행 가이드", onPress: () => navigation.navigate("Guide") },
        { label: "고객센터" }
      ]
    },
    {
      title: "서비스 정보", data: [
        { label: "서비스 이용약관" },
        { label: "개인정보처리방침" },
        { label: "위치기반 서비스 이용 약관" }
      ]
    },
    { title: "버전 정보", data: [{ label: "0.0.0" }] },
  ];

  // 📌 "변경하기" 버튼 클릭 시 변경 적용
  const handleChangePhoneNumber = () => {
    setPhoneNumber(phoneNumber);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>설정</Text>
      </View>

      <FlatList
        data={settingsData}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            {item.data.map((entry, index) => (
              <TouchableOpacity key={index} style={styles.row} onPress={entry.onPress}>
                <Text style={styles.entryText}>{entry.label}</Text>
                {entry.action && (
                  <Text style={styles.actionText}>{entry.action}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
      {/* 📌 하단 로그아웃 & 탈퇴 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.footerText}>로그아웃</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text style={styles.footerText}>탈퇴하기</Text>
        </TouchableOpacity>
      </View>

      {/* 📌 휴대폰 번호 변경 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>휴대폰 번호 변경</Text>
            <TextInput
              style={styles.input}
              placeholder="전화번호를 입력하세요"
              placeholderTextColor={'#aaa'}
              onChangeText={handlePhoneChange}
              value={agreementData.phone}
              keyboardType="phone-pad"
              />
            <TouchableOpacity style={styles.confirmButton} onPress={handleChangePhoneNumber}>
              <Text style={styles.confirmButtonText}>변경하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// 📌 스타일 정의
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20, marginTop: 20 },
  header: {
    alignItems: "left",
    marginTop: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#545454",
    margin: 5,
  },
  section: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: "#ddd", paddingBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#555", marginBottom: 5 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginVertical: 5 },
  entryText: { fontSize: 18, color: "#333" },
  actionText: { fontSize: 18, color: "orange", fontWeight: "bold" },
  footer: { marginTop: 20, alignItems: "left" },
  footerText: { fontSize: 16, color: "#999", marginVertical: 5 },
  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)",  },
  modalContainer: { width: "90%", backgroundColor: "#fff", padding: 20, borderRadius: 10, alignItems: "center",  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  input: { width: "100%", padding: 10, fontSize: 16, borderRadius: 5, backgroundColor: "#ffeeee", marginBottom: 10 },
  confirmButton: { width: "100%", backgroundColor: "orange", padding: 10, borderRadius: 5, alignItems: "center" },
  confirmButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default OptionScreen;
