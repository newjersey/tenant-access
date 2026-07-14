interface IconProps {
  icon: string;
  size?: string;
  class?: string;
}

function Icon({ icon, size, class: className }: IconProps) {
  const classes = ["usa-icon", size && `usa-icon--size-${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <svg className={classes} aria-hidden="true" focusable="false" role="img">
      <use href={`/images/sprite.svg#${icon}`}></use>
    </svg>
  );
}

export default Icon;
