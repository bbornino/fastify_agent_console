// An empty string as baseURL in Axios just means "use relative URLs" — so a call to /me stays /me, 
// hits :4200 first, and Vite's proxy quietly forwards it to :3000 behind the scenes.
export const API_BASE_URL = ''