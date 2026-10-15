const fs = require('fs');
const path = require('path');

// Tự động tìm file entry point (dist/src/main.js hoặc dist/main.js)
const candidates = [
  path.join(__dirname, 'dist', 'src', 'main.js'),
  path.join(__dirname, 'dist', 'main.js'),
];

let entryPoint = candidates.find(f => fs.existsSync(f));

if (!entryPoint) {
  console.error('❌ Không tìm thấy file dist/src/main.js hoặc dist/main.js. Vui lòng chạy npm run build trước!');
  process.exit(1);
}

console.log(`🚀 Đang khởi động NestJS server từ: ${entryPoint}`);
require(entryPoint);
