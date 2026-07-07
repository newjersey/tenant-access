import { Link, useNavigate } from "react-router-dom";

function SigninPage() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Add authentication logic here
    void navigate("/dashboard");
  };

  return (
    <form className="usa-form" onSubmit={handleSubmit}>
      <fieldset className="usa-fieldset">
        <legend className="usa-legend font-heading-xl text-bold">Sign in</legend>
        <span>
          or{" "}
          <Link to="/register" className="usa-nav__link">
            <span>Create an account</span>
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

        <label htmlFor="password-sign-in" className="usa-label ">
          Password
        </label>

        <input id="password-sign-in" name="password" type="password" className="usa-input" />

        <p className="usa-form__note">
          <button
            type="button"
            className="margin-top-0 usa-button usa-button--unstyled usa-show-password"
            aria-controls="password-sign-in"
          >
            Show password
          </button>
        </p>

        <button className="usa-button" type="submit">
          Sign in
        </button>

        <p>
          <a href="#!">Forgot password?</a>
        </p>
      </fieldset>
    </form>
  );
}

export default SigninPage;
