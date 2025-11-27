# 🔥 Hướng dẫn Setup Firebase cho CSG Event Department

## 📋 Bước 1: Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** hoặc **"Tạo dự án"**
3. Đặt tên project: `csg-event-department`
4. Có thể bỏ chọn Google Analytics (không bắt buộc)
5. Click **"Create project"**

## 📋 Bước 2: Thêm Web App

1. Trong Firebase Console, click icon **Web (</>)** 
2. Đặt tên app: `CSG Event Web`
3. **Không cần** check Firebase Hosting (có thể thêm sau)
4. Click **"Register app"**
5. **Copy config** hiển thị ra:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "csg-event-department.firebaseapp.com",
  projectId: "csg-event-department",
  storageBucket: "csg-event-department.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

6. Mở file `src/backend/firebase/config.js` và thay thế config

## 📋 Bước 3: Thiết lập Firestore Database

1. Trong Firebase Console → **Build** → **Firestore Database**
2. Click **"Create database"**
3. Chọn **"Start in test mode"** (cho development)
4. Chọn location gần nhất (ví dụ: `asia-southeast1`)
5. Click **"Enable"**

### Cấu trúc dữ liệu Vendors:

```
vendors (collection)
├── vendor_id_1 (document)
│   ├── name: "ABC Sound"
│   ├── category: "Âm thanh"
│   ├── description: "Cung cấp âm thanh sự kiện"
│   ├── phone: "0901234567"
│   ├── email: "contact@abcsound.com"
│   ├── address: "123 Nguyễn Huệ, Q1"
│   ├── services: ["Loa", "Mic", "Mixer"]
│   ├── rating: 4.5
│   ├── priceRange: "5-10 triệu"
│   ├── notes: "Ghi chú thêm..."
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
```

### Thêm dữ liệu mẫu:

1. Trong Firestore, click **"Start collection"**
2. Collection ID: `vendors`
3. Document ID: Click **"Auto-ID"**
4. Thêm các fields:
   - `name` (string): "ABC Sound System"
   - `category` (string): "Âm thanh"
   - `description` (string): "Cung cấp hệ thống âm thanh chuyên nghiệp"
   - `phone` (string): "0901234567"
   - `email` (string): "abc@sound.com"
   - `address` (string): "123 Đường XYZ, Quận 1, TP.HCM"
   - `services` (array): ["Loa JBL", "Mixer Yamaha", "Micro Shure"]
   - `rating` (number): 4.5
   - `priceRange` (string): "5-15 triệu"

## 📋 Bước 4: Thiết lập Storage

1. Trong Firebase Console → **Build** → **Storage**
2. Click **"Get started"**
3. Chọn **"Start in test mode"**
4. Chọn location (giống Firestore)
5. Click **"Done"**

### Upload file Event Guide:

1. Trong Storage, tạo folder `guides`
2. Upload file `EVENT DEPARTMENT GUIDES.docx` từ thư mục `guide`
3. Hoặc upload trực tiếp từ website sau khi cài đặt xong

## 📋 Bước 5: Cấu hình Security Rules

### Firestore Rules (cho development):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Storage Rules (cho development):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Lưu ý**: Đây là rules cho development. Khi deploy production, cần cấu hình authentication và rules chặt chẽ hơn.

## 📋 Bước 6: Cập nhật Config trong Project

Mở file `src/backend/firebase/config.js` và cập nhật:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",           // Thay bằng API key của bạn
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## ✅ Hoàn tất!

Sau khi hoàn tất các bước trên:

1. Chạy `npm install` để cài đặt dependencies
2. Chạy `npm start` để khởi động development server
3. Truy cập http://localhost:3000

## 🔧 Troubleshooting

### Lỗi "Firebase: No Firebase App"
- Kiểm tra lại config trong `src/backend/firebase/config.js`

### Lỗi "Permission denied"
- Kiểm tra Security Rules của Firestore và Storage

### Lỗi CORS khi tải file
- Cấu hình CORS cho Storage bucket:

```json
[
  {
    "origin": ["*"],
    "method": ["GET"],
    "maxAgeSeconds": 3600
  }
]
```

## 📞 Hỗ trợ

Nếu gặp vấn đề, liên hệ:
- Firebase Documentation: https://firebase.google.com/docs
- Email: [your-email@csg.com]

