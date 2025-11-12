# React Native Android 설정 가이드

## 초기 설치

```bash
# 1. 패키지 설치
npm install

# 2. Android 빌드
cd android
./gradlew clean
./gradlew assembleDebug --stacktrace --info
cd ..

# 3. 번들 생성
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res/

npx react-native bundle --platform android --platform android --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

# 4. 개발 서버 시작
npm start ---reset-cache
android로 실행
```

## 코드 업데이트 후 적용

```bash
# 1. 번들 재생성
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output android/app/src/main/assets/index.android.bundle \
  --assets-dest android/app/src/main/res/

# 2. 개발 서버 재시작
npm start --reset-cache
android로 실행
```

### 문제 해결

```bash
# 빌드 에러 시
cd android
./gradlew clean
cd ..

# 완전히 새로 시작
node_modules 폴더 삭제
npm install

# 애뮬레이터 연결 오류
adb reverse tcp:8080 tcp:8080
```
