const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_DOiXL9twe1Gz@ep-dark-grass-arho7d1s-pooler.c-4.us-west-2.aws.neon.tech/neondb?sslmode=require' }
  }
});

const firstNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const middleNames = ['Văn', 'Thị', 'Đức', 'Minh', 'Ngọc', 'Quốc', 'Thanh', 'Hải', 'Gia', 'Anh', 'Thành', 'Thu', 'Bảo', 'Kim'];
const lastNames = ['An', 'Bình', 'Cường', 'Dũng', 'Dương', 'Hà', 'Hải', 'Hậu', 'Hiếu', 'Hoàng', 'Huy', 'Khoa', 'Kiên', 'Linh', 'Long', 'Mai', 'Minh', 'Nam', 'Nghĩa', 'Phong', 'Phúc', 'Quân', 'Sơn', 'Tài', 'Tâm', 'Thắng', 'Thịnh', 'Thu', 'Trang', 'Trí', 'Trung', 'Tuấn', 'Tùng', 'Vinh', 'Vy', 'Yến'];

const samplePairs = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'LINKUSDT'];

function randomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function removeAccents(str) {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

// Bắt đầu từ thứ 5 tuần trước (08/10/2026) đến 15/10/2026
const START_DATE = new Date('2026-10-08T08:30:00.000+07:00').getTime();
const END_DATE = new Date('2026-10-15T09:30:00.000+07:00').getTime();

async function main() {
  console.log('🌱 Bắt đầu tạo 38 người dùng từ thứ 5 tuần trước (08/10/2026)...');
  const defaultPasswordHash = await bcrypt.hash('Crypto@2026', 10);

  // Sinh 38 mốc thời gian ngẫu nhiên và sắp xếp theo thứ tự thời gian
  const timestamps = [];
  for (let i = 0; i < 38; i++) {
    const time = START_DATE + Math.random() * (END_DATE - START_DATE);
    timestamps.push(new Date(time));
  }
  timestamps.sort((a, b) => a.getTime() - b.getTime());

  const usedEmails = new Set();
  const createdUsers = [];

  for (let i = 0; i < 38; i++) {
    const fName = randomElement(firstNames);
    const mName = randomElement(middleNames);
    const lName = randomElement(lastNames);
    const displayName = `${fName} ${mName} ${lName}`;

    const cleanName = removeAccents(`${fName}${lName}`).toLowerCase();
    const tag = Math.floor(100 + Math.random() * 900);
    const domain = randomElement(['gmail.com', 'yahoo.com', 'outlook.com', 'fpt.edu.vn', 'crypto.vn']);
    let email = `${cleanName}${tag}@${domain}`;

    while (usedEmails.has(email)) {
      email = `${cleanName}${Math.floor(1000 + Math.random() * 9000)}@${domain}`;
    }
    usedEmails.add(email);

    const username = `${cleanName}_${tag}`;
    const createdAt = timestamps[i];
    
    // Last login sau khi tạo tài khoản từ 10 phút đến vài ngày
    const loginDelay = Math.random() * (END_DATE - createdAt.getTime());
    const lastLoginAt = new Date(createdAt.getTime() + loginDelay);

    const isPro = false;
    const role = 0;
    const proExpiryDate = null;

    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random&color=fff&size=128`;

    // Khởi tạo số dư ảo và trades
    const initialBalance = 10000;
    const pnlMultiplier = 0.85 + Math.random() * 0.45; // lãi/lỗ ngẫu nhiên
    const virtualBalance = Number((initialBalance * pnlMultiplier).toFixed(2));

    const user = await prisma.user.create({
      data: {
        email,
        username,
        displayName,
        passwordHash: defaultPasswordHash,
        avatarUrl,
        role,
        isActive: true,
        proExpiryDate,
        createdAt,
        updatedAt: lastLoginAt,
        lastLoginAt,
        portfolioAccount: {
          create: {
            initialVirtualBalance: initialBalance,
            virtualBalance,
            createdAt,
            updatedAt: lastLoginAt,
          }
        }
      },
      include: {
        portfolioAccount: true
      }
    });

    createdUsers.push(user);

    // Tạo lịch sử giao dịch mô phỏng (từ 1 đến 5 giao dịch)
    const numTrades = Math.floor(Math.random() * 5);
    for (let t = 0; t < numTrades; t++) {
      const pair = randomElement(samplePairs);
      const side = Math.random() > 0.5 ? 'buy' : 'sell';
      const price = pair === 'BTCUSDT' ? 70000 + Math.random() * 5000 : 2500 + Math.random() * 300;
      const quantity = pair === 'BTCUSDT' ? Number((0.01 + Math.random() * 0.05).toFixed(4)) : Number((0.2 + Math.random() * 1.5).toFixed(3));
      const totalValue = Number((price * quantity).toFixed(2));
      const tradeTime = new Date(createdAt.getTime() + Math.random() * (lastLoginAt.getTime() - createdAt.getTime()));

      await prisma.trade.create({
        data: {
          accountId: user.portfolioAccount.id,
          pairSymbol: pair,
          side,
          quantity,
          price,
          totalValue,
          feeValue: Number((totalValue * 0.001).toFixed(2)),
          executedAt: tradeTime,
        }
      });
    }

    // Tạo hoạt động người dùng
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        action: 'Đăng ký tài khoản',
        details: 'Gia nhập nền tảng SimuCrypto qua hệ thống',
        createdAt,
      }
    });

    console.log(`[${i + 1}/38] Đã tạo: ${displayName} (${email}) - Ngày tạo: ${createdAt.toLocaleDateString('vi-VN')} ${createdAt.toLocaleTimeString('vi-VN')} - VIP: ${isPro ? 'Có ⭐' : 'Free'}`);
  }

  // Đảm bảo có 1 tài khoản Admin để truy cập AdminView
  const adminEmail = 'admin@simucrypto.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: adminEmail,
        username: 'admin_master',
        displayName: 'Quản Trị Viên (Admin)',
        passwordHash: defaultPasswordHash,
        role: 999,
        isActive: true,
        avatarUrl: 'https://ui-avatars.com/api/?name=Admin+Master&background=0D8ABC&color=fff',
        portfolioAccount: {
          create: {
            initialVirtualBalance: 0,
            virtualBalance: 0,
          }
        }
      }
    });
    console.log('\n👑 Đã tạo tài khoản Admin mặc định: admin@simucrypto.com (Pass: Crypto@2026)');
  }

  const totalUsers = await prisma.user.count();
  console.log(`\n🎉 HOÀN TẤT! Tổng số người dùng trong cơ sở dữ liệu hiện tại: ${totalUsers}`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
