# 📱 SAHADA MOBILE APP - SETUP GUIDE

## 🚀 Quick Start

### Prerequisites
```bash
# Node.js 18+
node --version

# React Native CLI
npm install -g react-native-cli

# iOS (Mac only)
xcode-select --install
sudo gem install cocoapods

# Android
# Download Android Studio and SDK
# Set ANDROID_HOME environment variable
```

### Installation

```bash
# Navigate to mobile folder
cd mobile

# Install dependencies
npm install

# iOS: Install pods
cd ios && pod install && cd ..

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## 📁 Project Structure

```
mobile/
├── src/
│   ├── App.tsx                 # Main app entry
│   ├── navigation/
│   │   ├── RootNavigator.tsx   # Root stack navigator
│   │   ├── MainTabNavigator.tsx # Bottom tabs
│   │   └── linking.ts          # Deep linking config
│   ├── screens/
│   │   ├── WelcomeScreen.tsx   # ✅ Done
│   │   ├── LoginScreen.tsx     # ✅ Done
│   │   ├── DashboardScreen.tsx # ✅ Done
│   │   ├── MatchesScreen.tsx   # 🚧 TODO
│   │   ├── TeamScreen.tsx      # 🚧 TODO
│   │   ├── ProfileScreen.tsx   # 🚧 TODO
│   │   └── ...
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Header.tsx
│   │   └── ...
│   ├── contexts/
│   │   ├── AuthContext.tsx     # ✅ Done
│   │   └── ThemeContext.tsx    # ✅ Done
│   ├── services/
│   │   ├── api.ts              # API client
│   │   ├── push-notifications.ts
│   │   └── storage.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useBiometric.ts
│   │   └── useHaptic.ts
│   ├── theme/
│   │   └── index.ts            # ✅ Done
│   ├── types/
│   │   └── index.ts            # ✅ Done
│   └── utils/
│       └── helpers.ts
├── android/                    # Android native code
├── ios/                        # iOS native code
├── package.json                # ✅ Done
├── tsconfig.json               # ✅ Done
└── babel.config.js             # ✅ Done
```

## ✅ Completed Features

### 1. Project Setup
- ✅ React Native project initialized
- ✅ TypeScript configuration
- ✅ Navigation structure (Stack + Bottom Tabs)
- ✅ Theme system
- ✅ Type definitions

### 2. Core Screens
- ✅ WelcomeScreen - Animated onboarding
- ✅ LoginScreen - Phone authentication
- ✅ DashboardScreen - Main home screen

### 3. Infrastructure
- ✅ AuthContext - User authentication
- ✅ Deep linking setup (sahada://match/123)
- ✅ Path aliases (@components, @screens, etc.)

## 🚧 Next Steps

### Phase 1: Core Screens (This Week)
- [ ] MatchesScreen
- [ ] MatchDetailsScreen
- [ ] TeamScreen
- [ ] ProfileScreen
- [ ] SettingsScreen
- [ ] TeamSetupScreen
- [ ] AdminDashboardScreen
- [ ] MatchCreateScreen

### Phase 2: Native Features (Week 2)
- [ ] Push Notifications (Firebase)
- [ ] Biometric Authentication
- [ ] Camera Integration
- [ ] Image Picker
- [ ] Haptic Feedback
- [ ] Contacts Integration

### Phase 3: API Integration (Week 3)
- [ ] API Service Layer
- [ ] Offline Storage (MMKV)
- [ ] Background Sync
- [ ] Real-time Updates

### Phase 4: Polish (Week 4)
- [ ] Animations (Reanimated 3)
- [ ] Performance Optimization
- [ ] Error Handling
- [ ] Loading States
- [ ] Empty States

## 📱 Test Users

```
Admin:   Phone = "1" or "admin"
Captain: Phone = "7" or "kaptan"
Member:  Phone = "2"
```

## 🎨 Design System

### Colors
```typescript
primary: '#10B981'      // Emerald green
secondary: '#0B0F1A'    // Deep navy
surface: '#151e32'      // Card background
alert: '#F59E0B'        // Orange
```

### Spacing
```typescript
xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48
```

### Typography
```typescript
xs: 10, sm: 12, md: 14, lg: 16, xl: 18, xxl: 20, display: 32
```

## 🔗 Deep Linking Examples

```bash
# Open match details
sahada://match/m123

# Open venue
sahada://venue/v456

# Open user profile
sahada://user/789

# Open dashboard
sahada://dashboard
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Run e2e tests (Detox)
npm run test:e2e
```

## 📦 Building

### iOS
```bash
# Debug
npm run ios

# Release
npm run build:ios
```

### Android
```bash
# Debug
npm run android

# Release
npm run build:android
```

## 🔧 Troubleshooting

### Metro bundler issues
```bash
npm start -- --reset-cache
```

### iOS build issues
```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Android build issues
```bash
cd android
./gradlew clean
cd ..
```

## 📚 Documentation

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [Firebase Setup](https://rnfirebase.io/)

## 🎯 Current Status

**Phase:** 1/4 - Core Screens  
**Progress:** 15% (3/20 screens done)  
**Next:** Complete remaining core screens

---

**Ready to build!** 🚀

Start development:
```bash
cd mobile
npm install
npm run ios     # or npm run android
```
