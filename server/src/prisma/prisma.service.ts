import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Database connected successfully');
    } catch (err: any) {
      console.warn('⚠️ Database connection warning:', err.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
