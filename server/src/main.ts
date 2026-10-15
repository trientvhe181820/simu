import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { loadBinanceSymbols } from './chat/utils/symbol-extractor';
import { BinanceService } from './binance/binance.service';


async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const binanceService = app.get(BinanceService);
  try {
    await loadBinanceSymbols(binanceService);
  } catch (err: any) {
    console.warn('⚠️ [Binance Init] Không thể tải danh sách coin trực tiếp, sử dụng danh sách fallback:', err?.message || err);
  }
  app.enableCors({
    origin: true, // Cho phép tất cả origin kể cả Vercel và localhost với credentials
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running at http://localhost:${port}`);
}

bootstrap();