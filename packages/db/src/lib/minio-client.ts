import { Client } from 'minio'

export const minioClient = new Client({
    endPoint: process.env['MINIO_ENDPOINT'] as string,
    port: parseInt(process.env['MINIO_PORT'] as string, 10),
    useSSL: false,
    accessKey: process.env['MINIO_ACCESS_KEY'] as string,
    secretKey: process.env['MINIO_SECRET_KEY'] as string,
})