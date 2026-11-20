/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the private API, with no trailing slash. Also serves photos */
  readonly VITE_API_BASE_URL: string;
   /** Origin serving /auth/*, with no trailing slash. Unset locally, where Vite proxies /auth */
  readonly VITE_AUTH_BASE_URL?: string;
  /** GA4 Measurement ID, e.g. "G-XXXXXXXXXX". Unset locally/in tests to disable analytics. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
}
