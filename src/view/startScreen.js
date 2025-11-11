import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function WelcomeScreen() {
    const navigation = useNavigation();

  // 단계: 'start' | 'phone' | 'verify'
  const [step, setStep] = useState('start');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState(false);

  // 인증 관련 상태
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeInputs, setCodeInputs] = useState(['', '', '', '']);
  const [timer, setTimer] = useState(60);
  const timerRef = useRef(null);
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // 휴대폰 번호 포맷팅
  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, ''); // 숫자만 남기기
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
  };

  const handlePhoneChange = (text) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
    setPhoneError(false);
  };

  // 전화번호 유효성 검사: XXX-XXXX-XXXX 형식만 허용
  const isValidPhone = (number) => {
    return /^\d{3}-\d{4}-\d{4}$/.test(number);
  };

  const handleStart = () => {
    setStep('phone');
  };

  // 전화번호 입력 단계에서 '다음' 버튼 처리
  const handleNextFromPhone = () => {
    if (!isValidPhone(phone)) {
      setPhoneError(true);
      return;
    }
    setPhoneError(false);
    // 인증 코드 생성 및 타이머 시작
    const code = generateRandomCode();
    setGeneratedCode(code);
    Alert.alert("인증코드 발송", `인증코드: ${code}`);
    setStep('verify');
    startTimer();
  };

  // 4자리 랜덤 인증 코드 생성
  const generateRandomCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  // 60초 타이머 시작
  const startTimer = () => {
    setTimer(60);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // 코드 재전송: 새 코드 생성, 타이머 리셋, 입력칸 초기화
  const handleResend = () => {
    const code = generateRandomCode();
    setGeneratedCode(code);
    Alert.alert("인증코드 재전송", `새 인증코드: ${code}`);
    startTimer();
    setCodeInputs(['', '', '', '']);
  };

  // 각 인증 코드 입력칸 처리 (숫자 0~9, 한 자리씩)
  const handleInputChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newCodeInputs = [...codeInputs];
      newCodeInputs[index] = value;
      setCodeInputs(newCodeInputs);
      if (value && index < 3) {
        inputRefs[index + 1].current.focus();
      }
    }
  };

  // 회원가입 버튼 처리: 입력한 코드와 생성된 코드가 일치하는지 확인
  const handleSignUp = () => {
    const enteredCode = codeInputs.join('');
    if (enteredCode === generatedCode && timer > 0) {
      navigation.navigate('Selection');
    } else {
      Alert.alert("오류", "인증코드를 다시 확인해주세요.");
    }
  };

  if (step === 'start') {
    return (
      <View style={styles.container}>
        <Text style={styles.appTitle}>
          킥서비스로{'\n'}시작하는{'\n'}
        </Text>
        <Text style={styles.appTitle}>
          안전한{'\n'}모빌리티 라이프
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleStart}>
          <Text style={styles.buttonText}>시작하기</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (step === 'phone') {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>휴대폰 번호를 입력해 주세요</Text>
        <TextInput
          style={[styles.input, phoneError && styles.inputError]}
          placeholder="휴대폰 번호 입력"
          placeholderTextColor="#999"
          keyboardType="phone-pad"
          value={phone}
          onChangeText={handlePhoneChange}
          maxLength={13} // "000-0000-0000" 형식에 맞춤
        />
        {phoneError && (
          <Text style={styles.errorText}>휴대폰 번호를 다시 확인해주세요.</Text>
        )}
        <TouchableOpacity style={styles.button} onPress={handleNextFromPhone}>
          <Text style={styles.buttonText}>다음</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (step === 'verify') {
    return (
      <View style={styles.container}>
        <Text style={styles.verifyTitle}>인증 코드를 입력해 주세요</Text>
        <Text style={styles.verifySubtitle}>
          코드는 {timer}초 후 만료됩니다.{' '}
          <Text style={styles.resendText} onPress={handleResend}>
            코드 재전송
          </Text>
        </Text>
        <View style={styles.codeInputContainer}>
          {codeInputs.map((digit, index) => (
            <TextInput
              key={index}
              style={styles.codeInput}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(value) => handleInputChange(index, value)}
              ref={inputRefs[index]}
            />
          ))}
        </View>
        <TouchableOpacity style={styles.button} onPress={handleSignUp}>
          <Text style={styles.buttonText}>회원가입</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ff6a33',
    marginBottom: 40,
  },
  label: {
    fontSize: 18,
    color: '#333',
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
    fontSize: 16,
    marginBottom: 12,
  },
  inputError: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#ff6a33',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  verifyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  verifySubtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
  },
  resendText: {
    color: 'orange',
    fontWeight: 'bold',
  },
  codeInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: 30,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    width: 50,
    height: 50,
    textAlign: 'center',
    fontSize: 24,
  },
});
