import { Ionicons } from '@expo/vector-icons';
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
import { getToken } from '../../services/authService';

export default function MainScreen() {
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(params.tab || 'home');
  const [customUrl, setCustomUrl] = useState(params.url || null);
  const [url, setUrl] = useState('');
  const isLoggingOutRef = useRef(false);
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

      // Extract current domain from webViewUrl
      const currentDomain = webViewUrl.replace('https://', '').replace('http://', '');
      console.log('Current language domain:', currentDomain);

      // Call autologin API for the current language domain to set session cookie
      const autologinUrl = `${webViewUrl}/api/autologin.php`;
      console.log(`Calling autologin API: ${autologinUrl}`);

      try {
        const response = await fetch(autologinUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const result = await response.json();
        
        if (result.success) {
          console.log(`✓ Autologin successful for ${currentDomain}`);
          console.log('Session info:', result.session);
        } else {
          console.warn(`⚠️ Autologin failed for ${currentDomain}:`, result.message);
        }
      } catch (error) {
        console.log(`✗ Autologin API error for ${currentDomain}:`, error);
      }

      // Load custom URL from menu if provided, otherwise use current tab's URL
      const newUrl = customUrl || `${webViewUrl}${tabs[currentTab].path}`;
      setUrl(newUrl);

      console.log('WebView loading:', newUrl);
      setIsLoading(false);

    } catch (error) {
      console.log('Error preparing WebView:', error);
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
              console.log('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Handle navigation state changes to detect login redirects
  const handleNavigationStateChange = async (navState) => {
    const { url: currentUrl } = navState;
    console.log('WebView navigated to:', currentUrl);
    
    // Check if already logging out to prevent loop
    if (isLoggingOutRef.current) {
      console.log('Already logging out - ignoring redirect');
      return;
    }
    
    // Check if redirected to login page (session expired)
    if (currentUrl && (currentUrl.includes('/login_form.php') || currentUrl.includes('/login.php'))) {
      console.warn('⚠️ Redirected to login page - session expired or invalid');
      
      // Set flag to prevent multiple logout attempts
      isLoggingOutRef.current = true;
      
      // Logout and redirect directly without alert
      try {
        console.log('Auto-logging out user...');
        await logout();
        router.replace('/screens/LoginScreen');
      } catch (error) {
        console.log('Auto-logout error:', error);
        // Reset flag if logout fails
        isLoggingOutRef.current = false;
      }
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
          onLoadEnd={(event) => {
            setIsLoading(false);
            webviewRef.current?.injectJavaScript(hideHeaderFooter);
          }}
          onNavigationStateChange={handleNavigationStateChange}
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
