/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly PROD: boolean;
  // add more env vars here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}