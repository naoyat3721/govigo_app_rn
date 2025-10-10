import 'dotenv/config';

export default ({ config }) => {
  return {
    ...config,
    expo: {
      name: process.env.APP_NAME || 'GovigolfExpo',
      slug: 'GovigolfExpo',
      scheme: process.env.APP_SCHEME || 'govigolfexpo',
      version: '1.0.0',
      extra: {
        apiUrl: process.env.API_URL,
        webUrl: process.env.WEB_URL,
        downloadUrlMessage: process.env.DOWNLOAD_URL_MESSAGE,
        socketUrl: process.env.SOCKET_URL,
      },
      android: {
        package: 'demo.govigolfapp',
        adaptiveIcon: {
          backgroundColor: '#E6F4FE',
          foregroundImage: './assets/images/logo_short.png',
          backgroundImage: './assets/images/logo_short.png',
          monochromeImage: './assets/images/logo_short.png',
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        googleServicesFile: "./google-services.json",
      },
      ios: {
        bundleIdentifier: 'com.anhphan17.GovigolfExpo',
        supportsTablet: true,
        googleServicesFile: './GoogleService-Info.plist' // <== thêm dòng này
      },
      plugins: [
        'expo-router',
        [
          'expo-build-properties',
          {
            android: {
              compileSdkVersion: 35,
              targetSdkVersion: 35,
              minSdkVersion: 24,
              buildToolsVersion: '35.0.0',
              kotlinVersion: '2.2.20',
              ndkVersion: '26.1.10909125',
            },
          },
        ],
        [
          'expo-splash-screen',
          {
            image: './assets/images/splash-icon.png',
            imageWidth: 200,
            resizeMode: 'contain',
            backgroundColor: '#ffffff',
            dark: { backgroundColor: '#000000' },
          },
        ],
        '@react-native-firebase/app',
        '@react-native-firebase/messaging',
        '@notifee/react-native',
        './plugins/add-maven-repos', // plugin custom để thêm Notifee Maven
      ],
      experiments: {
        typedRoutes: true,
        reactCompiler: true,
      },
    },
  };
};
