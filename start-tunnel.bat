@echo off
chcp 65001 > nul
title SimuCrypto - Mở Tunnel Kết Nối Backend Với Vercel

echo ==============================================================
echo    SIMUCRYPTO - KẾT NỐI BACKEND LOCAL VỚI VERCEL ONLINE
echo ==============================================================
echo.
echo [1] Đang kết nối tạo đường hầm HTTPS qua OpenSSH (Serveo)...
echo.
echo * CHÚ Ý: Đường dẫn https://....serveousercontent.com xuất hiện
echo   bên dưới chính là link Backend Online của bạn.
echo.
echo * Hãy copy link đó và dán vào nút ⚙️ trên SimuCryto AI tại Vercel!
echo.
echo --------------------------------------------------------------
ssh -o StrictHostKeyChecking=no -R 80:localhost:5001 serveo.net
pause
