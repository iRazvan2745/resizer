import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { z } from 'zod';

// Initialize Upstash Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// Rate limiter setup
const ratelimit = new Ratelimit({
  redis, // Pass the Upstash Redis instance
  limiter: Ratelimit.fixedWindow(10, '1m'), // 10 requests per minute
});

// Input validation schema
const resizeSchema = z.object({
  imageData: z.string().nonempty(),
  width: z.number().min(1).max(2000),
  height: z.number().min(1).max(2000),
});

export async function POST(req: Request) {
  try {
    // Extract IP address for rate-limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { imageData, width, height } = resizeSchema.parse(body);

    const cacheKey = `img:${Buffer.from(imageData).toString('base64').slice(0, 32)}:${width}x${height}`;
    const cachedImage = await redis.get<string>(cacheKey);

    if (cachedImage) {
      return NextResponse.json({ imageData: cachedImage });
    }

    // Placeholder: Add your image processing logic here
    // Example: After processing, you would cache the result
    await redis.set(cacheKey, imageData, { ex: 60 * 60 * 24 * 7 }); // Cache for 7 days

    return NextResponse.json({ imageData });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
  }
}
