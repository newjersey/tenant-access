import { useRouteError } from "react-router-dom";
import ErrorFallback from "./ErrorFallback";

function RouteErrorFallback() {
  const error = useRouteError() as Error;

  return <ErrorFallback error={error} />;
}

export default RouteErrorFallback;
