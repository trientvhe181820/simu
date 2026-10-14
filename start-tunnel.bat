@echo off
chcp 65001 > nul
title SimuCrypto - Tự Động Kết Nối Backend Local Với Vercel

echo ==============================================================
echo    SIMUCRYPTO - TỰ ĐỘNG ĐỒNG BỘ BACKEND LOCAL LÊN VERCEL
echo ==============================================================
echo.
echo [*] Đang khởi động đường hầm HTTPS và tự động ánh xạ bằng Secret Key...
echo.
node sync-tunnel.js
pause
