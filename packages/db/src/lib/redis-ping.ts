import Redis from 'ioredis'

async function ping() {
    const redis = new Redis(process.env['REDIS_URL'] as string)
    try {
        const result = await redis.ping()
        console.log('✅ Redis is reachable:', result)
    } catch (err) {
        console.error('❌ Redis is NOT reachable:', (err as Error).message)
        process.exitCode = 1
    } finally {
        redis.disconnect()
    }
}

ping()