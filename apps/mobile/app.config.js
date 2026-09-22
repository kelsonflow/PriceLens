const base = require("./app.json");

const plugins = [
  ...base.expo.plugins,
  "expo-apple-authentication",
  "@react-native-google-signin/google-signin"
];

module.exports = {
  expo: {
    ...base.expo,
    icon: "./assets/icon.png",
    plugins,
    updates: {
      url: "https://u.expo.dev/27c5c602-4c97-4244-bfae-b0416c11ccd0"
    },
    runtimeVersion: {
      policy: "appVersion"
    },
    ios: {
      ...base.expo.ios,
      googleServicesFile:
        process.env.GOOGLE_SERVICE_INFO_PLIST || "./GoogleService-Info.plist",
      usesAppleSignIn: true,
      buildNumber: process.env.IOS_BUILD_NUMBER || "1"
    },
    android: {
      ...base.expo.android,
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#5278E8"
      }
    },
    extra: {
      ...base.expo.extra,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || "27c5c602-4c97-4244-bfae-b0416c11ccd0"
      }
    }
  }
};
