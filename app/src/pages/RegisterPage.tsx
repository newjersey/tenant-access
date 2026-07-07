import { Link } from "react-router-dom";

function RegisterPage() {
  return (
    <form className="usa-form ">
      <fieldset className="usa-fieldset">
        <legend className="usa-legend font-heading-xl text-bold">Create an account</legend>
        <span>
          or{" "}
          <Link to="/signin" className="usa-nav__link">
            <span>Sign in</span>
          </Link>
        </span>

        <label htmlFor="username" className="usa-label ">
          Email address
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
            Password
          </label>

          <input id="password-sign-in" name="password" type="password" className="usa-input" />
        </div>

        <div>
          <label htmlFor="password-sign-in-confirm" className="usa-label">
            Confirm password
          </label>

          <input
            id="password-sign-in-confirm"
            name="password"
            type="password"
            className="usa-input"
          />
        </div>

        <button className="usa-button" type="submit">
          Create account
        </button>
      </fieldset>
    </form>
  );
}

export default RegisterPage;
