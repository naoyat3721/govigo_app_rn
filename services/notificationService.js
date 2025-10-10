import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import axiosClient from '../api/axiosClient';


async function requestUserPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Authorization status:', authStatus);
    getFCMToken();
  }
}

async function getFCMToken() {
    try {
        const response = await axiosClient.get('/getFcmToken.php');
        console.log('reponse getFcmToken', response);
        if (response && response.success) {
          console.log('get token fcm from db');
          return response.data.token_fcm;
        }
        const token = await messaging().getToken();
        console.log("FCM Token:", token);
        // Save the token to your server
        const formData = new FormData();
        formData.append('token', token);
        console.log('Sending token to server:', formData);
        await axiosClient.post('/saveToken.php', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        console.log('Token saved to server successfully.');
    } catch (error) {
        console.log('Failed to get or save FCM token:', error);
        console.log('Error details:', {
            message: error.message,
            status: error.status,
            data: error.data
        });
        const token = await messaging().getToken();
        console.log("FCM Token:", token);
        // Save the token to your server
        const formData = new FormData();
        formData.append('token', token);
        console.log('Sending token to server:', formData);
        await axiosClient.post('/saveToken.php', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        console.log('Token saved to server successfully.');
    }
    return null;
}

function setupNotificationListeners() {
    messaging().onNotificationOpenedApp(remoteMessage => {
        console.log(
          'Notification caused app to open from background state:',
          remoteMessage.notification,
        );
        // navigation.navigate(remoteMessage.data.type);
    });

    // Check whether an initial notification is available
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage.notification,
          );
        //   setInitialRoute(remoteMessage.data.type); // e.g. "Settings"
        }
      });

    messaging().onMessage(async remoteMessage => {
        console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));

        // Display a local notification for foreground messages
        Alert.alert(
            remoteMessage.notification?.title || 'Notification',
            remoteMessage.notification?.body || 'You have a new message.'
        );
    });

    return () => {
        // No explicit cleanup needed for these listeners with v18+
    };
}

export { getFCMToken, requestUserPermission, setupNotificationListeners };

