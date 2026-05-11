import { ConfigService } from '@nestjs/config';

export interface RedisConnectionOptions {
  host?: string;
  port?: number;
  password?: string;
  url?: string;
}

/**
 * Build Redis connection options from environment variables.
 * Priority:
 * 1. REDIS_URL - if provided, use it directly (most compatible with cloud providers)
 * 2. REDIS_HOST + REDIS_PORT (with optional REDIS_PASSWORD)
 *
 * Environment variables supported:
 * - REDIS_URL: Full Redis URL (e.g., redis://:password@host:port)
 * - REDIS_HOST: Redis host (default: localhost)
 * - REDIS_PORT: Redis port (default: 6379)
 * - REDIS_PASSWORD: Optional password for Redis auth
 */
export function getRedisConfig(
  configService: ConfigService,
): RedisConnectionOptions {
  const redisUrl = configService.get<string>('REDIS_URL');

  if (redisUrl) {
    return { url: redisUrl };
  }

  const options: RedisConnectionOptions = {
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
  };

  const redisPassword = configService.get<string>('REDIS_PASSWORD');
  if (redisPassword) {
    options.password = redisPassword;
  }

  return options;
}

/**
 * Factory function for BullModule configuration
 */
export const getBullModuleConfig = () => ({
  connection: {
    // BullModule will accept connection options directly
  },
});
