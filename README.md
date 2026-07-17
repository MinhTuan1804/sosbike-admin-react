# SOSBIKE Admin (React)

Admin web app (React) để quản lý SOSBIKE: đơn cứu hộ, tài chính, gói thành viên, dịch vụ/garage, đánh giá, phân tích và cấu hình hệ thống.

## Yêu cầu

- Node.js >= 18

## Chạy dev

```bash
cd SOSBIKE_ADMIN_REACT
npm install
npm run dev
```

## Cấu hình

- API base URL mặc định trong code đang trỏ tới server online:

```bash
https://api.sosbike.io.vn/api
```

- Nếu cần test môi trường khác, tạo `.env.local` và đặt:

```bash
VITE_API_BASE_URL=https://api.sosbike.io.vn/api
```

## Ghi chú

- Không commit `.env`, `.env.local`, credential Firebase/Google hoặc file seed/reset dữ liệu local.
- Khi cần test local, chỉ đổi cấu hình tạm ở `.env.local` hoặc chạy bằng biến môi trường, không sửa lan man vào source.
