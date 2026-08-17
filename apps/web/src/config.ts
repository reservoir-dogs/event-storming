const defaultApiUrl = `${window.location.protocol}//${window.location.hostname}:4000`
const defaultSyncUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:4000`

export const API_URL = import.meta.env.VITE_API_URL || defaultApiUrl
export const SYNC_URL = import.meta.env.VITE_SYNC_URL || defaultSyncUrl
