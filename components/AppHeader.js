import { useRoute } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
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
    'notifications-outline': '🔔',
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

  const router = useRouter();
  const route = useRoute();
  const currentScreen = route.name;
  const [menuVisible, setMenuVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  useEffect(() => {
    if (menuVisible) {
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
  }, [menuVisible, fadeAnim]);
  
  // Close menu when route changes
  useEffect(() => {
    setMenuVisible(false);
  }, [route]);

  const navigateToHome = () => {
    setMenuVisible(false);
    router.push('/screens/HomeScreen');
  };

  const navigateToMessage = () => {
    setMenuVisible(false);
    router.push('/screens/MessageScreen');
  }

  const navigateToLogin = () => {
    setMenuVisible(false);
    router.push('/screens/LoginScreen');
  };

  
  const navigateToProfile = () => {
    setMenuVisible(false);
    alert('Profile screen is coming soon!');
    // Would navigate to Profile screen if it existed
  };
  
  const navigateToSettings = () => {
    setMenuVisible(false);
    alert('Settings screen is coming soon!');
    // Would navigate to Settings screen if it existed
  };
  
  const handleLogout = async () => {
    setMenuVisible(false);
    await logout();
    router.replace('/screens/LoginScreen');
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
        {showBackButton ? (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <TextIcon name="arrow-back-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <Text style={styles.headerTitle}>{title}</Text>
        )}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/logo_short.png')}
            style={styles.headerImage}
          />
        </View>
        {showMenu && (
          <View style={styles.menuContainer}>
            {isAuthenticated && (
              <TouchableOpacity 
                style={styles.notificationButton}
                onPress={() => {
                  clearNewMessage();
                  navigateToMessage();
                }}
              >
                <View style={styles.notificationIconContainer}>
                  <TextIcon name="notifications-outline" size={22} color="#FFFFFF" />
                  {hasNewMessage && <View style={styles.notificationDot} />}
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={toggleMenu}
            >
              <TextIcon name="menu-outline" size={20} color="#FFFFFF" />
              <Text style={styles.menuButtonText}>Menu</Text>
              <TextIcon 
                name={menuVisible ? "chevron-up-outline" : "chevron-down-outline"} 
                size={16} 
                color="#FFFFFF" 
                style={styles.chevron} 
              />
            </TouchableOpacity>
            
            <Modal
              transparent={true}
              visible={menuVisible}
              animationType="fade"
              onRequestClose={() => setMenuVisible(false)}
            >
              <Pressable 
                style={styles.modalOverlay} 
                onPress={() => setMenuVisible(false)}
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
                  // This prevents touches on the menu from closing the modal
                  onStartShouldSetResponder={() => true}
                  onTouchEnd={(e) => e.stopPropagation()}
                >
                  {isAuthenticated ? (
                    <>
                      <TouchableOpacity 
                        style={[
                          styles.dropdownItem, 
                          currentScreen === 'Home' && styles.activeDropdownItem
                        ]} 
                        onPress={navigateToHome}
                      >
                        <TextIcon 
                          name="home-outline" 
                          size={20} 
                          color={currentScreen === 'Home' ? '#376439' : '#555'} 
                        />
                        <Text style={[
                          styles.dropdownItemText,
                          currentScreen === 'Home' && styles.activeItemText
                        ]}>Home</Text>
                      </TouchableOpacity>
                      
                      <View style={styles.menuSeparator}>
                        <Text style={styles.menuSeparatorText}>User</Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.dropdownItem} 
                        onPress={navigateToProfile}
                      >
                        <TextIcon 
                          name="person-outline" 
                          size={20} 
                          color="#555" 
                        />
                        <Text style={styles.dropdownItemText}>Profile</Text>
                      </TouchableOpacity>

                      <TouchableOpacity 
                        style={styles.dropdownItem} 
                        onPress={navigateToMessage}
                      >
                        <TextIcon 
                          name="document-text-outline" 
                          size={20} 
                          color="#555" 
                        />
                        <Text style={styles.dropdownItemText}>Message</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.dropdownItem} 
                        onPress={navigateToSettings}
                      >
                        <TextIcon 
                          name="settings-outline" 
                          size={20} 
                          color="#555" 
                        />
                        <Text style={styles.dropdownItemText}>Settings</Text>
                      </TouchableOpacity>
                      
                      <View style={styles.menuSeparator}>
                        <Text style={styles.menuSeparatorText}>Account</Text>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.dropdownItem} 
                        onPress={handleLogout}
                      >
                        <TextIcon 
                          name="log-in-outline" 
                          size={20} 
                          color="#555" 
                        />
                        <Text style={styles.dropdownItemText}>Logout</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity 
                      style={[
                        styles.dropdownItem, 
                        currentScreen === 'Login' && styles.activeDropdownItem
                      ]} 
                      onPress={navigateToLogin}
                    >
                      <TextIcon 
                        name="log-in-outline" 
                        size={20} 
                        color={currentScreen === 'Login' ? '#376439' : '#555'} 
                      />
                      <Text style={[
                        styles.dropdownItemText,
                        currentScreen === 'Login' && styles.activeItemText
                      ]}>Login</Text>
                    </TouchableOpacity>
                  )}
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
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  menuButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 5,
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
    width: screenWidth * 0.5, // 50% of screen width
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
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  activeDropdownItem: {
    backgroundColor: '#F5F5F5',
    borderLeftWidth: 3,
    borderLeftColor: '#376439',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333333',
    marginLeft: 10,
  },
  activeItemText: {
    color: '#376439',
    fontWeight: '600',
  },
  menuSeparator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F5F5F5',
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
  }
});

export default AppHeader;