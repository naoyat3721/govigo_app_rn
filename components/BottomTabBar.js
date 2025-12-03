import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function BottomTabBar({ currentScreen = 'main', currentTab = 'home' }) {
  const router = useRouter();

  const tabs = [
    { key: 'home', icon: 'home-outline', label: 'Home' },
    { key: 'search', icon: 'search-outline', label: 'Search' },
    { key: 'favorites', icon: 'heart-outline', label: 'Favorites' },
    { key: 'booking', icon: 'calendar-outline', label: 'Booking' },
    { key: 'account', icon: 'person-outline', label: 'Account' },
  ];

  const handleTabPress = (tabKey) => {
    // All tabs navigate to MainScreen with the selected tab
    router.push({
      pathname: '/screens/MainScreen',
      params: { tab: tabKey }
    });
  };

  const isActive = (tabKey) => {
    return tabKey === currentTab;
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={styles.tab}
          onPress={() => handleTabPress(tab.key)}
        >
          <Ionicons
            name={tab.icon}
            size={24}
            color={isActive(tab.key) ? '#376439' : '#999999'}
          />
          <Text style={[styles.label, isActive(tab.key) && styles.activeLabel]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  activeLabel: {
    color: '#376439',
    fontWeight: '600',
  },
});
