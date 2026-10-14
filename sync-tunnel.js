import { spawn } from 'child_process';

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
      console.log('✅ ĐÃ ĐỒNG BỘ THÀNH CÔNG VỚI VERCEL BẰNG MAPPING KEY!');
      console.log(`🌐 Backend URL: ${tunnelUrl}`);
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
  console.log('📡 Đang kết nối tạo HTTPS tunnel cho Backend port 5001...');
  
  const ssh = spawn('ssh', [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=30',
    '-o', 'ServerAliveCountMax=3',
    '-R', '80:localhost:5001',
    'serveo.net'
  ]);

  let matched = false;

  const onData = async (chunk) => {
    const text = chunk.toString();
    const match = text.match(/https:\/\/[a-zA-Z0-9.\-_]+serveousercontent\.com/);
    if (match && !matched) {
      matched = true;
      const tunnelUrl = match[0];
      console.log(`\n🔗 Nhận đường hầm HTTPS: ${tunnelUrl}`);
      await updateRemoteKey(tunnelUrl);
    }
  };

  ssh.stdout.on('data', onData);
  ssh.stderr.on('data', onData);

  ssh.on('close', (code) => {
    console.log(`\n⚠️ Kết nối bị đóng (mã ${code}). Đang thử kết nối lại sau 3 giây...`);
    setTimeout(startTunnel, 3000);
  });

  ssh.on('error', (err) => {
    console.error('Lỗi SSH:', err.message);
  });
}

startTunnel();
