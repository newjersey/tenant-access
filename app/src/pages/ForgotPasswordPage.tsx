import { useNavigate } from "react-router-dom";

function ForgotPasswordPage() {
  const navigate = useNavigate();

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Add authentication logic here
    void navigate("/signin");
  };

  return (
    <form className="usa-form usa-form--large" onSubmit={handleSubmit}>
      <fieldset className="usa-fieldset">
        <legend className="usa-legend font-heading-xl text-bold">Reset password</legend>
        <span>Please enter your new password</span>

        <label htmlFor="password-reset" className="usa-label ">
          New password
        </label>

        <input
          id="password-reset"
          name="password"
          type="password"
          className="usa-input "
          required
        />

        <label htmlFor="confirmPassword" className="usa-label ">
          Confirm password
        </label>

        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          className="usa-input "
          required
        />

        <p className="usa-form__note">
          <button
            type="button"
            className="margin-top-0 usa-button usa-button--unstyled usa-show-password"
            aria-controls="password-reset confirmPassword"
          >
            Show password
          </button>
        </p>

        <button className="usa-button" type="submit">
          Reset password
        </button>
      </fieldset>
    </form>
  );
}

export default ForgotPasswordPage;
