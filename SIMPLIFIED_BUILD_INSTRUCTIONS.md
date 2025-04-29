# Simplified Build Instructions

This is a streamlined guide to building the NFC Payment System with minimal configuration and maximum reliability. This approach should work regardless of your local environment.

## Step-by-Step Instructions

### 1. Install Required Tools

```bash
# Install EAS CLI globally
npm install -g eas-cli
```

### 2. Install Project Dependencies

```bash
# Navigate to the project directory
cd nfc-payment-system-build-fix

# Install dependencies
npm install
```

### 3. Login to Expo

```bash
# Log in to your Expo account (create one if needed at expo.dev)
eas login
```

### 4. Configure Your Project

```bash
# Configure the project for building (one-time setup)
eas build:configure
```

This command helps set up your project for building with EAS. Simply follow the prompts.

### 5. Build the Android APK

```bash
# Build the Android app
eas build --platform android --profile production
```

### 6. Download the APK

Once the build completes (this may take a few minutes), you'll receive a URL where you can download the APK.

## Common Issues & Solutions

### "The app must have 'expo' module installed" Error

If you see this error, run:
```bash
npm install expo
```

### "You have not signed the build credentials" Warning

This is normal for a first build. EAS will generate credentials for you automatically.

### Build Fails With Missing Modules

If the build fails because of missing modules, try:
```bash
npm install --force
```

## Alternative: Building Locally

If you prefer to build locally and have Android SDK installed:

```bash
# Generate the Android project
npx expo prebuild -p android

# Navigate to the Android directory
cd android

# Build the APK
./gradlew assembleRelease
```

The APK will be available at `android/app/build/outputs/apk/release/app-release.apk`.

## Testing the App

After installing the APK on your Android device:

1. Open the app
2. Go to API Settings
3. Enter your API server URL (http://your-server-ip:5000/api)
4. Test the connection
5. Start using the app