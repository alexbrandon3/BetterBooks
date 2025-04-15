/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_ENABLE_AI_CLASSIFICATION: string
  readonly VITE_ENABLE_DOCUMENT_UPLOAD: string
  readonly VITE_ANALYTICS_ID: string
  readonly VITE_SENTRY_DSN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 