// Remove Background Service - Sử dụng API từ remove.bg
// API Documentation: https://www.remove.bg/api

const REMOVE_BG_API_URL = 'https://api.remove.bg/v1.0/removebg';

/**
 * Xóa background từ ảnh sử dụng remove.bg API
 * @param {File} imageFile - File ảnh cần xóa background
 * @param {string} apiKey - API key từ remove.bg (có thể null nếu dùng API key từ Firebase)
 * @param {Object} options - Các tùy chọn bổ sung
 * @returns {Promise<Blob>} - Ảnh đã xóa background dưới dạng Blob
 */
export const removeBackground = async (imageFile, apiKey = null, options = {}) => {
  try {
    if (!imageFile) {
      throw new Error('Vui lòng chọn file ảnh');
    }

    // Nếu không có apiKey, thử lấy từ Firebase
    let finalApiKey = apiKey;
    if (!finalApiKey) {
      const { getRemoveBgApiKey } = await import('./configService');
      finalApiKey = await getRemoveBgApiKey();
    }

    // Trim và validate API key
    if (finalApiKey) {
      finalApiKey = finalApiKey.trim();
    }

    if (!finalApiKey || finalApiKey === '') {
      throw new Error('API key chưa được cấu hình. Vui lòng liên hệ admin để cấu hình API key.');
    }

    // Log để debug (không log toàn bộ key, chỉ log một phần)
    console.log('Using API key:', finalApiKey.substring(0, 10) + '...');

    // Kiểm tra định dạng file
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('Chỉ hỗ trợ định dạng: JPEG, PNG, WebP');
    }

    // Kiểm tra kích thước file (max 12MB cho free tier)
    const maxSize = 12 * 1024 * 1024; // 12MB
    if (imageFile.size > maxSize) {
      throw new Error('Kích thước file không được vượt quá 12MB');
    }

    // Tạo FormData
    const formData = new FormData();
    formData.append('image_file', imageFile);
    
    // Thêm các tùy chọn
    if (options.size) {
      formData.append('size', options.size); // 'auto', 'preview', 'regular', 'hd', '4k'
    }
    
    if (options.format) {
      formData.append('format', options.format); // 'auto', 'png', 'jpg', 'zip'
    }

    if (options.bg_color) {
      formData.append('bg_color', options.bg_color); // Hex color code
    }

    // Gọi API
    const response = await fetch(REMOVE_BG_API_URL, {
      method: 'POST',
      headers: {
        'X-Api-Key': finalApiKey
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Xử lý các lỗi phổ biến
      let errorMessage = errorData.errors?.[0]?.title || 
                        errorData.error?.message || 
                        `Lỗi API: ${response.status} ${response.statusText}`;
      
      // Thông báo cụ thể cho từng loại lỗi
      if (response.status === 403 || errorMessage.toLowerCase().includes('invalid') || errorMessage.toLowerCase().includes('api key')) {
        errorMessage = 'API key không hợp lệ. Vui lòng kiểm tra lại API key trong phần cấu hình (chỉ admin).';
      } else if (response.status === 401) {
        errorMessage = 'API key không được xác thực. Vui lòng kiểm tra lại API key.';
      } else if (response.status === 402) {
        errorMessage = 'Hết quota API. Vui lòng nâng cấp tài khoản remove.bg.';
      }
      
      throw new Error(errorMessage);
    }

    // Trả về Blob của ảnh đã xóa background
    const blob = await response.blob();
    return blob;

  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

/**
 * Chuyển đổi Blob thành URL để hiển thị
 * @param {Blob} blob - Blob của ảnh
 * @returns {string} - URL của ảnh
 */
export const blobToUrl = (blob) => {
  return URL.createObjectURL(blob);
};

/**
 * Tải ảnh về máy
 * @param {Blob} blob - Blob của ảnh
 * @param {string} filename - Tên file khi tải về
 */
export const downloadImage = (blob, filename = 'removed-background.png') => {
  const url = blobToUrl(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

