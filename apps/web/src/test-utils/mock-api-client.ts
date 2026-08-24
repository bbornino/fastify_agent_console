import { apiClient } from '@/lib/api-client'
import { vi } from 'vitest'

export const mockApiClient = {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
}

vi.mock('@/lib/api-client', () => ({
    apiClient: mockApiClient,
}))