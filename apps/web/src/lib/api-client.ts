import axios from 'axios'
import { useAuthStore } from '../stores/auth-store'

export const apiClient = axios.create({
    baseURL: 'http://localhost:3000',
})

// Attach the access token to every outgoing request
apiClient.interceptors.request.use((config) => {
    const accessToken = useAuthStore.getState().accessToken
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
})

// On a 401, try to silently refresh the token, then retry the original request
let isRefreshing = false
let refreshQueue: Array<(token: string) => void> = []

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error)
        }

        if (isRefreshing) {
            return new Promise((resolve) => {
                refreshQueue.push((newAccessToken: string) => {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
                    resolve(apiClient(originalRequest))
                })
            })
        }

        originalRequest._retry = true
        isRefreshing = true

        try {
            const refreshToken = useAuthStore.getState().refreshToken
            const response = await axios.post('http://localhost: 3000/auth/refresh', {
                refreshToken,
            })

            const { accessToken, refreshToken: newRefreshToken } = response.data
            useAuthStore.getState().setTokens(accessToken, newRefreshToken)
            refreshQueue.forEach((cb) => cb(accessToken))
            refreshQueue = []

            originalRequest.headers.Authorization = `Bearer ${accessToken}`
            return apiClient(originalRequest)
        } catch (refreshError) {
            useAuthStore.getState().logout()
            return Promise.reject(refreshError)
        } finally {
            isRefreshing = false
        }
    }
)