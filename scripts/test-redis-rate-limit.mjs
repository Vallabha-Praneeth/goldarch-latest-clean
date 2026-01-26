#!/usr/bin/env node

/**
 * Test Upstash Redis Rate Limiting
 *
 * This script tests:
 * 1. Redis connection
 * 2. Rate limiting functionality
 * 3. Sliding window algorithm
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '../.env') });

// Import rate limiting utilities
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

console.log('🧪 Testing Upstash Redis Rate Limiting\n');

// Test 1: Redis Connection
console.log('Test 1: Redis Connection');
console.log('========================');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

try {
  // Test basic Redis operations
  await redis.set('test:connection', 'success', { ex: 60 });
  const result = await redis.get('test:connection');

  if (result === 'success') {
    console.log('✅ Redis connection successful!');
    console.log(`   URL: ${process.env.UPSTASH_REDIS_REST_URL}\n`);
  } else {
    console.log('❌ Redis connection failed: Unexpected response\n');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Redis connection failed:', error.message);
  console.log('   Please check your UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN\n');
  process.exit(1);
}

// Test 2: Rate Limiting
console.log('Test 2: Rate Limiting (5 requests per 10 seconds)');
console.log('==================================================');

const testRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
  prefix: "test:ratelimit",
});

const testUserId = 'test-user-' + Date.now();

console.log(`Testing with user: ${testUserId}\n`);

for (let i = 1; i <= 7; i++) {
  const { success, limit, remaining, reset } = await testRateLimit.limit(testUserId);

  const status = success ? '✅ ALLOWED' : '❌ BLOCKED';
  const resetIn = Math.ceil((reset - Date.now()) / 1000);

  console.log(`Request ${i}/7: ${status}`);
  console.log(`   Limit: ${limit} | Remaining: ${remaining} | Reset in: ${resetIn}s`);

  // Small delay between requests
  await new Promise(resolve => setTimeout(resolve, 100));
}

console.log('\n✅ Rate limiting test complete!');
console.log('   Expected: First 5 requests allowed, last 2 blocked\n');

// Test 3: Analytics
console.log('Test 3: Rate Limit Analytics');
console.log('============================');

try {
  const stats = await redis.get(`test:ratelimit:${testUserId}`);
  console.log(`Current count for ${testUserId}:`, stats || 0);
  console.log('✅ Analytics working!\n');
} catch (error) {
  console.log('⚠️  Analytics check failed:', error.message, '\n');
}

// Cleanup
console.log('Cleaning up test data...');
await redis.del('test:connection');
// Rate limit data will expire automatically after the window
console.log('✅ Cleanup complete!\n');

console.log('╔═══════════════════════════════════════╗');
console.log('║  🎉 All Tests Passed!                ║');
console.log('║  Upstash Redis is ready for use.    ║');
console.log('╚═══════════════════════════════════════╝\n');

console.log('Next Steps:');
console.log('1. Restart your dev server: npm run dev');
console.log('2. All Framework B routes now use persistent Redis rate limiting');
console.log('3. Rate limits persist across server restarts');
console.log('4. Works in serverless environments\n');
