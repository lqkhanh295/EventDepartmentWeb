# Event Department Web

Hệ thống quản lý thông tin Ban Event - Câu lạc bộ Truyền thông Cóc Sài Gòn (CSG)

## 📋 Mô tả

Event Department Web là ứng dụng web quản lý toàn diện dành cho Ban Event của CLB Truyền thông Cóc Sài Gòn. Ứng dụng cung cấp các công cụ và tính năng hỗ trợ quản lý vendors, thành viên, kho vật phẩm, hướng dẫn sự kiện và các tiện ích khác.

## ✨ Tính năng chính

### 🔐 Xác thực và Phân quyền
- Hệ thống đăng nhập với 2 loại tài khoản:
  - **Admin**: Yêu cầu mật khẩu `eventleader`
  - **Member**: Đăng nhập không cần mật khẩu
- Bảo vệ route theo quyền người dùng

### 📊 Dashboard
- Tổng quan hệ thống
- Thống kê nhanh các thông tin quan trọng

### 🏪 Vendor Management
- Quản lý danh sách vendor
- Thêm, sửa, xóa thông tin vendor
- Tìm kiếm và lọc vendor

### 👥 Members Management (Admin only)
- Quản lý thành viên Ban Event
- Import danh sách thành viên từ Excel
- Quản lý điểm số thành viên theo học kỳ
- Xem lịch sử và thống kê thành viên

### 📦 Inventory Management (Kho vật phẩm)
- Quản lý kho vật phẩm sự kiện
- Import dữ liệu từ CSV/XLSX
- Tìm kiếm và lọc theo Type, Item
- Hiển thị số lượng tồn kho
- CRUD vật phẩm (Admin only)
- Đồng bộ với Firestore

### 📚 Event Guide
- Cẩm nang tổ chức sự kiện
- Hướng dẫn cho các team: Planning, Event Production, Paperwork
- Template và checklist
- Liên kết tài liệu hướng dẫn

### 🔍 Tax Lookup (Tra cứu MST)
- Tra cứu mã số thuế doanh nghiệp
- Kiểm tra thông tin công ty

### 🖼️ Remove Background
- Công cụ xóa nền ảnh
- Xử lý hình ảnh nhanh chóng

## 🛠️ Công nghệ sử dụng

### Frontend
- **React 18.2.0** - UI Framework
- **Material-UI (MUI) 5.14.18** - Component library
- **Ant Design 5.11.1** - Additional UI components
- **React Router 6.20.0** - Routing
- **Framer Motion** - Animations
- **XLSX** - Excel file processing

### Backend & Services
- **Firebase/Firestore** - Database và backend services
- **@xenova/transformers** - AI/ML processing
- **docxtemplater** - Word document processing

### Development Tools
- **React Scripts 5.0.1**
- **ESLint** - Code linting
- **Cross-env** - Cross-platform environment variables

## 📦 Cài đặt

### Yêu cầu
- Node.js (phiên bản 14 trở lên)
- npm hoặc yarn

### Bước cài đặt

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd EventDepartmentWeb
   ```

2. **Cài đặt dependencies**
   ```bash
   npm install
   ```

3. **Cấu hình Firebase**
   - Xem file `FIREBASE_SETUP.md` để biết chi tiết cấu hình Firebase
   - Tạo file `src/backend/firebase/config.js` với thông tin Firebase của bạn

4. **Chạy ứng dụng**
   ```bash
   # Windows
   npm start

   # Unix/Mac
   npm run start:unix
   ```

5. **Build cho production**
   ```bash
   npm run build
   ```

## 🔑 Đăng nhập

### Admin
- Nhấn nút **Admin** trên màn hình đăng nhập
- Nhập mật khẩu: `eventleader`
- Có quyền truy cập tất cả tính năng, bao gồm quản lý members

### Member
- Nhấn nút **Member** trên màn hình đăng nhập
- Không cần mật khẩu
- Truy cập các tính năng công khai (không bao gồm quản lý members)

## 📁 Cấu trúc dự án

```
src/
├── frontend/
│   ├── components/      # React components
│   │   ├── Common/      # Components dùng chung
│   │   ├── Layout/      # Layout components
│   │   ├── Vendor/      # Vendor-related components
│   │   └── Weather/     # Weather widget
│   ├── contexts/        # React contexts (Auth)
│   ├── pages/           # Page components
│   ├── styles/          # Global styles
│   └── theme/           # Theme configuration
├── backend/
│   ├── firebase/        # Firebase configuration
│   └── services/        # Backend services
│       ├── configService.js
│       ├── guideService.js
│       ├── inventoryService.js
│       ├── memberService.js
│       ├── removeBgService.js
│       └── vendorService.js
└── image/               # Static images
```

## 📄 Các trang chính

| Route | Trang | Quyền truy cập |
|-------|-------|----------------|
| `/` | Dashboard | Tất cả |
| `/vendors` | Vendor Management | Tất cả |
| `/inventory` | Kho vật phẩm | Tất cả |
| `/members` | Members Management | Admin only |
| `/members/import` | Import Members | Admin only |
| `/members/:semester` | Member Scores | Admin only |
| `/event-guide` | Event Guide | Tất cả |
| `/tax-lookup` | Tra cứu MST | Tất cả |
| `/remove-bg` | Remove Background | Tất cả |
| `/login` | Đăng nhập | Public |

## 🔧 Scripts

- `npm start` - Chạy ứng dụng development server (Windows)
- `npm run start:unix` - Chạy ứng dụng development server (Unix/Mac)
- `npm run build` - Build ứng dụng cho production
- `npm test` - Chạy tests

## 🔐 Bảo mật

- Admin password được hardcode trong code (chỉ dùng cho development/demo)
- Các route admin được bảo vệ bởi `AdminProtectedRoute`
- Authentication state được quản lý bởi `AuthContext`

## 📝 Lưu ý

- Ứng dụng sử dụng Firebase Firestore làm database
- Đảm bảo đã cấu hình Firebase trước khi chạy
- Một số tính năng yêu cầu quyền admin
- File CSV/XLSX import phải tuân theo format chuẩn

## 🤝 Đóng góp

Dự án này thuộc về CLB Truyền thông Cóc Sài Gòn. Mọi đóng góp và đề xuất đều được chào đón.

## 📄 License

Private project - All rights reserved

---

**Version:** 1.0.0  
**Maintained by:** Event Department - CSG
