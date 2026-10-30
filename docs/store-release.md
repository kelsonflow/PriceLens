# PriceLens store release

## Release configuration

- App version: `1.0.0`
- Android package: `com.kelsonflow.pricelens`
- iOS bundle identifier: `com.kelsonflow.pricelens`
- EAS production profile: automatic build-number increment, `production` update channel
- Android submission track: internal testing

## Required EAS production variables

- `GOOGLE_SERVICES_JSON` (secret file)
- `GOOGLE_SERVICE_INFO_PLIST` (secret file)
- `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`

## Validate

Run from the repository root:

```powershell
pnpm --filter @pricelens/mobile build
pnpm --filter @pricelens/mobile test
pnpm dlx expo-doctor@latest apps/mobile
```

The project intentionally keeps the tested Expo SDK 57 patch versions until the
newest patches pass the workspace supply-chain release-age policy.

## Build

Run from `apps/mobile`:

```powershell
eas build --platform android --profile production
eas build --platform ios --profile production
```

## Submit

Submit Android to the internal Play testing track first:

```powershell
eas submit --platform android --profile production --latest
```

Submit iOS to App Store Connect/TestFlight:

```powershell
eas submit --platform ios --profile production --latest
```

Promote builds from internal testing/TestFlight only after purchase, sign-in,
notifications, camera, photo picker, account deletion, and restore-purchases
flows have been tested on physical devices.
