import { minioClient } from './minio-client'

async function ping() {
    try {
        const bucket = process.env['MINIO_BUCKET'] as string;
        const exists = await minioClient.bucketExists(bucket)

        if (!exists) {
            await minioClient.makeBucket(bucket)
            console.log(`✅ MinIO is reachable - created bucket "${bucket}"`)
        } else {
            console.log(`✅ MinIO is reachable - bucket "${bucket}" already exists`)
        }
    } catch (err) {
        console.error('❌ MinIO is NOT reachable:', (err as Error).message)
        process.exitCode = 1
    }
}

ping()