import notifee, { AndroidImportance, EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { Linking } from 'react-native';

// --- Set up Notifee event handlers FIRST ---
// Handle notification events (tap, dismiss, etc.)
notifee.onBackgroundEvent(async ({ type, detail }) => {
  console.log('Notifee background event:', type, detail);
  
  if (type === EventType.PRESS) {
    console.log('User pressed notification:', detail.notification);
    const reserveId = detail.notification?.data?.reserve_id;
    
    // Create deep link to navigate to message screen
    if (reserveId) {
      const url = `govigolf://screens/MessageScreen?reserve_id=${reserveId}`;
      Linking.openURL(url).catch(err => console.log('Error opening deep link:', err));
    } else {
      const url = `govigolf://screens/MessageScreen`;
      Linking.openURL(url).catch(err => console.log('Error opening deep link:', err));
    }
  }
});

// --- Register Background Message Handler ---
// This MUST be at the top level and registered before anything else
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Message handled in the background!', remoteMessage);

  // IMPORTANT: You cannot show a JavaScript `Alert` from the background.
  // Instead, you must create a local system notification.
  
  // 1. Check if the message has a notification payload
  if (remoteMessage.notification) {
    console.log('Notification was displayed automatically by the system.');
  }

  // 2. If you send DATA-ONLY messages, you MUST create a local notification
  if (remoteMessage.data) {
    await onDisplayNotification(remoteMessage);
  }
});

async function onDisplayNotification(remoteMessage) {
  // Request permissions (required for iOS)
  await notifee.requestPermission();

  // Create a channel (required for Android)
  const channelId = await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });

  // Display a notification with action data
  await notifee.displayNotification({
    title: remoteMessage.data.title || 'Notification',
    body: remoteMessage.data.body || 'You have a new message.',
    data: remoteMessage.data, // Pass all data so it's available when tapped
    android: {
      channelId,
      pressAction: {
        id: 'default',
      },
      importance: AndroidImportance.HIGH,
    },
  });
}

// Import App and register AFTER setting up the background handler
import 'expo-router/entry';

