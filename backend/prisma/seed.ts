import { PrismaClient, UserRole, VipTier, VoucherType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Seed Script — Khởi tạo dữ liệu mẫu cho development
 * Bao gồm: Super Admin, Categories, Shipping Zones, Admin Settings, Tags
 */
async function main() {
  console.log('🌱 Bắt đầu seed dữ liệu...');

  // --- 1. Super Admin ---
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@smartfashion.vn' },
    update: {},
    create: {
      email: 'admin@smartfashion.vn',
      passwordHash: adminPassword,
      fullName: 'Super Admin',
      phone: '0912345678',
      role: UserRole.super_admin,
      vipTier: VipTier.none,
      isActive: true,
      emailVerified: true,
      locale: 'vi',
    },
  });
  console.log(`✅ Super Admin: ${superAdmin.email}`);

  // --- 2. Categories (Cây danh mục 2 cấp) ---
  const menCategory = await prisma.category.upsert({
    where: { slug: 'thoi-trang-nam' },
    update: {},
    create: {
      name: 'Thời Trang Nam',
      nameEn: 'Men\'s Fashion',
      slug: 'thoi-trang-nam',
      sortOrder: 1,
    },
  });

  const womenCategory = await prisma.category.upsert({
    where: { slug: 'thoi-trang-nu' },
    update: {},
    create: {
      name: 'Thời Trang Nữ',
      nameEn: 'Women\'s Fashion',
      slug: 'thoi-trang-nu',
      sortOrder: 2,
    },
  });

  const accessoryCategory = await prisma.category.upsert({
    where: { slug: 'phu-kien' },
    update: {},
    create: {
      name: 'Phụ Kiện',
      nameEn: 'Accessories',
      slug: 'phu-kien',
      sortOrder: 3,
    },
  });

  // Danh mục con — Nam
  const menSubCategories = [
    { name: 'Áo Thun Nam', nameEn: 'Men\'s T-Shirts', slug: 'ao-thun-nam', sortOrder: 1 },
    { name: 'Áo Sơ Mi Nam', nameEn: 'Men\'s Shirts', slug: 'ao-so-mi-nam', sortOrder: 2 },
    { name: 'Quần Jeans Nam', nameEn: 'Men\'s Jeans', slug: 'quan-jeans-nam', sortOrder: 3 },
    { name: 'Quần Kaki Nam', nameEn: 'Men\'s Khakis', slug: 'quan-kaki-nam', sortOrder: 4 },
    { name: 'Quần Short Nam', nameEn: 'Men\'s Shorts', slug: 'quan-short-nam', sortOrder: 5 },
  ];

  for (const sub of menSubCategories) {
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: {},
      create: { ...sub, parentId: menCategory.id },
    });
  }

  // Danh mục con — Nữ
  const womenSubCategories = [
    { name: 'Áo Thun Nữ', nameEn: 'Women\'s T-Shirts', slug: 'ao-thun-nu', sortOrder: 1 },
    { name: 'Đầm Váy', nameEn: 'Dresses', slug: 'dam-vay', sortOrder: 2 },
    { name: 'Áo Sơ Mi Nữ', nameEn: 'Women\'s Blouses', slug: 'ao-so-mi-nu', sortOrder: 3 },
    { name: 'Quần Jeans Nữ', nameEn: 'Women\'s Jeans', slug: 'quan-jeans-nu', sortOrder: 4 },
    { name: 'Chân Váy', nameEn: 'Skirts', slug: 'chan-vay', sortOrder: 5 },
  ];

  for (const sub of womenSubCategories) {
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: {},
      create: { ...sub, parentId: womenCategory.id },
    });
  }

  // Danh mục con — Phụ kiện
  const accessorySubCategories = [
    { name: 'Mũ Nón', nameEn: 'Hats & Caps', slug: 'mu-non', sortOrder: 1 },
    { name: 'Túi Xách', nameEn: 'Bags', slug: 'tui-xach', sortOrder: 2 },
    { name: 'Thắt Lưng', nameEn: 'Belts', slug: 'that-lung', sortOrder: 3 },
  ];

  for (const sub of accessorySubCategories) {
    await prisma.category.upsert({
      where: { slug: sub.slug },
      update: {},
      create: { ...sub, parentId: accessoryCategory.id },
    });
  }

  console.log('✅ Categories: 3 danh mục gốc + 13 danh mục con');

  // --- 3. Product Tags ---
  const tags = [
    { name: 'Mới', color: '#22C55E' },
    { name: 'Bán Chạy', color: '#F97316' },
    { name: 'Sale', color: '#EF4444' },
    { name: 'Limited', color: '#8B5CF6' },
    { name: 'Xu Hướng', color: '#06B6D4' },
  ];

  for (const tag of tags) {
    await prisma.productTag.upsert({
      where: { name: tag.name },
      update: {},
      create: tag,
    });
  }
  console.log('✅ Product Tags: 5 nhãn');

  // --- 4. Shipping Zones ---
  // Xóa cũ rồi tạo mới vì không có unique field phù hợp cho upsert
  await prisma.shippingZone.deleteMany();
  await prisma.shippingZone.createMany({
    data: [
      {
        zoneName: 'Nội thành',
        fee: 25000,
        provinces: ['Hồ Chí Minh', 'Hà Nội'],
      },
      {
        zoneName: 'Ngoại thành',
        fee: 35000,
        provinces: ['Bình Dương', 'Đồng Nai', 'Long An', 'Hải Phòng', 'Bắc Ninh', 'Hưng Yên'],
      },
      {
        zoneName: 'Tỉnh xa',
        fee: 50000,
        provinces: ['*'], // * = tất cả tỉnh thành còn lại
      },
    ],
  });
  console.log('✅ Shipping Zones: 3 vùng (25k/35k/50k)');

  // --- 5. Admin Settings ---
  const settings = [
    { key: 'bank_transfer_qr_image', value: '/uploads/admin/qr-bank.png' },
    { key: 'bank_transfer_account_number', value: '0123456789' },
    { key: 'bank_transfer_bank_name', value: 'MB Bank' },
    { key: 'bank_transfer_account_name', value: 'NGUYEN VAN A' },
    { key: 'store_phone', value: '0912345678' },
    { key: 'store_email', value: 'contact@smartfashion.vn' },
    { key: 'store_address', value: '123 Đường ABC, Quận 1, TP.HCM' },
    { key: 'facebook_url', value: 'https://facebook.com/smartfashion' },
    { key: 'instagram_url', value: 'https://instagram.com/smartfashion' },
    { key: 'zalo_url', value: 'https://zalo.me/smartfashion' },
  ];

  for (const setting of settings) {
    await prisma.adminSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log('✅ Admin Settings: 10 cài đặt');

  // --- 6. Blog Categories ---
  const blogCategories = [
    { name: 'Tin Thời Trang', nameEn: 'Fashion News', slug: 'tin-thoi-trang', sortOrder: 1 },
    { name: 'Cách Phối Đồ', nameEn: 'Style Guide', slug: 'cach-phoi-do', sortOrder: 2 },
    { name: 'Xu Hướng', nameEn: 'Trends', slug: 'xu-huong', sortOrder: 3 },
    { name: 'Khuyến Mãi', nameEn: 'Promotions', slug: 'khuyen-mai', sortOrder: 4 },
  ];

  for (const cat of blogCategories) {
    await prisma.blogCategory.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('✅ Blog Categories: 4 chuyên mục');

  console.log('\n🎉 Seed hoàn tất!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
