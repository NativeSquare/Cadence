import { ConfigContext, ExpoConfig } from "expo/config";
import { APP_NAME, APP_SLUG } from "@packages/shared/app";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return `com.nativesquare.${APP_SLUG}.dev`;
  }

  if (IS_PREVIEW) {
    return `com.nativesquare.${APP_SLUG}.preview`;
  }

  return `com.nativesquare.${APP_SLUG}`;
};

const getAppName = () => {
  if (IS_DEV) {
    return `${APP_NAME} (Dev)`;
  }

  if (IS_PREVIEW) {
    return `${APP_NAME} (Preview)`;
  }

  return APP_NAME;
};

export const getGoogleServicesJson = () => {
  if (IS_DEV) {
    return "./google-services-dev.json";
  }

  if (IS_PREVIEW) {
    return "./google-services-preview.json";
  }

  return "./google-services.json";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: getAppName(),
  slug: APP_SLUG,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: APP_SLUG,
  userInterfaceStyle: "light",
  newArchEnabled: true,
  ios: {
    supportsTablet: false,
    bundleIdentifier: getUniqueIdentifier(),
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
    icon: {
      light: "./assets/icons/ios-icon.png",
      dark: "./assets/icons/ios-icon.png",
      tinted: "./assets/icons/ios-icon.png",
    }
  },
  android: {
    package: getUniqueIdentifier(),
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    // googleServicesFile: getGoogleServicesJson(),
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
    bundler: "metro",
  },
  plugins: [
    [
      "expo-audio",
      {
        microphonePermission:
          "Cadence uses your microphone to transcribe what you say to your coach.",
      },
    ],
    [
      "expo-camera",
      {
        cameraPermission:
          "Cadence uses the camera so you can take a photo to set as your profile picture, attach to a message in your AI coach chat (for example a race bib or a hand-written workout), or include with feedback you send to our team.",
        recordAudioAndroid: false,
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "Cadence accesses your photo library so you can pick an image to set as your profile picture, attach to a message in your AI coach chat (for example a screenshot of a workout), or include with feedback you send to our team.",
        cameraPermission:
          "Cadence uses the camera so you can take a photo to set as your profile picture, attach to a message in your AI coach chat (for example a race bib or a hand-written workout), or include with feedback you send to our team.",
      },
    ],
    "expo-notifications",
    "expo-router",
    "expo-secure-store",
    "@react-native-community/datetimepicker",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    [
      "@kingstinct/react-native-healthkit",
      {
        NSHealthShareUsageDescription:
          "Cadence reads your workouts, sleep, heart rate, body metrics, daily activity, nutrition, and other health data to build your personalized training plan and track your progress.",
        NSHealthUpdateUsageDescription:
          "Cadence saves your training plan workouts to Apple Health.",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  owner: "nativesquare-expo",
  extra: {
    router: {},
    eas: {
      projectId: "14bdb29c-2d76-42b4-8a20-d782d1d9d50d"
    }
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    url: "https://u.expo.dev/14bdb29c-2d76-42b4-8a20-d782d1d9d50d"
  }
});
