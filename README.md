# NFC Payment System Build Instructions

This package contains a simplified approach to building the Android app that should work regardless of your local environment.

## Prerequisites

- An Expo account (create one at https://expo.dev/signup if needed)
- Node.js installed (any recent version)
- EAS CLI installed: `npm install -g eas-cli`

## Step 1: Login to Expo

```bash
eas login
```

## Step 2: Build The App

```bash
eas build --platform android
```

## Why This Works

This simplified approach works because:

1. We've completely removed all problematic prebuild commands
2. We've configured the eas.json file to use Expo's managed workflow
3. All the build complexity is handled by Expo's servers, not your local machine

## What To Expect

When you run `eas build --platform android`:

1. EAS will upload your project to Expo's servers
2. The build will happen remotely on Expo's build infrastructure
3. You'll be given a URL to download the final APK when the build is complete

## Troubleshooting

If you encounter any issues:

1. Make sure you're logged in with `eas login`
2. Try running `eas build:configure` first to set up your project
3. If you get any specific error messages, please send them to us for help

## Need Additional Help?

If you continue to face issues, please reach out with specific error messages and we can provide targeted assistance.