import { useEffect, useState } from "react";
import { type AuthSession, authUrl, getSession } from "@/clients/auth";
import content from "@/data/content/en/common.json";

const AccountNav = () => {
  const [session, setSession] = useState<AuthSession | undefined>();

  useEffect(() => {
    const controller = new AbortController();

    getSession(controller.signal)
      .then(setSession)
      .catch(() => {
        if (!controller.signal.aborted) {
          setSession({ signedIn: false });
        }
      });

    return () => controller.abort();
  }, []);

  if (!session) return null;

  if (!session.signedIn) {
    return (
      <a className="usa-button" href={authUrl("/auth/login")}>
        {content.header.signinOrRegister}
      </a>
    );
  }

  return (
    <div className="display-flex flex-align-center">
      <span className="margin-right-2">{session.email}</span>
      <a className="usa-button usa-button--outline" href={authUrl("/auth/logout")}>
        {content.header.logout}
      </a>
    </div>
  );
};

export default AccountNav;
