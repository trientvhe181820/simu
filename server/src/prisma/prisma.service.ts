import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const NEON_DEFAULT_URL = 'postgresql://neondb_owner:npg_DOiXL9twe1Gz@ep-dark-grass-arho7d1s-pooler.c-4.us-west-2.aws.neon.tech/neondb?sslmode=require';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL || NEON_DEFAULT_URL,
        },
      },
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ Database connected successfully to Neon PostgreSQL');
    } catch (err: any) {
      console.warn('⚠️ Database connection warning:', err.message);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
