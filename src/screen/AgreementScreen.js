import {
  StyleSheet,
  ScrollView,
  View,
  Text,
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
import Api from '../api/ApiUtils';
import {useNavigation} from '@react-navigation/native';

export default function AgreementScreen() {
  const navigation = useNavigation();

  const [agreementData, setAgreement] = useState({
    id: '',
    password: '',
    confirmPassword: '',
    phone: '',
    nickname: '',
  });

  const [agreements, setAgreements] = useState({
    terms: false,
    privacy: false,
    marketing: false,
  });

  const handleInputChange = (field, value) => {
    setAgreement(prevAgreement => ({
      ...prevAgreement,
      [field]: value,
    }));
  };

  const formatPhoneNumber = text => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    } else {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(
        7,
        11,
      )}`;
    }
  };

  const handlePhoneChange = text => {
    const formatted = formatPhoneNumber(text);
    handleInputChange('phone', formatted);
  };

  const handleSubmit = async () => {
    const {id, password, phone, nickname, confirmPassword} = agreementData;

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

    const phoneDigits = phone.replace(/-/g, '');
    const phoneRegex = /^010\d{8}$/;
    if (!phoneRegex.test(phoneDigits)) {
      Alert.alert(
        '입력 오류',
        '전화번호는 010으로 시작하는 11자리 숫자여야 합니다.',
      );
      return;
    }

    if (!password.trim()) {
      Alert.alert('입력 오류', '비밀번호를 입력해주세요.');
      return;
    }
    if (password.length < 3) {
      Alert.alert('입력 오류', '비밀번호는 3자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('입력 오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (!agreements.terms || !agreements.privacy) {
      Alert.alert('약관 동의', '필수 약관에 동의해주세요.');
      return;
    }

    try {
      // 백엔드 API 스펙에 맞춘 데이터 구조
      // POST /api/app/users/register
      const response = await Api.register({
        userId: id,
        password: password,
        nickname: nickname,
        telNum: phone,
      });

      if (response.success) {
        Alert.alert('가입 성공', '회원가입이 완료되었습니다.', [
          {text: '확인', onPress: () => navigation.navigate('Login')},
        ]);
      } else {
        Alert.alert(
          '가입 실패',
          response.message || '회원가입에 실패했습니다.',
        );
      }
    } catch (error) {
      console.error('Register submit error:', error);

      const errorMessage =
        error.error?.message ||
        error.message ||
        (typeof error === 'string'
          ? error
          : '회원가입 중 오류가 발생했습니다.');

      Alert.alert('가입 실패', errorMessage);
    }
  };

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
              <View>
                <Text style={styles.subtitle}>S:Drive와 함께 시작하세요</Text>
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
                    value={agreementData.id}
                    onChangeText={text => handleInputChange('id', text)}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>닉네임</Text>
                  <Input
                    icon="happy-outline"
                    placeholder="닉네임을 입력하세요"
                    placeholderTextColor={'#aaa'}
                    value={agreementData.nickname}
                    onChangeText={text => handleInputChange('nickname', text)}
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
                    maxLength={13}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>비밀번호</Text>
                  <Input
                    icon="lock-closed-outline"
                    placeholder="비밀번호 (3자 이상)"
                    placeholderTextColor={'#aaa'}
                    onChangeText={text => handleInputChange('password', text)}
                    secureTextEntry
                    value={agreementData.password}
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
