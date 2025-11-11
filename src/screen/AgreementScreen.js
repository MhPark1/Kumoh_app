import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, { useState } from 'react';
import RadioButton from '../component/RadioButton';
import Api from '../api/ApiUtils';
import { useNavigation } from '@react-navigation/native';

export default function AgreementScreen() {
  const navigation = useNavigation();
  const [agreementData, setAgreement] = useState({
    id: '',
    password: '',
    email: '',
    //sex: null,
    phone: '',
  });

  //const radio_props = [
  //   { label: '여성', value: '여성' },
  //   { label: '남성', value: '남성' },
  // ];
   const handleInputChange = (field, value) => {
    setAgreement(prevAgreement => ({
      ...prevAgreement,
      [field]: value,
    }));
  };


   const handleSubmit = async () => {
    const { id, password, email, phone, sex } = agreementData;
  
    // username (id) 유효성 검사
    if (!id.trim()) {
      Alert.alert('입력 오류', '아이디를 입력해주세요.');
      return;
    }
    if (id.length > 26) {
      Alert.alert('입력 오류', '아이디는 26자 이내로 입력해주세요.');
      return;
    }
  
    // 비밀번호 유효성 검사
    if (!password.trim()) {
      Alert.alert('입력 오류', '비밀번호를 입력해주세요.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('입력 오류', '비밀번호는 8자 이상이어야 합니다.');
      return;
    }
  
    // 이메일 형식 검사
    const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('입력 오류', '유효한 이메일 주소를 입력해주세요.');
      return;
    }
  
    // 전화번호 유효성 검사
    const phoneDigits = phone.replace(/-/g, '');
    const phoneRegex = /^010\d{8}$/;
    if (!phoneRegex.test(phoneDigits)) {
      Alert.alert('입력 오류', '전화번호는 010으로 시작하는 11자리 숫자여야 합니다.');
      return;
    }
    
    try {
      const response = await Api.register(agreementData);
      console.log(response);
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('가입 실패', error.message);
    }
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

  return (
    <View style={styles.container}>{/*
      <Text style={styles.logoPoint}>회원 가입</Text>*/}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>아이디</Text>
          <TextInput
            style={styles.input}
            placeholder="아이디를 입력하세요"
            placeholderTextColor={'#aaa'}
            onChangeText={text => handleInputChange('id', text)}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>비밀번호</Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호를 입력하세요"
            secureTextEntry
            placeholderTextColor={'#aaa'}
            onChangeText={text => handleInputChange('password', text)}
          />
        </View>
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>이메일</Text>
          <TextInput
            style={styles.input}
            placeholder="이메일을 입력하세요"
            placeholderTextColor={'#aaa'}
            onChangeText={text => handleInputChange('email', text)}
          />
        </View>
        {/*<View style={styles.formGroup}>
          <Text style={styles.inputLabel}>성별</Text>
          <View style={styles.radioForm}>
            {radio_props.map((radio, index) => (
              <RadioButton
                key={index}
                isSelected={agreementData.sex === radio.value}
                onPress={() => handleInputChange('sex', radio.value)}
                buttonColor={'#B0C4DE'}
                selectedButtonColor={'#ff6a33'}
                labelColor={'#333'}
                style={styles.radioButton}>
                {radio.label}
              </RadioButton>
            ))}
          </View>
        </View>*/}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>전화번호</Text>
          <TextInput
            style={styles.input}
            placeholder="전화번호를 입력하세요"
            placeholderTextColor={'#aaa'}
            onChangeText={handlePhoneChange}
            value={agreementData.phone}
            keyboardType="phone-pad"
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>등록하기</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContainer: {
    padding: 16,
    alignItems: 'center',
  },
  logoPoint: {
    fontSize: 28,
    color: '#ff6a33',
    fontWeight: 'bold',
    marginVertical: 20,
    padding:15
  },
  formGroup: {
    width: '100%',
    marginBottom: 20,
  },
  inputLabel: {
    color: '#666',
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    borderColor: '#ddd',
    borderRadius: 8,
    borderWidth: 1,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  radioForm: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: 12,
  },
  radioButton: {
    marginRight: 20,
  },
  button: {
    backgroundColor: '#ff6a33',
    padding: 15,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
