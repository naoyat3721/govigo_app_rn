import { Ionicons } from '@expo/vector-icons';
import { useRoute } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { useWebView } from '../contexts/WebViewContext';

// Text-based icon component
const TextIcon = ({ name, size = 20, color = '#000', style = {} }) => {
  // Map of icon names to unicode text symbols
  const textIcons = {
    'menu-outline': '☰',
    'chevron-up-outline': '▲',
    'chevron-down-outline': '▼',
    'home-outline': '⌂',
    'log-in-outline': '↪',
    'document-text-outline': '📄',
    'person-outline': '👤',
    'settings-outline': '⚙️',
    'arrow-back-outline': '←',
    'notifications-outline': '�',
    'chatbubble-outline': '�',
  };

  return (
    <Text style={[{ fontSize: size, color }, style]}>
      {textIcons[name] || '•'}
    </Text>
  );
};

const AppHeader = ({ title, showMenu = true, showBackButton = false, onBack, backRoute }) => {
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const { hasNewMessage, clearNewMessage } = useSocket();
  const { currentLanguage, changeLanguage, languages, webViewUrl } = useWebView();

  const router = useRouter();
  const route = useRoute();
  const currentScreen = route.name;
  const [languageMenuVisible, setLanguageMenuVisible] = useState(false);
  const [mainMenuVisible, setMainMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const menuFadeAnim = useRef(new Animated.Value(0)).current;

  const toggleLanguageMenu = () => {
    setLanguageMenuVisible(!languageMenuVisible);
  };

  const toggleMainMenu = () => {
    setMainMenuVisible(!mainMenuVisible);
  };

  useEffect(() => {
    if (languageMenuVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true
      }).start();
    }
  }, [languageMenuVisible, fadeAnim]);

  useEffect(() => {
    if (mainMenuVisible) {
      Animated.timing(menuFadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true
      }).start();
    } else {
      Animated.timing(menuFadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true
      }).start();
    }
  }, [mainMenuVisible, menuFadeAnim]);
  
  // Close menu when route changes
  useEffect(() => {
    setLanguageMenuVisible(false);
  }, [route]);

  const handleLanguageSelect = (language) => {
    changeLanguage(language.code);
    setLanguageMenuVisible(false);
  };

  const menuItems = [
    { label: 'Golf course reservations', path: '/golf_club_search.php', tab: 'search' },
    { label: 'Golf fees', path: '/golf_club_price_list.php' },
    { label: 'Transfer fee', path: '/shuttle_prices.php' },
    { label: 'Tour application', path: '/apply_golf_tour.php' },
    { label: 'News', path: '/#news' },
    { label: 'Member information', path: '/member/profile_confirmation.php', tab: 'account' },
    { label: 'Favorite golf course', path: '/golf_club_price_list.php?favoriteFlag=1', tab: 'favorites' },
    { label: 'Golf course reservation history', path: '/member/reserve_history.php', tab: 'booking' },
    { label: 'Contact', path: '/contact.php' }
  ];

  const handleMenuItemClick = (item) => {
    setMainMenuVisible(false);
    
    // If menu item has a corresponding tab, use tab navigation
    if (item.tab) {
      router.replace({ 
        pathname: '/screens/MainScreen', 
        params: { tab: item.tab } 
      });
    } else {
      // Otherwise use custom URL
      const fullUrl = `${webViewUrl}${item.path}`;
      router.replace({ 
        pathname: '/screens/MainScreen', 
        params: { url: fullUrl } 
      });
    }
  };

  const handleLogout = () => {
    setMainMenuVisible(false);
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/screens/LoginScreen');
          }
        }
      ]
    );
  };
  
  // Xử lý khi người dùng bấm nút back
  const handleBack = () => {
    // Nếu có hàm onBack được truyền vào thì gọi nó
    if (onBack) {
      onBack();
    } 
    // Nếu có backRoute được truyền vào thì điều hướng tới đó
    else if (backRoute) {
      // Sử dụng replace thay vì push để làm mới trang khi quay lại
      router.replace(backRoute);
    } 
    // Mặc định là quay về trang chủ
    else {
      router.replace('/screens/HomeScreen');
    }
  };

  return (
    <View style={styles.headerContainer}>
      <StatusBar backgroundColor="#376439" barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Image
            source={require('../assets/images/main-logo.png')}
            style={styles.headerImage}
          />
        </View>
        {showMenu && (
          <View style={styles.menuContainer}>
            {isAuthenticated && (
              <>
                <TouchableOpacity 
                  style={styles.notificationButton}
                  onPress={() => {
                    clearNewMessage();
                    router.push('/screens/MessageScreen');
                  }}
                >
                  <View style={styles.notificationIconContainer}>
                    <Ionicons name="chatbubble-outline" size={22} color="#FFFFFF" />
                    {hasNewMessage && <View style={styles.notificationDot} />}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.menuButton}
                  onPress={toggleMainMenu}
                >
                  <Ionicons name="menu-outline" size={28} color="#FFFFFF" />
                </TouchableOpacity>
              </>
            )}
            {/* <TouchableOpacity 
              style={styles.languageButton}
              onPress={toggleLanguageMenu}
            >
              <Text style={styles.languageButtonText}>
                {currentLanguage.toUpperCase()}
              </Text>
              <TextIcon 
                name={languageMenuVisible ? "chevron-up-outline" : "chevron-down-outline"} 
                size={16} 
                color="#FFFFFF" 
                style={styles.chevron} 
              />
            </TouchableOpacity> */}
            
            <Modal
              transparent={true}
              visible={languageMenuVisible}
              animationType="fade"
              onRequestClose={() => setLanguageMenuVisible(false)}
            >
              <Pressable 
                style={styles.modalOverlay} 
                onPress={() => setLanguageMenuVisible(false)}
              >
                <Animated.View 
                  style={[
                    styles.dropdownMenu,
                    { opacity: fadeAnim },
                    { transform: [{ translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0]
                    })}] }
                  ]}
                  onStartShouldSetResponder={() => true}
                  onTouchEnd={(e) => e.stopPropagation()}
                >
                  {languages.map((language) => (
                    <TouchableOpacity 
                      key={language.code}
                      style={[
                        styles.dropdownItem, 
                        currentLanguage === language.code && styles.activeDropdownItem
                      ]} 
                      onPress={() => handleLanguageSelect(language)}
                    >
                      <Text style={[
                        styles.languageItemText,
                        currentLanguage === language.code && styles.activeItemText
                      ]}>
                        {language.label}
                      </Text>
                      {currentLanguage === language.code && (
                        <Text style={styles.checkmark}>✓</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </Animated.View>
              </Pressable>
            </Modal>

            {/* Main Navigation Menu */}
            <Modal
              transparent={true}
              visible={mainMenuVisible}
              animationType="fade"
              onRequestClose={() => setMainMenuVisible(false)}
            >
              <Pressable 
                style={styles.modalOverlay} 
                onPress={() => setMainMenuVisible(false)}
              >
                <Animated.View 
                  style={[
                    styles.mainMenu,
                    { opacity: menuFadeAnim },
                    { transform: [{ translateX: menuFadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [300, 0]
                    })}] }
                  ]}
                  onStartShouldSetResponder={() => true}
                  onTouchEnd={(e) => e.stopPropagation()}
                >
                  <View style={styles.mainMenuHeader}>
                    <Text style={styles.mainMenuTitle}>Menu</Text>
                    <TouchableOpacity onPress={() => setMainMenuVisible(false)}>
                      <Ionicons name="close-outline" size={28} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                  
                  {menuItems.map((item, index) => (
                    <TouchableOpacity 
                      key={index}
                      style={styles.mainMenuItem} 
                      onPress={() => handleMenuItemClick(item)}
                    >
                      <Text style={styles.mainMenuItemText}>{item.label}</Text>
                      <Ionicons name="chevron-forward-outline" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                  ))}
                  
                  <View style={styles.menuSeparator} />
                  
                  <TouchableOpacity 
                    style={[styles.mainMenuItem, styles.logoutMenuItem]} 
                    onPress={handleLogout}
                  >
                    <Text style={styles.logoutText}>Logout</Text>
                    <Ionicons name="log-out-outline" size={20} color="#FFD700" />
                  </TouchableOpacity>
                </Animated.View>
              </Pressable>
            </Modal>
          </View>
        )}
      </View>
    </View>
  );
};

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#376439',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 1000,
  },
  header: {
    height: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    position: 'relative',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    width: '30%',
    zIndex: 1,
  },
  backButton: {
    padding: 8,
    zIndex: 1,
  },
  logoContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  menuContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '30%',
    zIndex: 1,
  },
  notificationButton: {
    marginRight: 12,
  },
  notificationIconContainer: {
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF4040',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  headerImage: {
    width: 120,
    height: 40,
    resizeMode: 'contain',
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 60,
    justifyContent: 'center',
  },
  languageButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
    marginRight: 3,
  },
  chevron: {
    marginLeft: 3,
  },
  hamburgerIcon: {
    width: 18,
    height: 14,
    justifyContent: 'space-between',
    marginRight: 5,
  },
  hamburgerLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 70,
    right: 15,
    width: 160,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    zIndex: 1001,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activeDropdownItem: {
    backgroundColor: '#E7F3E8',
  },
  languageItemText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  activeItemText: {
    color: '#376439',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 18,
    color: '#376439',
    fontWeight: 'bold',
  },
  menuSeparator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
  },
  menuSeparatorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
    textTransform: 'uppercase',
  },
  menuItem: {
    marginLeft: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  activeMenuItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  menuText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  menuButton: {
    padding: 8,
    marginLeft: 12,
  },
  mainMenu: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#376439',
    paddingTop: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  mainMenuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    marginBottom: 10,
  },
  mainMenuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  mainMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  mainMenuItemText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  logoutMenuItem: {
    borderBottomWidth: 0,
    marginTop: 5,
  },
  logoutText: {
    fontSize: 16,
    color: '#FFD700',
    fontWeight: '600',
  },
});

export default AppHeader;