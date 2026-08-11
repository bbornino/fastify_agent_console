import { Pool } from 'pg'
async function ping() {
    const pool = new Pool({ connectionString: process.env['DATABASE_URL'] })
    try {
        await pool.query('SELECT 1')
        console.log('✅ Postgres is reachable')
    } catch (err) {
        console.error('❌ Postgres is NOT reachable:', (err as Error).message)
        process.exitCode = 1
    } finally {
        await pool.end()
    }
}

ping()