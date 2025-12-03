import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import BottomTabBar from '../../components/BottomTabBar';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import messageService from '../../services/messageService';

export default function MessageScreen() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Use a ref to prevent multiple loadMore calls
  const isLoadingRef = useRef(false);
  // Thêm biến để theo dõi hướng cuộn
  const [isScrollingDown, setIsScrollingDown] = useState(true);
  const lastContentOffsetY = useRef(0);
  
  // Get socket context
  const { socket, connected, clearNewMessage } = useSocket();
  
  // Check authentication
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/screens/LoginScreen');
    }
  }, [isAuthenticated, authLoading]);

  // Set up socket listener for unread messages
  useEffect(() => {
    if (socket && connected) {
      const handleRoomUpdate = ({ roomId }) => {
        // Refresh rooms list to show the new unread message
        loadInitialRooms();
      };
      
      socket.on('room_update', handleRoomUpdate);
      
      return () => {
        socket.off('room_update', handleRoomUpdate);
      };
    }
  }, [socket, connected]);

  // Load initial rooms and clear new message notifications
  useEffect(() => {
    if (isAuthenticated) {
      loadInitialRooms();
      // Clear new message notification when screen is loaded
      clearNewMessage();
    }
  }, [isAuthenticated]);
  
  const loadInitialRooms = async () => {
    if (isLoadingRef.current) return;
    
    setIsLoading(true);
    setHasMore(true);
    setCurrentPage(1);
    isLoadingRef.current = true;
    
    try {
      const newRooms = await messageService.getRooms(1);
      setRooms(newRooms || []);
      
      // Check if we've reached the end
      if (!newRooms || newRooms.length === 0) {
        setHasMore(false);
      }
    } catch (error) {
      // Chỉ log lỗi ra console, không hiển thị thông báo lỗi
      console.error('Failed to load rooms:', error);
      setRooms([]);
      setHasMore(false);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  };
  
  const loadMoreRooms = async () => {
    if (isLoadingRef.current || isLoadingMore || !hasMore) return;
    
    setIsLoadingMore(true);
    isLoadingRef.current = true;
    
    try {
      const nextPage = currentPage + 1;
      const newRooms = await messageService.getRooms(nextPage);
      
      if (!newRooms || newRooms.length === 0) {
        setHasMore(false);
      } else {
        setRooms(prevRooms => [...prevRooms, ...(newRooms || [])]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      // Chỉ log lỗi ra console, không hiển thị thông báo lỗi
      console.error('Failed to load more rooms:', error);
      setHasMore(false); // Stop trying on error
    } finally {
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await loadInitialRooms();
    setRefreshing(false);
  };
  
  // Theo dõi hướng cuộn
  const handleScroll = (event) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const direction = currentOffset > lastContentOffsetY.current ? 'down' : 'up';
    
    if (direction === 'down') {
      setIsScrollingDown(true);
    } else {
      setIsScrollingDown(false);
    }
    
    lastContentOffsetY.current = currentOffset;
  };
  
  // Kiểm tra xem có nên tải thêm dữ liệu khi đến cuối danh sách
  const handleEndReached = () => {
    if (isScrollingDown) {
      loadMoreRooms();
    }
  };
  
  const onRoomPress = (room) => {
    router.push({
      pathname: '/screens/DetailMessageScreen',
      params: { roomId: room.reserve_id, roomName: room.golf_club_name}
    });
  };
  
  const renderItem = ({ item }) => {
    const room = item;
    return (
      <TouchableOpacity 
        style={styles.roomItem} 
        onPress={() => onRoomPress(room)}
      >
        <View style={styles.avatarContainer}>
          {room.golf_club_img ? (
            <Image 
              source={{ uri: room.golf_club_img }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
              <Text style={styles.placeholderText}>⛳</Text>
            </View>
          )}
        </View>
        
        <View style={styles.roomInfo}>
          <Text style={styles.roomName}>{room.golf_club_name}</Text>
          <Text style={styles.planName} numberOfLines={1} ellipsizeMode="tail">
            {room.plan_name}
          </Text>
        </View>
        
        <View style={styles.roomMeta}>
          {room.latest_date && (
            <Text style={styles.dateText}>
              {format(new Date(room.latest_date), 'dd/MM/yy')}
            </Text>
          )}
          
          {room.is_unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>
                {room.is_unread}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  const renderFooter = () => {
    if (!isLoadingMore) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#376439" />
      </View>
    );
  };
  
  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Không có tin nhắn nào</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader 
        title="Messages" 
        showBackButton={true}
        backRoute="/screens/MainScreen" 
      />  
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#376439" />
        </View>
      ) : (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.reserve_id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.2}
          onScroll={handleScroll}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#376439']}
            />
          }
        />
      )}
      
      <BottomTabBar currentScreen="main" currentTab="home" />
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
  listContainer: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  roomItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
  },
  placeholderAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 24,
    color: '#376439',
  },
  roomInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planName: {
    fontSize: 14,
    color: '#666666',
  },
  roomMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#FF3B30',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
  },
});