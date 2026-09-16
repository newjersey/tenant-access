/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Origin of the search API's CloudFront distribution, with no trailing slash. */
  readonly VITE_API_BASE_URL: string;
}
