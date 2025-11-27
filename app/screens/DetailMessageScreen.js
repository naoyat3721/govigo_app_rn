import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import Constants from 'expo-constants';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppHeader from '../../components/AppHeader';
import { useSocket } from '../../contexts/SocketContext';
import messageService from '../../services/messageService';
import urlHelper from '../../utils/urlHelper';

// Get download URL from environment variables or use a default
const DOWNLOAD_URL_MESSAGE = Constants.expoConfig?.extra?.downloadUrlMessage || 'http://10.0.2.2:9000/uploads/';
const WEB_URL = Constants.expoConfig?.extra?.webUrl || 'https://govigolf.com/';
export default function DetailMessageScreen() {
  const router = useRouter();
  const { roomId, roomName } = useLocalSearchParams();
  const [roomInfo, setRoomInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [quotedMessage, setQuotedMessage] = useState(null);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editMessage, setEditMessage] = useState({ id: null, content: '' });
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  const flatListRef = useRef();
  const isLoadingRef = useRef(false);
  const editInputRef = useRef();

  // Get socket context
  const { socket, connected, registerRoom, sendMessage, clearNewMessage } = useSocket();

  // Initialize socket connection
  useEffect(() => {
    if (roomId && connected) {
      // Register to the room
      registerRoom(roomId);

      // Listen for private messages
      const handlePrivateMessage = ({ messageId, message, action }) => {
        console.log(`Received socket event: ${action}`, messageId);

        if (action === 'create') {
          // Reload messages when a new message is created
          loadInitialMessages();
        } else if (action === 'update' && messageId) {
          // Update the message in the state
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === messageId ? { ...msg, message: message } : msg
            )
          );
        } else if (action === 'delete' && messageId) {
          // Remove the message from the state
          setMessages(prevMessages =>
            prevMessages.filter(msg => msg.id !== messageId)
          );
        }
      };

      socket.on("private message", handlePrivateMessage);

      // Clean up socket listener on unmount
      return () => {
        socket.off('private message', handlePrivateMessage);
      };
    }
  }, [roomId, socket, connected, registerRoom]);

  // Initialize a ref to track initial load
  const isInitialLoadRef = useRef(true);
  
  // Scroll to bottom when messages change
  // Modified to match ChatScreen's approach
  useEffect(() => {
    // We'll handle scrolling in onContentSizeChange of FlatList
    // This makes for smoother scrolling, especially when loading initial messages
    // or when new messages arrive
  }, [messages]);

  // Load initial messages and clear new message notifications
  useEffect(() => {
    if (roomId) {
      loadInitialMessages();
      // Clear new message notification when viewing a specific conversation
      clearNewMessage();
    }
  }, [roomId]);

  const loadInitialMessages = async () => {
    if (isLoadingRef.current) return;

    setIsLoading(true);
    isLoadingRef.current = true;
    
    // Enable scrolling to bottom when loading initial messages
    setShouldScrollToBottom(true);

    try {
      console.log('roomId', roomId)
      const messagesData = await messageService.getMessages(roomId, 1);

      // Reverse messages to show oldest first (needed for inverted FlatList)
      const reversedMessages = messagesData ? [...messagesData].reverse() : [];
      
      // Always set messages so the UI updates, even if empty
      setMessages(reversedMessages);
      
      // Scroll to bottom after messages are set
      if (reversedMessages.length > 0) {
        setTimeout(() => {
          flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
        }, 100);
      }
      
      // Mark initial load as complete
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
      }
      
      setCurrentPage(1);
      setHasMore(messagesData && messagesData.length > 0);

    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }; 
  
  const loadMoreMessages = async () => {
    console.log('loadMoreMessages called');
    if (isLoadingRef.current || isLoadingMore || !hasMore) return;
    
    console.log('Loading more messages triggered');
    setIsLoadingMore(true);
    isLoadingRef.current = true;
    
    // Set shouldScrollToBottom to false when loading older messages
    setShouldScrollToBottom(false);

    // Using setTimeout to show loading indicator, similar to ChatScreen approach
    setTimeout(async () => {
      try {
        const nextPage = currentPage + 1;
        const olderMessages = await messageService.getMessages(roomId, nextPage);
        console.log('Loaded older messages:', olderMessages);
        if (!olderMessages || olderMessages.length === 0) {
          setHasMore(false);
        } else {
          // Add older messages at the end (since we're using inverted FlatList)
          setMessages(prevMessages => [
            ...prevMessages,
            ...(olderMessages.reverse() || [])
          ]);
          setCurrentPage(nextPage);
        }
      } catch (error) {
        console.error('Failed to load more messages:', error);
        setHasMore(false);
      } finally {
        setIsLoadingMore(false);
        isLoadingRef.current = false;
      }
    }, 500); // Match the delay in ChatScreen for consistency
  };

  const handleSendMessage = async () => {
    if (messageText.trim() === '' && selectedAttachments.length === 0) return;

    const messageToSend = messageText;
    const attachmentsToSend = [...selectedAttachments];
    const quoteToSend = quotedMessage?.message ?? null;
    
    // Clear input fields immediately for a responsive feel
    setMessageText('');
    setSelectedAttachments([]);
    setQuotedMessage(null);
    
    // Enable scrolling to bottom when sending a new message
    setShouldScrollToBottom(true);
    
    // Force disable initial load behavior when sending new messages
    isInitialLoadRef.current = false;

    try {
      // Call API to send message
      await messageService.sendMessage(roomId, messageToSend, quoteToSend, attachmentsToSend);

      // Emit socket event for real-time update
      sendMessage(roomId, 'create');

      // Reload all messages to show the new one
      await loadInitialMessages();

      // Let onContentSizeChange handle the scrolling - this is smoother
      // than manually calling scrollToEnd here
    } catch (error) {
      console.error('Failed to send message:', error);

      // Restore state if sending fails
      setMessageText(messageToSend);
      setSelectedAttachments(attachmentsToSend);
      if (quoteToSend) setQuotedMessage(quoteToSend);
    }
  };

  const handleQuoteMessage = (message) => {
    setQuotedMessage(message);
  };

  const cancelQuote = () => {
    setQuotedMessage(null);
  };

  const handleEditMessage = (message) => {
    // Set the message to be edited and show modal
    setEditMessage({
      id: message.id,
      content: message.content || message.message
    });
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (editMessage.content && editMessage.content.trim()) {
        // Hide modal first for better UX
        setEditModalVisible(false);

        // Call API to edit message
        await messageService.editMessage(roomId, editMessage.id, editMessage.content);

        // Emit socket event for real-time update
        sendMessage(roomId, 'update', editMessage.id, editMessage.content);

        // Update message in local state
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === editMessage.id ? { ...msg, message: editMessage.content } : msg
          )
        );
      }
    } catch (error) {
      console.error('Failed to edit message:', error);
      Alert.alert('Error', 'Failed to edit message. Please try again.');
    }
  };

  const handleDeleteMessage = (message) => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement API call to delete message
              // await messageService.deleteMessage(roomId, message.id);

              // Delete message via API
              await messageService.deleteMessage(roomId, message.id);

              // Emit socket event for real-time update
              sendMessage(roomId, 'delete', message.id);

              // Remove message from local state
              setMessages(prevMessages =>
                prevMessages.filter(msg => msg.id !== message.id)
              );
            } catch (error) {
              console.error('Failed to delete message:', error);
            }
          }
        }
      ]
    );
  };

  const pickAttachments = async () => {
    // Limit to 5 files
    if (selectedAttachments.length >= 5) {
      Alert.alert('Limit Reached', 'You can only attach up to 5 files.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        multiple: true,
        copyToCacheDirectory: true
      });

      if (result.assets) {
        // Add new files, respecting the 5 file limit
        const newAttachments = result.assets.slice(0, 5 - selectedAttachments.length);
        setSelectedAttachments(prev => [...prev, ...newAttachments]);
      }
    } catch (error) {
      console.error('Error picking documents:', error);
    }
  };

  const removeAttachment = (indexToRemove) => {
    setSelectedAttachments(prev =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  // Function to extract filename from path
  const getFilename = (path) => {
    try {
      return path.split('/').pop();
    } catch (e) {
      return path;
    }
  };

  const renderMessage = ({ item: message }) => {
    const isMyMessage = message.created_type_user === 'member';

    // Check for file_attach_1 through file_attach_5
    const fileAttachments = [];
    for (let i = 1; i <= 5; i++) {
      const attachKey = `file_attach_${i}`;
      if (message[attachKey]) {
        fileAttachments.push({
          key: attachKey,
          path: message[attachKey]
        });
      }
    }
    const hasAttachments = fileAttachments.length > 0;

    const defaultAvatar = WEB_URL + '/images/favicon.png';

    // Get avatar URL or use default
    const avatarUrl = isMyMessage ? WEB_URL + (message.golf_club_img || '/images/favicon.png') : WEB_URL + '/images/favicon.png';
    console.log(avatarUrl);
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        {/* Message row with avatar and content */}
        <View style={[
          styles.messageRow,
          isMyMessage ? styles.myMessageRow : styles.theirMessageRow
        ]}>
          {/* Avatar for other user's messages */}
          {!isMyMessage && (
            <View style={styles.avatarContainer}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.defaultAvatar]}>
                  <Text style={styles.avatarInitial}>
                    {message.created_by ? message.created_by.charAt(0).toUpperCase() : 'A'}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Message content container */}
          <View style={[
            styles.messageContent,
            isMyMessage ? styles.myMessageContent : styles.theirMessageContent
          ]}>
            {/* Message bubble */}
            <View style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble
            ]}>
              {/* Username for other user (not shown for my messages) */}
              {!isMyMessage && message.created_by && (
                <Text style={styles.messageUsername}>{message.created_by}</Text>
              )}

              {/* Quoted text if any */}
              {message.quote_text && (
                <View style={styles.quoteContainer}>
                  <Text style={styles.quoteLabel}>Quote:</Text>
                  <Text style={styles.quoteText}>{message.quote_text}</Text>
                </View>
              )}

              {/* Message content */}
              {message.message ? (
                <Text style={styles.messageText}>{message.message}</Text>
              ) : message.content ? (
                <Text style={styles.messageText}>{message.content}</Text>
              ) : null}

              {/* Action buttons for my messages */}
              {isMyMessage && (
                <View style={styles.messageActions}>
                  <TouchableOpacity
                    onPress={() => handleQuoteMessage(message)}
                    style={styles.actionButton}
                  >
                    <Ionicons name="arrow-undo" size={16} color="#666666" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleEditMessage(message)}
                    style={styles.actionButton}
                  >
                    <Feather name="edit" size={16} color="#666666" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteMessage(message)}
                    style={styles.actionButton}
                  >
                    <Feather name="trash" size={16} color="#666666" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Attachments if any */}
            {hasAttachments && fileAttachments.map((attachment, index) => (
              <TouchableOpacity
                key={`${message.id}-${attachment.key}`}
                style={[
                  styles.attachmentContainer,
                  isMyMessage ? styles.myAttachment : styles.theirAttachment
                ]}
                onPress={() => {
                  const fullUrl = `${DOWNLOAD_URL_MESSAGE}${attachment.path}`;
                  // Show options for handling the file
                  Alert.alert(
                    'Download Attachment',
                    'What would you like to do with this file?',
                    [
                      {
                        text: 'Copy URL',
                        onPress: () => urlHelper.copyToClipboard(fullUrl)
                      },
                      {
                        text: 'Open in Browser',
                        onPress: () => urlHelper.openInBrowser(fullUrl)
                      },
                      {
                        text: 'Share',
                        onPress: () => urlHelper.shareUrl(fullUrl, `Attachment: ${attachment.key}`)
                      },
                      {
                        text: 'Cancel',
                        style: 'cancel'
                      }
                    ]
                  );
                }}
              >
                <Feather name="file" size={16} color="#376439" />
                <Text style={styles.attachmentText}>
                  {attachment.key}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Timestamp */}
            <Text style={[
              styles.timestampText,
              isMyMessage ? styles.myTimestamp : styles.theirTimestamp
            ]}>
              {message.create_date && format(new Date(message.create_date), 'HH:mm dd/MM/yy')}
            </Text>
          </View>
          {isMyMessage && (
            <View style={styles.avatarContainer}>
              <Image source={{ uri: avatarUrl }}
                style={styles.avatar}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    if (!isLoadingMore) return null;

    return (
      <View style={styles.loadingMoreContainer}>
        <ActivityIndicator size="small" color="#376439" />
      </View>
    );
  };

  // Edit Message Modal
  const renderEditModal = () => {
    console.log('edit message', editMessage);
    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Message</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <AntDesign name="close" size={24} color="#666666" />
              </TouchableOpacity>
            </View>

            <TextInput
              ref={editInputRef}
              style={styles.modalInput}
              value={editMessage.content}
              onChangeText={(text) => setEditMessage(prev => ({ ...prev, content: text }))}
              multiline={true}
              autoFocus={true}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !editMessage.content.trim() ? styles.saveButtonDisabled : {}
                ]}
                onPress={handleSaveEdit}
                disabled={!editMessage.content.trim()}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Render Edit Modal */}
      {renderEditModal()}

      <AppHeader
        title="Detail Message"
        showBackButton={true}
        backRoute="/screens/MessageScreen"
      />
    <View style={styles.roomTitle}>
      <Text style={styles.roomTitleText}>{roomName || 'Conversation'}</Text>
    </View>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#376439" />
          </View>
        ) : (
          <>
            {/* Messages list */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item, index) => `message-${item.id || index}`}
              renderItem={renderMessage}
              ListFooterComponent={renderHeader}
              inverted={true}
              // Performance optimizations for smoother scrolling
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              windowSize={15}
              updateCellsBatchingPeriod={100}
              initialNumToRender={20}
              onEndReached={() => {
                // Load more messages when reaching the end (top in inverted list)
                if (hasMore && !isLoadingMore) {
                  loadMoreMessages();
                }
              }}
              onEndReachedThreshold={0.5}
              scrollEventThrottle={150}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
                autoscrollToTopThreshold: 10
              }}
              onLayout={() => {
                // Scroll to bottom on initial layout
                if (isInitialLoadRef.current && messages.length > 0) {
                  setTimeout(() => {
                    flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
                  }, 100);
                }
              }}
            />
            
            {/* Scroll to bottom button - appears when scrolled up */}
            {messages.length > 0 && !shouldScrollToBottom && (
              <TouchableOpacity 
                style={styles.scrollToBottomButton}
                onPress={() => {
                  setShouldScrollToBottom(true);
                  flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
                }}
              >
                <Ionicons name="arrow-down" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            {/* Quote section */}
            {quotedMessage && (
              <View style={styles.quoteInputContainer}>
                <View style={styles.quoteInputContent}>
                  <Text style={styles.quoteInputLabel}>Quote:</Text>
                  <Text
                    style={styles.quoteInputText}
                    numberOfLines={2}
                  >
                    {quotedMessage.content || quotedMessage.message}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={cancelQuote}
                  style={styles.quoteCancelButton}
                >
                  <AntDesign name="close" size={16} color="#666666" />
                </TouchableOpacity>
              </View>
            )}

            {/* Attachments section */}
            {selectedAttachments.length > 0 && (
              <View style={styles.attachmentListContainer}>
                <FlatList
                  data={selectedAttachments}
                  horizontal
                  keyExtractor={(item, index) => `attachment-${index}`}
                  renderItem={({ item, index }) => (
                    <View style={styles.selectedAttachment}>
                      <Text style={styles.selectedAttachmentText} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <TouchableOpacity
                        onPress={() => removeAttachment(index)}
                        style={styles.removeAttachmentButton}
                      >
                        <AntDesign name="close" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  )}
                />
              </View>
            )}

            {/* Message input */}
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.attachButton}
                onPress={pickAttachments}
              >
                <Feather name="paperclip" size={24} color="#666666" />
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                value={messageText}
                onChangeText={setMessageText}
                placeholder="Message..."
                multiline
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!messageText.trim() && selectedAttachments.length === 0)
                    ? styles.sendButtonDisabled
                    : {}
                ]}
                onPress={handleSendMessage}
                disabled={!messageText.trim() && selectedAttachments.length === 0}
              >
                <Ionicons name="send" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMoreContainer: {
    padding: 10,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  messageContainer: {
    marginVertical: 4,
    marginHorizontal: 8,
    alignItems: 'flex-start',
    width: '95%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Changed from 'flex-end' to 'flex-start'
    width: '100%',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  theirMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    marginLeft: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  defaultAvatar: {
    backgroundColor: '#CCDDCE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#376439',
  },
  messageContent: {
    maxWidth: '85%',
    justifyContent: 'flex-start',
  },
  myMessageContent: {
    alignItems: 'flex-end',
  },
  theirMessageContent: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    padding: 10,
    borderRadius: 16,
    maxWidth: '100%',
    alignSelf: 'flex-start', // Added to ensure top alignment with avatar
  },
  myMessageBubble: {
    backgroundColor: '#E7F3E8',
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 4,
  },
  messageUsername: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#376439',
    marginBottom: 4,
  },
  quoteContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#376439',
  },
  quoteLabel: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  quoteText: {
    fontSize: 14,
    color: '#333333',
  },
  messageText: {
    fontSize: 16,
    color: '#000000',
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  actionButton: {
    paddingHorizontal: 6,
  },
  attachmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  myAttachment: {
    alignSelf: 'flex-end',
  },
  theirAttachment: {
    alignSelf: 'flex-start',
  },
  attachmentText: {
    marginLeft: 6,
    fontSize: 14,
    color: '#376439',
  },
  timestampText: {
    fontSize: 10,
    color: '#999999',
    marginTop: 2,
  },
  myTimestamp: {
    alignSelf: 'flex-end',
  },
  theirTimestamp: {
    alignSelf: 'flex-start',
  },
  quoteInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    padding: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  quoteInputContent: {
    flex: 1,
  },
  quoteInputLabel: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  quoteInputText: {
    fontSize: 14,
    color: '#333333',
  },
  quoteCancelButton: {
    padding: 6,
  },
  attachmentListContainer: {
    height: 60,
    backgroundColor: '#F2F2F7',
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 8,
  },
  selectedAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#376439',
    marginVertical: 10,
    marginHorizontal: 4,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 8,
    borderRadius: 20,
  },
  selectedAttachmentText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginRight: 6,
    maxWidth: 100,
  },
  removeAttachmentButton: {
    backgroundColor: '#265026',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 8,
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
  },
  attachButton: {
    paddingHorizontal: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#376439',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#A0AFA0',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    maxHeight: 200,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#376439',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#A0AFA0',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollToBottomButton: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#376439',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  roomTitle: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    backgroundColor: '#376439',
  },
  roomTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  }
});