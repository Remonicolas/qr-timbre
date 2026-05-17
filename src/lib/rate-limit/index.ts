// ============================================================
// QR BELL - Rate Limiting (Upstash Redis compatible)
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import type { RateLimitResult } from '@/types'

// In-memory fallback for development
const inMemoryStore = new Map<string, { count: number; reset: number }>()

async function rateLimitInMemory(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now()
  const entry = inMemoryStore.get(key)

  if (!entry || entry.reset < now) {
    inMemoryStore.set(key, { count: 1, reset: now + windowMs })
    return { success: true, limit, remaining: limit - 1, reset: now + windowMs }
  }

  entry.count++

  if (entry.count > limit) {
    return { success: false, limit, remaining: 0, reset: entry.reset }
  }

  return { success: true, limit, remaining: limit - entry.count, reset: entry.reset }
}

async function rateLimitRedis(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env

  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    return rateLimitInMemory(key, limit, windowMs)
  }

  try {
    const windowSec = Math.ceil(windowMs / 1000)
    const now = Date.now()

    const response = await fetch(`${UPSTASH_REDIS_REST_URL}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, windowSec],
      ]),
    })

    const results = await response.json() as [{ result: number }, { result: number }]
    const count = results[0]?.result ?? 1

    const remaining = Math.max(0, limit - count)
    const reset = now + windowMs

    return {
      success: count <= limit,
      limit,
      remaining,
      reset,
    }
  } catch {
    return rateLimitInMemory(key, limit, windowMs)
  }
}

export async function rateLimit(
  identifier: string,
  options: {
    limit?: number
    windowMs?: number
    prefix?: string
  } = {}
): Promise<RateLimitResult> {
  const {
    limit = parseInt(process.env.RATE_LIMIT_API_MAX ?? '100'),
    windowMs = parseInt(process.env.RATE_LIMIT_API_WINDOW_MS ?? '60000'),
    prefix = 'rl',
  } = options

  const key = `${prefix}:${identifier}`
  return rateLimitRedis(key, limit, windowMs)
}

export async function rateLimitRing(identifier: string): Promise<RateLimitResult> {
  return rateLimit(identifier, {
    limit: parseInt(process.env.RATE_LIMIT_RING_MAX ?? '3'),
    windowMs: parseInt(process.env.RATE_LIMIT_RING_WINDOW_MS ?? '60000'),
    prefix: 'ring',
  })
}

export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Demasiadas solicitudes. Por favor esperá un momento.',
      code: 'RATE_LIMITED',
    },
    {
      status: 429,
      headers: {
        'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
      },
    }
  )
}

export function getRequestIdentifier(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? 
             request.headers.get('x-real-ip') ?? 
             'unknown'
  return ip
}
