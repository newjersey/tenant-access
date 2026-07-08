import { Link } from "react-router-dom";
import content from "@/data/content/en/register.json";

function RegisterPage() {
  return (
    <form className="usa-form ">
      <fieldset className="usa-fieldset">
        <legend className="usa-legend font-heading-xl text-bold">{content.heading}</legend>
        <span>
          or{" "}
          <Link to="/signin" className="usa-nav__link">
            <span>{content.signinCta}</span>
          </Link>
        </span>

        <label htmlFor="username" className="usa-label ">
          {content.emailLabel}
        </label>

        <input
          id="username"
          name="username"
          type="text"
          autoCapitalize="off"
          autoCorrect="off"
          className="usa-input"
        />

        <div>
          <label htmlFor="password-sign-in" className="usa-label">
            {content.passwordLabel}
          </label>

          <input id="password-sign-in" name="password" type="password" className="usa-input" />
        </div>

        <div>
          <label htmlFor="password-sign-in-confirm" className="usa-label">
            {content.confirmPasswordLabel}
          </label>

          <input
            id="password-sign-in-confirm"
            name="password"
            type="password"
            className="usa-input"
          />
        </div>

        <button className="usa-button" type="submit">
          {content.formCta}
        </button>
      </fieldset>
    </form>
  );
}

export default RegisterPage;
