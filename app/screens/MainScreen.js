import { Ionicons } from '@expo/vector-icons';
import CookieManager from '@react-native-cookies/cookies';
import Constants from 'expo-constants';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import AppHeader from '../../components/AppHeader';
import BottomTabBar from '../../components/BottomTabBar';
import { useAuth } from '../../contexts/AuthContext';
import { useWebView } from '../../contexts/WebViewContext';
import { getSessionInfo, getToken } from '../../services/authService';

export default function MainScreen() {
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(params.tab || 'home');
  const [customUrl, setCustomUrl] = useState(params.url || null);
  const [url, setUrl] = useState('');
  const webviewRef = useRef(null);
  const router = useRouter();
  const { isAuthenticated, logout, loading: authLoading } = useAuth();
  const { webViewUrl } = useWebView();

  const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:9000/api';

  // Define tab configurations
  const tabs = {
    home: { path: '/', icon: 'home', label: 'Home' },
    search: { path: '/golf_club_search.php', icon: 'search-outline', label: 'Search' },
    favorites: { path: '/golf_club_price_list.php?favoriteFlag=1', icon: 'heart-outline', label: 'Favorites' },
    booking: { path: '/member/reserve_history.php', icon: 'calendar-outline', label: 'Booking' },
    account: { path: '/member/profile_confirmation.php', icon: 'person', label: 'Account' },
  };

  // Check authentication
  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.replace('/screens/LoginScreen');
      } else {
        prepareWebView();
      }
    }
  }, [isAuthenticated, authLoading]);

  // Handle tab parameter from navigation
  useEffect(() => {
    if (params.tab && params.tab !== currentTab) {
      setCurrentTab(params.tab);
      setCustomUrl(null); // Clear custom URL when switching tabs
    }
  }, [params.tab]);

  // Handle custom URL parameter from menu
  useEffect(() => {
    if (params.url && params.url !== customUrl) {
      setCustomUrl(params.url);
    }
  }, [params.url]);

  // Reload when language, tab, or custom URL changes
  useEffect(() => {
    if (isAuthenticated && webViewUrl) {
      prepareWebView();
    }
  }, [webViewUrl, currentTab, customUrl]);

  const prepareWebView = async () => {
    try {
      setIsLoading(true);

      const token = await getToken();
      if (!token) {
        throw new Error('No auth token found');
      }

      // Get stored session info from login
      const sessionInfo = await getSessionInfo();
      console.log('Session info from storage:', sessionInfo);

      if (sessionInfo && sessionInfo.session_id) {
        const { session_id, session_name, cookie_domain } = sessionInfo;
        console.log('session info', sessionInfo)
        
        const cookieData = {
          name: session_name || 'PHPSESSID',
          value: session_id,
          domain: cookie_domain || '.dev.govigolf.com',
          path: '/',
          expires: new Date(Date.now() + 86400000).toUTCString(), // 24 hours
        };

        console.log('Injecting cookie:', cookieData);

        // Determine domains based on environment
        let domains = [];
        if (cookie_domain.includes('dev.govigolf.com')) {
          domains = ['dev.govigolf.com', 'en.dev.govigolf.com', 'vn.dev.govigolf.com'];
        } else if (cookie_domain.includes('govigolf.com')) {
          domains = ['govigolf.com', 'en.govigolf.com', 'vn.govigolf.com'];
        }

        // Set cookie for all language domains
        for (const domain of domains) {
          const url = `https://${domain}`;
          console.log('domain', domain, cookieData)
          try {
            await CookieManager.set(url, cookieData);
            console.log(`✓ Cookie set for ${domain}`);
          } catch (error) {
            console.error(`✗ Failed to set cookie for ${domain}:`, error);
          }
           CookieManager.get(url).then(cookie => console.log("cookies:", cookie));

        }
       
        // Flush cookies to ensure they're saved
        try {
          await CookieManager.flush();
          console.log('✓ Cookies flushed to storage');
        } catch (error) {
          console.warn('⚠️ Could not flush cookies:', error.message);
        }

        console.log('✓ Session cookies injected');
      } else {
        console.warn('⚠️ No session info available - cookies not injected');
      }

      // Load custom URL from menu if provided, otherwise use current tab's URL
      const newUrl = customUrl || `${webViewUrl}${tabs[currentTab].path}`;
      setUrl(newUrl);

      console.log('WebView loading:', newUrl);
      setIsLoading(false);

    } catch (error) {
      console.error('Error preparing WebView:', error);
      const fallbackUrl = customUrl || `${webViewUrl}${tabs[currentTab].path}`;
      setUrl(fallbackUrl);
      setIsLoading(false);
    }
  };

  const handleTabChange = (tabKey) => {
    setCurrentTab(tabKey);
    setCustomUrl(null); // Clear custom URL when switching tabs
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/screens/LoginScreen');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
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
        
        const main = document.querySelector('main');
        if (main) main.style.marginBottom = '30px';
        
        console.log('=== WEBVIEW DEBUG ===');
        console.log('Current URL:', window.location.href);
        console.log('Cookies:', document.cookie);
      }
      hiddenHeaderFooter();
    })();
    true;
  `;

  if (authLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <AppHeader title="Loading..." />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#376439" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader title={tabs[currentTab].label} />
      
      {isLoading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#376439" />
        </View>
      )}
      
      {url ? (
        <WebView
          key={url}
          source={{ uri: url }}
          injectedJavaScript={hideHeaderFooter}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => {
            setIsLoading(false);
            webviewRef.current?.injectJavaScript(hideHeaderFooter);
          }}
          onMessage={(event) => {
            console.log('WebView message:', event.nativeEvent.data);
          }}
          onConsoleMessage={(event) => {
            console.log('WebView console:', event.nativeEvent.message);
          }}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          incognito={false}
          cacheEnabled={true}
          style={{ opacity: isLoading ? 0 : 1, flex: 1 }}
          ref={webviewRef}
        />
      ) : null}

      {/* Logout Button - only show on account tab */}
      {currentTab === 'account' && (
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      )}
      
      <BottomTabBar currentScreen="main" currentTab={currentTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  logoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF3B30',
    marginHorizontal: 20,
    marginVertical: 10,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF3B30',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});
