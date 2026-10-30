const fs = require("node:fs");
const path = require("node:path");

const base = {
  expo: {
    name: "PriceLens",
    slug: "pricelens",
    scheme: "pricelens",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    backgroundColor: "#f7f5f0",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.kelsonflow.pricelens",
      infoPlist: {
        NSCameraUsageDescription: "PriceLens uses the camera to identify products and compare prices.",
        NSPhotoLibraryUsageDescription: "PriceLens uses selected photos to identify products and compare prices.",
        ITSAppUsesNonExemptEncryption: false
      }
    },
    android: {
      package: "com.kelsonflow.pricelens",
      blockedPermissions: ["android.permission.RECORD_AUDIO"],
      adaptiveIcon: { backgroundColor: "#111827" }
    },
    plugins: [
      "expo-router",
      "expo-image-picker",
      "expo-font",
      ["expo-splash-screen", {
        image: "./assets/splash-icon.png",
        imageWidth: 240,
        resizeMode: "contain",
        backgroundColor: "#5278E8",
        dark: {
          image: "./assets/splash-icon.png",
          backgroundColor: "#111827"
        }
      }]
    ]
  }
};

const androidGoogleServicesFile = process.env.GOOGLE_SERVICES_JSON || "./google-services.json";
const androidGoogleServices = readGoogleServices(androidGoogleServicesFile);

const plugins = [
  ...base.expo.plugins,
  "expo-apple-authentication",
  "@react-native-google-signin/google-signin",
  ["expo-notifications", { icon: "./assets/adaptive-icon.png", color: "#5278E8", defaultChannel: "price-alerts" }]
];

module.exports = {
  expo: {
    ...base.expo,
    scheme: [base.expo.scheme, "rc-852c3feb20"],
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
      googleServicesFile: androidGoogleServicesFile,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon-safe.png",
        backgroundColor: "#5278E8"
      }
    },
    extra: {
      ...base.expo.extra,
      firebase: androidGoogleServices?.firebase,
      googleWebClientId: androidGoogleServices?.webClientId,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || "27c5c602-4c97-4244-bfae-b0416c11ccd0"
      }
    }
  }
};

function readGoogleServices(file) {
  try {
    const absolute = path.isAbsolute(file) ? file : path.join(__dirname, file);
    const config = JSON.parse(fs.readFileSync(absolute, "utf8"));
    const packageName = base.expo.android.package;
    const client = config.client?.find(
      (item) => item.client_info?.android_client_info?.package_name === packageName
    );
    const apiKey = client?.api_key?.[0]?.current_key;
    const projectId = config.project_info?.project_id;
    return {
      firebase: {
        apiKey,
        authDomain: projectId ? `${projectId}.firebaseapp.com` : undefined,
        projectId,
        appId: client?.client_info?.mobilesdk_app_id,
        messagingSenderId: config.project_info?.project_number
      },
      webClientId: client?.oauth_client?.find((item) => item.client_type === 3)?.client_id
    };
  } catch {
    return undefined;
  }
}
