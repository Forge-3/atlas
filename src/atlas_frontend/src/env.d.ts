/// <reference path="../.astro/types.d.ts" />
interface ImportMetaEnv {
    readonly PUBLIC_DISCORD_CLIENT_ID: string;
    readonly PUBLIC_DISCORD_REDIRECT_URI: string;
    // more env variables...
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }