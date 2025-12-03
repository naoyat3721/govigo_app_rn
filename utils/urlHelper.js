import * as Clipboard from 'expo-clipboard';
import { Alert, Linking, Share } from 'react-native';

const urlHelper = {
  /**
   * Copy a URL to the clipboard
   * @param {string} url - The URL to copy
   */
  copyToClipboard: async (url) => {
    try {
      await Clipboard.setStringAsync(url);
      Alert.alert('Success', 'URL copied to clipboard');
    } catch (error) {
      console.log('Failed to copy URL:', error);
      Alert.alert('Error', 'Failed to copy URL to clipboard');
    }
  },

  /**
   * Open a URL in the browser
   * @param {string} url - The URL to open
   */
  openInBrowser: async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open URL: ${url}`);
      }
    } catch (error) {
      console.log('Failed to open URL:', error);
      Alert.alert('Error', 'Failed to open URL');
    }
  },

  /**
   * Share a URL using the native share dialog
   * @param {string} url - The URL to share
   * @param {string} title - Optional title for the share dialog
   */
  shareUrl: async (url, title = 'Share URL') => {
    try {
      await Share.share({
        message: url,
        title: title,
      });
    } catch (error) {
      console.log('Failed to share URL:', error);
      Alert.alert('Error', 'Failed to share URL');
    }
  },

  /**
   * Show a dialog with options to handle a URL
   * @param {Object} options - Dialog options
   * @param {string} options.url - The URL to handle
   * @param {string} options.title - Dialog title
   */
  showUrlDialog: (url, { title = 'URL Options' } = {}) => {
    Alert.alert(
      title,
      url,
      [
        {
          text: 'Copy URL',
          onPress: () => urlHelper.copyToClipboard(url),
        },
        {
          text: 'Open in Browser',
          onPress: () => urlHelper.openInBrowser(url),
        },
        {
          text: 'Share',
          onPress: () => urlHelper.shareUrl(url, title),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  },
};

export default urlHelper;