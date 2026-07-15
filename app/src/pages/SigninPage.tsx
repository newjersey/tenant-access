import { Link, useNavigate } from "react-router-dom";
import content from "@/data/content/en/signin.json";

function SigninPage() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Add authentication logic here
    void navigate("/dashboard");
  };

  return (
    <form className="usa-form usa-form--large" onSubmit={handleSubmit}>
      <fieldset className="usa-fieldset">
        <legend className="usa-legend font-heading-xl text-bold">{content.heading}</legend>
        <span>
          or{" "}
          <Link to="/register" className="usa-nav__link">
            <span>{content.createAccountCta}</span>
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
          required
        />

        <label htmlFor="password-sign-in" className="usa-label ">
          {content.passwordLabel}
        </label>

        <input
          id="password-sign-in"
          name="password"
          type="password"
          className="usa-input"
          required
        />

        <p className="usa-form__note">
          <button
            type="button"
            className="margin-top-0 usa-button usa-button--unstyled usa-show-password"
            aria-controls="password-sign-in"
          >
            {content.showPassword}
          </button>
        </p>

        <button className="usa-button" type="submit">
          {content.formCta}
        </button>

        <p>
          <Link to="/forgot-password">{content.forgotPassword}</Link>
        </p>
      </fieldset>
    </form>
  );
}

export default SigninPage;
