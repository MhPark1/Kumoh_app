import React, {useState, useContext} from 'react';
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
import {SafeAreaView} from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {Button} from '../component/Button';
import {Input} from '../component/Input';
import {Card} from '../component/Card';
import {colors} from '../component/constants/colors';

import Api from '../api/ApiUtils';
import {useNavigation} from '@react-navigation/native';
import {AuthContext} from '../context/AuthContext';

export default function UserEditScreen() {
  const navigation = useNavigation();
  const {authUser, updateUser} = useContext(AuthContext);

  const [form, setForm] = useState({
    nickname: authUser?.nickname || '',
    currentPassword: '',
    newPassword: '',
  });

  const handleChange = (field, value) => {
    setForm(prev => ({...prev, [field]: value}));
  };

  const handleSubmit = async () => {
    const {nickname, currentPassword, newPassword} = form;

    if (!nickname.trim()) {
      Alert.alert('입력 오류', '닉네임을 입력해주세요.');
      return;
    }

    if (newPassword && newPassword.length < 3) {
      Alert.alert('입력 오류', '새 비밀번호는 3자 이상이어야 합니다.');
      return;
    }

    if (newPassword && !currentPassword) {
      Alert.alert(
        '입력 오류',
        '현재 비밀번호를 입력해야 새 비밀번호로 변경할 수 있습니다.',
      );
      return;
    }

    if (currentPassword && !newPassword) {
      Alert.alert('입력 오류', '새 비밀번호를 입력해주세요.');
      return;
    }

    try {
      const payload = {
        nickname,
      };

      // 비밀번호 필드가 둘 다 채워진 경우에만 payload에 추가
      if (currentPassword && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const response = await Api.updateMyInfo(payload, navigation); //임시 Api명, 추후 수정 필요

      if (response.success) {
        updateUser(response.user);

        Alert.alert('수정 완료', '정보가 성공적으로 수정되었습니다.', [
          {text: '확인', onPress: () => navigation.goBack()},
        ]);
      } else {
        Alert.alert(
          '수정 실패',
          response.message || '정보 수정에 실패했습니다.',
        );
      }
    } catch (error) {
      console.error('User update error:', error);
      const message =
        error.message ||
        error.error?.message ||
        '정보 수정 중 문제가 발생했습니다.';

      Alert.alert('오류', message);
    }
  };

  return (
    <LinearGradient
      colors={[colors.green600, colors.emerald700]}
      style={styles.gradient}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}>
          <View style={styles.inner}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
              <View style={styles.header}>
                <Text style={styles.subtitle}>회원 정보 수정</Text>
              </View>

              <Card style={styles.card}>
                <View style={styles.form}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>닉네임</Text>
                    <Input
                      icon="happy-outline"
                      value={form.nickname}
                      placeholder="닉네임을 입력하세요"
                      placeholderTextColor="#aaa"
                      onChangeText={text => handleChange('nickname', text)}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>현재 비밀번호 (선택)</Text>
                    <Input
                      icon="lock-closed-outline"
                      secureTextEntry
                      value={form.currentPassword}
                      placeholder="현재 비밀번호"
                      placeholderTextColor="#aaa"
                      onChangeText={text =>
                        handleChange('currentPassword', text)
                      }
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>새 비밀번호 (선택)</Text>
                    <Input
                      icon="lock-closed-outline"
                      secureTextEntry
                      value={form.newPassword}
                      placeholder="새 비밀번호 (3자 이상)"
                      placeholderTextColor="#aaa"
                      onChangeText={text => handleChange('newPassword', text)}
                    />
                  </View>

                  <Button title="저장하기" onPress={handleSubmit} />
                </View>
              </Card>
            </ScrollView>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={20} color={colors.white} />
              <Text style={styles.backText}>돌아가기</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {flex: 1},
  container: {flex: 1},
  keyboardView: {flex: 1},
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  header: {
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 18,
    color: colors.green100,
  },
  card: {
    marginBottom: 20,
  },
  form: {gap: 16},
  inputGroup: {gap: 8},
  label: {
    fontSize: 14,
    color: colors.gray700,
  },
  backButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  backText: {
    color: colors.white,
    fontSize: 14,
  },
});
