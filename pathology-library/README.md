# PathologyLib + Atlas GPB

## Tra cứu ICD-O-4

Mô-đun `/icdo` lập chỉ mục bảng cuối cùng ICD-O-4 của IARC/WHO, cho phép tra cứu riêng hai trục vị trí và hình thái bằng tiếng Việt, tiếng Anh, mã hoặc từ viết tắt.

Làm mới dữ liệu từ ba bảng Excel chính thức:

```powershell
python scripts/import-icdo4.py --catalog ICD-O-4.xlsx --morphology-annexes Morphology_annexes.xlsx --topography-annexes Topography_annexes.xlsx --output public/icdo-data/icdo4-catalog.json
npm run verify:icdo
```

Ung dung Nuxt 3 tich hop thu vien mo benh hoc, Atlas GPB song ngu va cong cu tra cuu HMMD trong cung mot giao dien va cung tai khoan Supabase.

## Chuc nang chinh

- `/`: thu vien ca benh hien co cua `lib_hospital`.
- `/atlas`: 120 ho so Atlas theo 16 nhom co quan, tim kiem song ngu va tra cuu theo hinh thai.
- `/atlas?view=who`: 4.487 muc WHO/IARC voi lien ket truc tiep den chuong/muc nguon.
- `/atlas?view=images`: 1.004 gallery WebPathology voi lien ket truc tiep den gallery nguon.
- `/hmmd`: tra cuu 3.924 ca HMMD theo chan doan, co quan, ICD va dau an duong/am.
- Atlas va HMMD deu yeu cau phien dang nhap Supabase hop le.
- Nguoi dung da dang nhap co the thay anh va them ho so Atlas rieng; tai khoan `admin`/`editor` co the chia se noi dung.

> Day la cong cu hoc tap, khong thay the chan doan cua bac si giai phau benh. Noi dung tu nguon ben ngoai duoc lien ket den trang goc; can doi chieu phien ban WHO/IARC, ICD-O va huong dan chuyen nganh hien hanh truoc khi su dung lam sang.

## Cai dat

Yeu cau Node.js 20 tro len.

```bash
npm install
npm run dev
```

Ung dung mac dinh chay tai `http://localhost:3000`.

## Bien moi truong

Tao `.env` tu `.env.example` va khai bao:

```env
NUXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NUXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_KEY
```

Khong commit `.env`, service-role key hoac mat khau nguoi dung vao Git.

## Khoi tao Supabase cho Atlas

Du an lib_hospital da dung schema `lib_hospital`. De bat luu anh va ho so Atlas tren may chu:

1. Mo Supabase Dashboard cua du an.
2. Vao `SQL Editor` va chay toan bo noi dung trong `supabase/migrations/202608310001_integrated_atlas.sql`.
3. Xac nhan hai bang `lib_hospital.atlas_image_overrides`, `lib_hospital.atlas_custom_cases` va bucket `atlas-images` da duoc tao.
4. Tai lai `/atlas`. Thong bao luu cuc bo se bien mat khi migration hoat dong.

Migration kem RLS: nguoi dung chi sua/xoa du lieu cua minh; noi dung `is_shared` chi duoc tao boi tai khoan co vai tro `admin` hoac `editor`.

## Cap nhat du lieu Atlas

Du lieu duoc xuat tu workspace Atlas hien co bang:

```bash
npm run atlas:refresh
```

Lenh nay tao lai cac tep trong `public/atlas-data/` va `server/data/hmmd-data.json`. Sau khi cap nhat, chay lai build va kiem tra tim kiem song ngu, lien ket nguon va cac anh dai dien.

## Kiem tra production

```bash
npm run build
npm run preview
```

Checklist toi thieu:

- Nguoi chua dang nhap vao `/atlas` hoac `/hmmd` bi chuyen den `/login` va quay lai dung trang sau khi dang nhap.
- Goi truc tiep `/api/hmmd` khi khong co access token tra ve `401`.
- Tim `ung thu vu`, `small cell lung carcinoma`, `da day` tra dung nhom co quan.
- Nut nguon mo dung trang WHO/IARC, PathologyOutlines, WebPathology hoac Wikimedia da gan cho ho so.
- Them/thay anh chi thanh cong sau khi migration Atlas da duoc ap dung.

## Trien khai Vercel

Lien ket repository voi Vercel, dat hai bien moi truong Supabase cho Production/Preview va deploy nhu mot du an Nuxt. Vercel se chay `npm run build`.
