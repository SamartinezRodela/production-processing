import { environment } from '../../environments/environment';

export const APP_CONFIG = {
  // ✅ CAMBIO: Ya no hardcodeamos API_URL, se obtiene dinámicamente via ApiUrlService
  PROGRESS_INTERVAL: environment.app.progressInterval,
  VALID_FILE_TYPES: environment.validFileTypes,
  MAX_FILE_SIZE: environment.limits.maxFileSize,
  MAX_FILES: environment.limits.maxFiles,
  APP_NAME: environment.app.name,
  VERSION: environment.app.version,
} as const;

export const STORAGE_KEYS = {
  IS_LOGGED_IN: 'isLoggedIn',
  USERNAME: 'username',
  THEME: 'theme',
  APP_SETTINGS: 'appSettings',
} as const;

export const ROUTES = {
  LOGIN: '/login',
  HOME: '/',
  SETUP: '/Set-Up',
} as const;
