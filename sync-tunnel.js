import { spawn } from 'child_process';
import path from 'path';

const MAPPING_OBJECT_ID = 'ff808181a09d98f701a13bed8e9761ff';
const REGISTRY_URL = `https://api.restful-api.dev/objects/${MAPPING_OBJECT_ID}`;

async function updateRemoteKey(tunnelUrl) {
  try {
    const res = await fetch(REGISTRY_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'simucrypto_trien_mapping',
        data: {
          url: tunnelUrl,
          updatedAt: new Date().toISOString(),
        },
      }),
    });
    if (res.ok) {
      console.log('------------------------------------------------------------');
      console.log('✅ ĐÃ ĐỒNG BỘ THÀNH CÔNG VỚI VERCEL QUA CLOUDFLARE TUNNEL!');
      console.log(`🌐 Backend Cloudflare URL: ${tunnelUrl}`);
      console.log('🚀 Ứng dụng Vercel sẽ TỰ ĐỘNG kết nối tới Backend này mà không cần cấu hình gì thêm.');
      console.log('------------------------------------------------------------');
    } else {
      console.warn('⚠️ Không thể cập nhật key lên cloud registry, status:', res.status);
    }
  } catch (err) {
    console.error('⚠️ Lỗi khi cập nhật key:', err.message);
  }
}

function startTunnel() {
  console.log('📡 Đang khởi động Cloudflare Tunnel cho Backend port 5001...');
  
  const cfExe = path.resolve(process.cwd(), 'cloudflared.exe');
  const cf = spawn(cfExe, ['tunnel', '--url', 'http://localhost:5001']);

  let matched = false;

  const onData = async (chunk) => {
    const text = chunk.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9.\-_]+\.trycloudflare\.com/);
    if (match && !matched) {
      matched = true;
      const tunnelUrl = match[0];
      console.log(`\n🔗 Nhận đường hầm Cloudflare HTTPS: ${tunnelUrl}`);
      await updateRemoteKey(tunnelUrl);
    }
  };

  cf.stdout.on('data', onData);
  cf.stderr.on('data', onData);

  cf.on('close', (code) => {
    console.log(`\n⚠️ Tunnel đóng (mã ${code}). Khởi động lại sau 2 giây...`);
    setTimeout(startTunnel, 2000);
  });

  cf.on('error', (err) => {
    console.error('Lỗi Cloudflare Tunnel:', err.message);
  });
}

startTunnel();
