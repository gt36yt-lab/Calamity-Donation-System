/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STELLAR_NETWORK?: "testnet" | "public";
  readonly VITE_LGU_WALLET?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
