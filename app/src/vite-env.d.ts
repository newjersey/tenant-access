/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the search API's CloudFront distribution, with no trailing slash. */
  readonly VITE_API_BASE_URL: string;
  /** GA4 Measurement ID, e.g. "G-XXXXXXXXXX". Unset locally/in tests to disable analytics. */
  readonly VITE_GA_MEASUREMENT_ID?: string;
}
