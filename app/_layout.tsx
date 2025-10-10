import { useColorScheme } from '@/hooks/use-color-scheme';
import messaging from "@react-native-firebase/messaging";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from "react";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import 'react-native-reanimated';
import { AuthProvider } from "../contexts/AuthContext";
import { SocketProvider } from "../contexts/SocketContext";


export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();

  useEffect(() => {
      // --- 1. Request Notification Permissions ---
      console.log('pre request user permission');
      const requestUserPermission = async () => {
        console.log('Request user permission');
        if (Platform.OS === 'android') {
          console.log('run with android')
          // For Android 13+
          await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          );
        } else {
          // For iOS
          const authStatus = await messaging().requestPermission();
          const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
  
          if (enabled) {
            console.log('Authorization status:', authStatus);
          }
        }
      };
  
      requestUserPermission().catch(err => {
        console.log('ERR in requestUserPermission:', err);
      });
  
      // --- 3. Handle Foreground Notifications ---
      // This listener is triggered when a notification is received while the app is in the foreground.
      const unsubscribe = messaging().onMessage(async remoteMessage => {
          console.log("Foreground notification received layout:", remoteMessage);
          if (remoteMessage.notification || remoteMessage.data) {
            const title = remoteMessage.notification?.title || remoteMessage.data?.title || 'Notification';
            const body = remoteMessage.notification?.body || remoteMessage.data?.body || 'You have a new message.';
            const reserveId = remoteMessage.data?.reserve_id;
            
            Alert.alert(
              title,
              body,
              [
                {
                  text: "Open App",
                  onPress: () => {
                    console.log("Navigating to message screen, reserveId:", reserveId);
                    // Navigate to DetailMessageScreen
                    if (reserveId) {
                      router.push({
                        pathname: '/screens/DetailMessageScreen',
                        params: { roomId: String(reserveId), roomName: String(title)}
                      });
                    } else {
                      router.push('/screens/MessageScreen');
                    }
                  }
                }
              ]
            );
          }
      });
  
      // --- 4. Handle Background/Killed State Notifications ---
      // This listener is triggered when the user taps on a notification and the app
      // was in the background or killed state.
      messaging().onNotificationOpenedApp(remoteMessage => {
        console.log('Notification caused app to open from background state:', remoteMessage);
        const reserveId = remoteMessage.data?.reserve_id;
        const title = remoteMessage.data?.title || 'Message';
        
        // Navigate to DetailMessageScreen
        if (reserveId) {
          router.push({
            pathname: '/screens/DetailMessageScreen',
            params: { roomId: String(reserveId), roomName: String(title)}
          });
        } else {
          router.push('/screens/MessageScreen');
        }
      });
  
      // Check if the app was opened from a killed state by a notification
      messaging()
        .getInitialNotification()
        .then(remoteMessage => {
          if (remoteMessage) {
            console.log('Notification caused app to open from quit state:', remoteMessage);
            const reserveId = remoteMessage.data?.reserve_id;
            const title = remoteMessage.data?.title || 'Message';
            
            // Navigate to DetailMessageScreen
            if (reserveId) {
              router.push({
                pathname: '/screens/DetailMessageScreen',
                params: { roomId: reserveId, roomName: title}
              });
            } else {
              router.push('/screens/MessageScreen');
            }
          }
        });
  
      return unsubscribe;
    }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <SocketProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right'
            }}
          >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="screens/HomeScreen" options={{ headerShown: false }} />
        <Stack.Screen name="screens/LoginScreen" options={{ headerShown: false }} />
        <Stack.Screen name="screens/MessageScreen" options={{ headerShown: false }} />
        <Stack.Screen name="screens/DetailMessageScreen" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
