import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import AppHeader from '../../components/AppHeader';
import { useAuth } from '../../contexts/AuthContext';
import { getToken } from '../../services/authService';

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState({});
  const webviewRef = useRef(null);
  const router = useRouter();
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  
  // Get WEB_URL from environment variables
  const WEB_URL = Constants.expoConfig?.extra?.webUrl;
  const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:9000/api';
  console.log('WEB_URL:', WEB_URL);
  
  // Check authentication status and set up the WebView
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        // Redirect to login if not authenticated
        router.replace('/screens/LoginScreen');
      } else {
        // Prepare webview with autologin
        prepareWebView();
      }
    }
  }, [isAuthenticated, authLoading]);
  
  const prepareWebView = async () => {
    try {
      setIsLoading(true);
      
      // Similar to Flutter implementation, try to get token and set up autologin
      const token = await getToken();
      const autoLoginUrl = `${API_URL}/autologin.php`;
      
      // Set URL and headers
      setUrl(autoLoginUrl);
      
      if (token) {
        setHeaders({
          'Authorization': `Bearer ${token}`
        });
      }
      
      console.log('WebView configured with autologin URL:', autoLoginUrl);
      console.log('Headers:', headers);
      
    } catch (error) {
      console.error('Error preparing WebView:', error);
      setUrl(WEB_URL || ''); // Fallback to regular URL if autologin fails
    }
  };

  const hideHeaderFooter = `
    (function() {
      function hiddenHeaderFooter() {
        const header = document.querySelector('header');
        const footer = document.querySelector('.copyright');
        const footerElem = document.querySelector('footer');
        
        if (header) header.style.display = 'none';
        if (footer) footer.style.display = 'none';
        if (footerElem) footerElem.style.display = 'none';
        
        document.body.style.paddingTop = '0';
        document.body.style.paddingBottom = '0';
        
        // Add additional styling similar to Flutter implementation
        const main = document.querySelector('main');
        if (main) main.style.marginBottom = '30px';
      }
      hiddenHeaderFooter();
    })();
    true;
  `;

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader title="Home" />
      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#000" />
        </View>
      )}
      {url ? (
        <WebView
          source={{ 
            uri: url,
            headers: headers
          }}
          injectedJavaScript={hideHeaderFooter}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => {
            setIsLoading(false);
            webviewRef.current?.injectJavaScript(hideHeaderFooter);
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          style={{ opacity: isLoading ? 0 : 1 }}
          ref={webviewRef}
        />
      ) : (
        <View style={styles.container}>
          <Text style={styles.text}>Loading...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  text: { fontSize: 22, fontWeight: 'bold' },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff'
  }
});