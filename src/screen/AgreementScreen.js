import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Button} from '../component/Button';
import {Input} from '../component/Input';
import {Card} from '../component/Card';
import {colors} from '../component/constants/colors';
import Ionicons from 'react-native-vector-icons/Ionicons';
import React, {useState} from 'react';
// import RadioButton from '../component/RadioButton';
import Api from '../api/ApiUtils';
import {useNavigation} from '@react-navigation/native';

export default function AgreementScreen() {
  const navigation = useNavigation();
  const [agreementData, setAgreement] = useState({
    id: '',
    password: '',
    confirmPassword: '', // 추가
    // email: '',
    // sex: null,
    // phone: '',
    nickname: '',
  });
  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
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
    const {id, password, email, phone, sex} = agreementData;

    // username (id) 유효성 검사
    if (!id.trim()) {
      Alert.alert('입력 오류', '아이디를 입력해주세요.');
      return;
    }
    if (id.length > 26) {
      Alert.alert('입력 오류', '아이디는 26자 이내로 입력해주세요.');
      return;
    }
    if (!nickname.trim()) {
      Alert.alert('입력 오류', '닉네임을 입력해주세요.');
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

    if (password !== agreementData.confirmPassword) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    // // 이메일 형식 검사
    // const emailRegex = /^[^@]+@[^@]+\.[^@]+$/;
    // if (!emailRegex.test(email.trim())) {
    //   Alert.alert('입력 오류', '유효한 이메일 주소를 입력해주세요.');
    //   return;
    // }

    // // 전화번호 유효성 검사
    // const phoneDigits = phone.replace(/-/g, '');
    // const phoneRegex = /^010\d{8}$/;
    // if (!phoneRegex.test(phoneDigits)) {
    //   Alert.alert(
    //     '입력 오류',
    //     '전화번호는 010으로 시작하는 11자리 숫자여야 합니다.',
    //   );
    //   return;
    // }

    try {
      const response = await Api.register(agreementData);
      console.log(response);
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('가입 실패', error.message);
    }
  };
  // // 전화번호 포맷팅
  // const formatPhoneNumber = text => {
  //   const cleaned = text.replace(/\D/g, ''); // Remove all non-numeric characters
  //   if (cleaned.length === 11) {
  //     const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/);
  //     if (match) {
  //       return `${match[1]}-${match[2]}-${match[3]}`;
  //     }
  //   }
  //   return text;
  // };

  // const handlePhoneChange = text => {
  //   const formatted = formatPhoneNumber(text);
  //   handleInputChange('phone', formatted);
  // };

  const toggleAgreement = key => {
    setAgreements({...agreements, [key]: !agreements[key]});
  };

  const toggleAllAgreements = () => {
    const allChecked =
      agreements.terms && agreements.privacy && agreements.marketing;
    setAgreements({
      terms: !allChecked,
      privacy: !allChecked,
      marketing: !allChecked,
    });
  };

  return (
    <LinearGradient
      colors={[colors.green600, colors.emerald700]}
      style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              {/* <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}>
                <Ionicons name="arrow-back" size={24} color={colors.white} />
              </TouchableOpacity> */}
              <View>
                {/* <Text style={styles.title}>회원가입</Text> */}
                <Text style={styles.subtitle}>SafeRide와 함께 시작하세요</Text>
              </View>
            </View>

            {/* Signup Form */}
            <Card style={styles.card}>
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>아이디</Text>
                  <Input
                    icon="person-outline"
                    placeholder="아이디를 입력하세요"
                    placeholderTextColor={'#aaa'}
                    // value={formData.name}
                    onChangeText={text => handleInputChange('id', text)}
                  />
                </View>

                {/* 닉네임 */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>닉네임</Text>
                  <Input
                    icon="happy-outline"
                    placeholder="닉네임을 입력하세요"
                    placeholderTextColor={'#aaa'}
                    onChangeText={text => handleInputChange('nickname', text)}
                  />
                </View>

                {/* <View style={styles.inputGroup}>
                  <Text style={styles.label}>이메일</Text>
                  <Input
                    icon="mail-outline"
                    placeholder="example@email.com"
                    placeholderTextColor={'#aaa'}
                    // value={formData.email}
                    onChangeText={text => handleInputChange('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>휴대폰 번호</Text>
                  <Input
                    icon="call-outline"
                    placeholder="010-1234-5678"
                    placeholderTextColor={'#aaa'}
                    onChangeText={handlePhoneChange}
                    value={agreementData.phone}
                    keyboardType="phone-pad"
                  />
                </View> */}

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>비밀번호</Text>
                  <Input
                    icon="lock-closed-outline"
                    placeholder="비밀번호"
                    placeholderTextColor={'#aaa'}
                    onChangeText={text => handleInputChange('password', text)}
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>비밀번호 확인</Text>
                  <Input
                    icon="lock-closed-outline"
                    placeholder="비밀번호를 다시 입력해주세요"
                    placeholderTextColor={'#aaa'}
                    value={agreementData.confirmPassword}
                    onChangeText={text =>
                      handleInputChange('confirmPassword', text)
                    }
                    secureTextEntry
                  />
                </View>

                {/* Agreements */}
                <View style={styles.agreementsContainer}>
                  <TouchableOpacity
                    style={styles.agreementItem}
                    onPress={toggleAllAgreements}>
                    <View style={styles.checkboxContainer}>
                      <Ionicons
                        name={
                          agreements.terms &&
                          agreements.privacy &&
                          agreements.marketing
                            ? 'checkbox'
                            : 'square-outline'
                        }
                        size={24}
                        color={colors.green600}
                      />
                      <Text style={styles.agreementText}>모두 동의합니다</Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  <TouchableOpacity
                    style={styles.agreementItem}
                    onPress={() => toggleAgreement('terms')}>
                    <View style={styles.checkboxContainer}>
                      <Ionicons
                        name={agreements.terms ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={colors.gray600}
                      />
                      <Text style={styles.agreementSubText}>
                        (필수) 이용약관 동의
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.agreementItem}
                    onPress={() => toggleAgreement('privacy')}>
                    <View style={styles.checkboxContainer}>
                      <Ionicons
                        name={
                          agreements.privacy ? 'checkbox' : 'square-outline'
                        }
                        size={20}
                        color={colors.gray600}
                      />
                      <Text style={styles.agreementSubText}>
                        (필수) 개인정보처리방침 동의
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.agreementItem}
                    onPress={() => toggleAgreement('marketing')}>
                    <View style={styles.checkboxContainer}>
                      <Ionicons
                        name={
                          agreements.marketing ? 'checkbox' : 'square-outline'
                        }
                        size={20}
                        color={colors.gray600}
                      />
                      <Text style={styles.agreementSubText}>
                        (선택) 마케팅 정보 수신 동의
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <Button title="가입하기" onPress={handleSubmit} />
              </View>
            </Card>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>이미 계정이 있으신가요? </Text>
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.footerLink}>로그인</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
  },
  subtitle: {
    fontSize: 14,
    color: colors.green100,
  },
  card: {
    marginBottom: 16,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: colors.gray700,
  },
  agreementsContainer: {
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  agreementItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  agreementText: {
    fontSize: 14,
    color: colors.text,
  },
  agreementSubText: {
    fontSize: 14,
    color: colors.gray600,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerText: {
    fontSize: 14,
    color: colors.green100,
  },
  footerLink: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
