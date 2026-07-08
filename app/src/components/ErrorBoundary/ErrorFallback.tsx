interface ErrorFallbackProps {
  error?: Error;
}

function ErrorFallback({ error }: ErrorFallbackProps) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="grid-container usa-section">
      <div className="usa-alert usa-alert--error" role="alert">
        <div className="usa-alert__body">
          <p className="usa-alert__heading">Something went wrong</p>
          <p className="usa-alert__text">
            We encountered an unexpected error. Please try refreshing the page.
          </p>
          {isDev && error && (
            <details className="margin-top-2">
              <summary className="cursor-pointer">Error details (dev only)</summary>
              <div className="margin-top-1 padding-2 bg-base-lightest">
                <p className="text-bold">{error.message}</p>
                <pre className="font-mono-3xs margin-top-1 overflow-x-auto">{error.stack}</pre>
              </div>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}

export default ErrorFallback;
