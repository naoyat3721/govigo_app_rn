import Constants from 'expo-constants';
import axiosClient from '../api/axiosClient';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://10.0.2.2:9000/api';

class MessageService {
  async getRooms(page = 1) {
    try {
      const response = await axiosClient.get('/room.php', {
        params: { listNum: page }
      });
      console.log('getRooms response:', response);
      if (response && response.success) {
        return response.data.rooms;
      }
      return [];
    } catch (error) {
      console.error('Error fetching rooms:', error);
      // Chỉ log lỗi ra console mà không throw lỗi
      return [];
    }
  }

  async getMessages(roomId, page = 1) {
    try {
      console.log('Fetching messages for roomId:', roomId, 'page:', page);
      const response = await axiosClient.get(`/message.php`, {
        params: { reserve_id: roomId, page }
      });
      if (response && response.success) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching messages:', error);
      // Chỉ log lỗi ra console mà không throw lỗi
      return [];
    }
  }

  async sendMessage(roomId, content, quoteText = null, attachments = []) {
    try {
      // Create form data to handle both text messages and attachments
      const formData = new FormData();
      formData.append('reserve_id', roomId);
      formData.append('message', content);

      if (quoteText) {
        formData.append('quote_text', quoteText);
      }

      // If we have attachments, add them to the form data
      if (attachments && attachments.length > 0) {
        // Append attachments
        attachments.forEach((file, index) => {
          const fileUri = file.uri || file.path;
          const fileType = file.mimeType || file.type || 'application/octet-stream';
          const fileName = file.name || fileUri.split('/').pop();

          formData.append(`file_attach_${index + 1}`, {
            uri: fileUri,
            type: fileType,
            name: fileName,
          });
        });
      }
      
      // Use axiosClient directly with FormData - it will handle auth token automatically
      const response = await axiosClient({
        method: 'post',
        url: '/message.php',
        params: { reserve_id: roomId },
        data: formData,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      console.log('sendMessage response:', response);

      if (response && response.success) {
        return response.data;
      }

      console.error('Failed to send message:', response);
      return null;
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Chỉ log lỗi ra console mà không throw lỗi
      return null;
    }
  }

  async editMessage(roomId, messageId, newContent) {
    try {
      // Create payload for PATCH request
      const payload = {
        messageId: messageId,
        message: newContent
      };
      
      console.log('Edit message data:', payload);

      // Use axiosClient with PATCH method to match the server's expectations
      const response = await axiosClient({
        method: 'patch',
        url: '/message.php',
        params: { reserve_id: roomId },
        data: payload,
        headers: { 'Content-Type': 'application/json' } // Use JSON content type for PATCH
      });

      console.log('editMessage response:', response);
      if (response && response.success) {
        return response.data;
      }

      console.error('Failed to edit message:', response);
      return null;
    } catch (error) {
      console.error('Error editing message:', error);
      // Chỉ log lỗi ra console mà không throw lỗi
      return null;
    }
  }

  async deleteMessage(roomId, messageId) {
    console.log('--- delete message ----');
    try {
      // Use consistent parameter format with other methods
      const response = await axiosClient({
        method: 'delete',
        url: '/message.php',
        params: { id: messageId, reserve_id: roomId }
      });

      console.log('deleteMessage response:', response);
      if (response && response.success) {
        return response.data;
      }

      console.error('Failed to delete message:', response);
      return null;
    } catch (error) {
      console.error('Error deleting message:', error);
      // Chỉ log lỗi ra console mà không throw lỗi
      return null;
    }
  }
}

export default new MessageService();