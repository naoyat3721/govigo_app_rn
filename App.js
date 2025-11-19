import notifee, { EventType } from '@notifee/react-native';
import messaging from "@react-native-firebase/messaging";
import { Slot, useRouter } from "expo-router";
import { useEffect } from "react";
import { Alert, PermissionsAndroid, Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./contexts/AuthContext";

export default function App() {
  const router = useRouter();
  console.log("App component start"); 
  useEffect(() => {
    // --- Set up Notifee foreground event handler ---
    const unsubscribeNotifee = notifee.onForegroundEvent(({ type, detail }) => {
      console.log('Notifee foreground event:', type, detail);
      
      if (type === EventType.PRESS) {
        console.log('User pressed notification in foreground:', detail.notification);
        const reserveId = detail.notification?.data?.reserve_id;
        
        // Navigate to message screen
        if (reserveId) {
          router.push(`/screens/MessageScreen?reserve_id=${reserveId}`);
        } else {
          router.push('/screens/MessageScreen');
        }
      }
    });

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

    // --- 2. Get FCM Token and Save to Server ---
    // This token is what your PHP script uses to send notifications
    messaging()
      .getToken()
      .then(token => {
        console.log("=".repeat(50));
        console.log("FCM Token:", token);
        console.log("=".repeat(50));
        // Show token in an alert so you can easily copy it
        Alert.alert(
          "FCM Token Ready",
          `Token: ${token.substring(0, 30)}...`,
          [
            {
              text: "Copy Full Token",
              onPress: () => console.log("Full Token:", token)
            },
            { text: "OK" }
          ]
        );
        // TODO: Send this token to your backend and save it in the `member` table
        // associated with the logged-in user. Your PHP script needs this.
      })
      .catch(error => {
        console.log("Error getting FCM token:", error);
      });

    // --- 3. Handle Foreground Notifications ---
    // This listener is triggered when a notification is received while the app is in the foreground.
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      console.log("Foreground notification received:", remoteMessage);
      if (remoteMessage.notification || remoteMessage.data) {
        const title = remoteMessage.notification?.title || remoteMessage.data?.title || 'Notification';
        const body = remoteMessage.notification?.body || remoteMessage.data?.body || 'You have a new message.';
        const reserveId = remoteMessage.data?.reserve_id;
        
        Alert.alert(
          title,
          body,
          [
            {
              text: "OK",
              onPress: () => {
                console.log("Navigating to message screen, reserveId:", reserveId);
                // Navigate to message screen
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
      console.log(
        'Notification caused app to open from background state:',
        remoteMessage,
      );
      // Navigate to message screen based on the data payload
      const reserveId = remoteMessage.data?.reserve_id;
      if (reserveId) {
        router.push(`/screens/MessageScreen?reserve_id=${reserveId}`);
      } else {
        router.push('/screens/MessageScreen');
      }
    });

    // Check if the app was opened from a killed state by a notification
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage,
          );
          // Navigate to message screen
          const reserveId = remoteMessage.data?.reserve_id;
          if (reserveId) {
            router.push(`/screens/MessageScreen?reserve_id=${reserveId}`);
          } else {
            router.push('/screens/MessageScreen');
          }
        }
      });

    return () => {
      unsubscribe();
      unsubscribeNotifee();
    };
  }, []);

  return (
    <AuthProvider>
      <SafeAreaProvider>
        <Slot />
      </SafeAreaProvider>
    </AuthProvider>
  );
}
