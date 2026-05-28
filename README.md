# SOSBIKE Admin (React)

Admin web app (React) để quản lý SOSBIKE: Orders, Finance, Membership, Services/Garages, Reviews, Analytics và **Config**.

## Yêu cầu

- Node.js >= 18

## Chạy dev

```bash
cd SOSBIKE_ADMIN_REACT
npm install
npm run dev
```

## Cấu hình

- API base URL: tạo file `.env.local`

```bash
VITE_API_BASE_URL=https://<your-ngrok>.ngrok-free.dev/api
```

## Ghi chú

- Tab **Config** hiện lưu tạm vào `localStorage` (để bạn dùng ngay).
- Khi BE có endpoint config (ví dụ `/api/admin/config`), chỉ cần thay `src/features/config/configApi.ts`.

