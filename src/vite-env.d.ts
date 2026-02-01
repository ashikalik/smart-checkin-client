/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ELEVENLABS_TOKEN_URL: string;
  readonly VITE_QUERY_SERVICE_URL: string;
  readonly VITE_XI_API_KEY: string;
  readonly VITE_BOOKING_URL: string;
  readonly VITE_ELEVENLABS_BASE_URL: string;
  readonly VITE_ELEVENLABS_TOKEN_KEY: string;
  readonly VITE_ELEVENLABS_QUERY_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
