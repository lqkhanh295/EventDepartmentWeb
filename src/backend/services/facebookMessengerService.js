// Facebook Messenger Service
// Service để gửi tin nhắn qua Facebook Messenger

const FACEBOOK_USERNAME = 'lqkoi29'; // Username từ URL: https://www.facebook.com/lqkoi29/

/**
 * Tạo tin nhắn mượn vật phẩm
 * @param {Array} items - Mảng các vật phẩm cần mượn [{item: string, quantity: number, unit: string}]
 * @returns {string} - Nội dung tin nhắn đã format
 */
export const formatBorrowMessage = (items) => {
  if (!items || items.length === 0) {
    return '';
  }

  const date = new Date().toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });

  let message = `YÊU CẦU MƯỢN VẬT PHẨM\n\n`;
  message += `Thời gian: ${date}\n\n`;
  message += `Danh sách vật phẩm cần mượn:\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  items.forEach((item, index) => {
    message += `${index + 1}. ${item.item}\n`;
    message += `   - Số lượng: ${item.quantity} ${item.unit || 'cái'}\n`;
    if (item.type) {
      message += `   - Loại: ${item.type}\n`;
    }
    message += `\n`;
  });

  message += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `Thay mặt dự án, mình rất mong nhận được sự trợ giúp từ ban Event ạ`;

  return message;
};

/**
 * Copy text vào clipboard
 * @param {string} text - Text cần copy
 * @returns {Promise<boolean>}
 */
const copyToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback cho trình duyệt cũ
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    }
  } catch (error) {
    console.error('Error copying to clipboard:', error);
    return false;
  }
};

/**
 * Mở Facebook Messenger với tin nhắn đã soạn sẵn
 * Lưu ý: Facebook không cho phép pre-fill message trong URL vì lý do bảo mật
 * Nên sẽ mở Messenger và copy message vào clipboard để người dùng paste
 * @param {string} message - Nội dung tin nhắn
 * @returns {Promise<{success: boolean, message: string, clipboardMessage?: string, messengerUrl?: string}>}
 */
export const openFacebookMessenger = async (message) => {
  try {
    // Copy message vào clipboard trước
    const copySuccess = await copyToClipboard(message);
    
    if (!copySuccess) {
      return {
        success: false,
        message: 'Không thể sao chép tin nhắn vào clipboard. Vui lòng thử lại hoặc copy thủ công.',
        clipboardMessage: message
      };
    }

    // Thử nhiều cách mở Messenger
    const messengerUrls = [
      `https://m.me/${FACEBOOK_USERNAME}`, // Messenger web
      `https://www.facebook.com/messages/t/${FACEBOOK_USERNAME}`, // Facebook messages
      `https://www.facebook.com/${FACEBOOK_USERNAME}`, // Facebook profile (fallback)
    ];

    // Mở URL đầu tiên (m.me thường hoạt động tốt nhất)
    const messengerUrl = messengerUrls[0];
    const messengerWindow = window.open(messengerUrl, '_blank', 'noopener,noreferrer');
    
    if (!messengerWindow) {
      // Nếu popup bị chặn, hướng dẫn người dùng mở thủ công
      return {
        success: true,
        message: `Popup bị chặn. Vui lòng mở link sau: ${messengerUrl}\n\nTin nhắn đã được sao chép vào clipboard, vui lòng dán (Ctrl+V) vào Messenger.`,
        clipboardMessage: message,
        messengerUrl: messengerUrl
      };
    }

    return {
      success: true,
      message: 'Đã mở Facebook Messenger. Tin nhắn đã được sao chép vào clipboard, vui lòng dán (Ctrl+V) vào Messenger.',
      clipboardMessage: message,
      messengerUrl: messengerUrl
    };
  } catch (error) {
    console.error('Error opening Facebook Messenger:', error);
    return {
      success: false,
      message: `Không thể mở Facebook Messenger: ${error.message}. Vui lòng thử lại hoặc mở thủ công.`,
      error: error.message,
      clipboardMessage: message
    };
  }
};

/**
 * Tạo URL Messenger với username
 * @returns {string} - URL Messenger
 */
export const getMessengerUrl = () => {
  return `https://m.me/${FACEBOOK_USERNAME}`;
};

/**
 * Tạo URL Facebook profile
 * @returns {string} - URL Facebook profile
 */
export const getFacebookProfileUrl = () => {
  return `https://www.facebook.com/${FACEBOOK_USERNAME}/`;
};

