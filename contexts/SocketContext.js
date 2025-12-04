import Constants from 'expo-constants';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const SOCKET_URL = Constants.expoConfig?.extra?.socketUrl;

  // Socket connection management
  useEffect(() => {
    if (isAuthenticated && user && SOCKET_URL) {
      console.log('user in socket', user);
      // Initialize socket connection
      const newSocket = io(SOCKET_URL, {
        transports: ['websocket'],
        autoConnect: true, 
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Set socket instance in state
      setSocket(newSocket);



      // Socket event listeners
      const onConnect = () => {
        console.log('Socket connected from app:', newSocket.id);
        setConnected(true);
      };

      const onDisconnect = (reason) => {
        console.log('Socket disconnected:', reason);
        setConnected(false);
      };

      const onConnectError = (err) => {
        console.log('Socket connection error:', err.message);
        setConnected(false);
      };

      // Register event listeners
      newSocket.on('connect', onConnect);
      newSocket.on('disconnect', onDisconnect);
      newSocket.on('connect_error', onConnectError);

      // Listen for new message notifications
      newSocket.on('room_update', (data) => {
        console.log('Received room_update event:', data);
        setHasNewMessage(true);
      });

      newSocket.on('notify_new_message', (data) => {
        console.log('Received notify_new_message event:', data);
        if (Number(data.memberId) == user.id) {
          setHasNewMessage(data.hasMessage);
        }
      });

      newSocket.emit('register_user', { sourceName: `member${user.id}`, socketId: newSocket.id })
      
      // Also listen for private messages as they might indicate new messages
      newSocket.on('private message', (data) => {
        console.log('Received private message event:', data);
        if (data && data.action === 'create') {
          setHasNewMessage(true);
        }
      });

      // Cleanup on unmount or auth change
      return () => {
        console.log('Cleaning up socket connection...');
        newSocket.off('connect', onConnect);
        newSocket.off('disconnect', onDisconnect);
        newSocket.off('connect_error', onConnectError);
        newSocket.off('room_update');
        newSocket.off('private message');
        newSocket.disconnect();
        setConnected(false);
      };
    } else if (!isAuthenticated && socket) {
      // Disconnect socket when user logs out
      console.log('User logged out, disconnecting socket...');
      socket.disconnect();
      setSocket(null);
      setConnected(false);
      setHasNewMessage(false);
    }
  }, [isAuthenticated, user, SOCKET_URL]);

  const registerMember = useCallback(() => {
      if (!socket || !connected) {
        console.log('register socket member fail');
        return false;
      }
      socket.emit('register_user', { sourceName: 'member'. user.id });

  });

  // Register to a room (conversation)
  const registerRoom = useCallback((roomId) => {
    if (!socket || !connected) return false;
    
    try {
      const prefixSource = 'member';
      const sourceName = `${prefixSource}${roomId}`;
      
      socket.emit('register', { sourceName });
      console.log('Registered to room:', sourceName);
      return true;
    } catch (error) {
      console.log('Error registering to room:', error);
      return false;
    }
  }, [socket, connected]);

  // Send a socket message
  const sendMessage = useCallback((roomId, action, messageId = null, messageContent = null) => {
    if (!socket || !connected) return false;
    
    try {
      const prefixTarget = 'admin';
      const prefixSource = 'member';
      const sourceName = `${prefixSource}${roomId}`;
      const targetName = `${prefixTarget}${roomId}`;

      socket.emit('private message', {
        sourceName,
        targetName,
        messageId,
        message: messageContent,
        action,
      });
      console.log('Socket message sent:', action);
      return true;
    } catch (error) {
      console.log('Error sending socket message:', error);
      return false;
    }
  }, [socket, connected]);

  const clearNewMessage = () => {
    setHasNewMessage(false);
  };

  return (
    <SocketContext.Provider value={{ 
      socket,
      connected,
      registerRoom,
      sendMessage,
      hasNewMessage,
      clearNewMessage
    }}>
      {children}
    </SocketContext.Provider>
  );
};
