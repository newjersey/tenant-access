interface AlertProps {
  content: string;
  header?: string;
  type?: "warning" | "info" | "success" | "error";
  slim?: boolean;
}

function Alert({ content, header, type = "info", slim = false }: AlertProps) {
  const className = ["usa-alert", `usa-alert--${type}`, slim && "usa-alert--slim"]
    .filter(Boolean)
    .join(" ");

  // Errors and warnings interrupt (assertive); success and info are announced politely.
  const role = type === "error" || type === "warning" ? "alert" : "status";

  return (
    <div role={role} className={className}>
      <div className="usa-alert__body">
        {header && !slim && <p className="usa-alert__heading">{header}</p>}
        <p className="usa-alert__text">{content}</p>
      </div>
    </div>
  );
}

export default Alert;
