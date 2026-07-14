import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Icon from "./Icon";

describe("Icon", () => {
  const getSvg = (container: HTMLElement) => container.querySelector("svg") as SVGSVGElement;

  it("renders an svg referencing the sprite for the given icon", () => {
    const { container } = render(<Icon icon="mail" />);
    const svg = getSvg(container);

    expect(svg).toBeInTheDocument();
    expect(svg.querySelector("use")).toHaveAttribute("href", "/images/sprite.svg#mail");
  });

  it("is hidden from assistive tech", () => {
    const { container } = render(<Icon icon="mail" />);
    const svg = getSvg(container);

    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("focusable", "false");
    expect(svg).toHaveAttribute("role", "img");
  });

  it("applies only the base class when size and class are omitted", () => {
    const { container } = render(<Icon icon="mail" />);

    expect(getSvg(container)).toHaveAttribute("class", "usa-icon");
  });

  it("adds a size modifier class from the size prop", () => {
    const { container } = render(<Icon icon="mail" size="3" />);

    expect(getSvg(container)).toHaveAttribute("class", "usa-icon usa-icon--size-3");
  });

  it("appends additional classes from the class prop", () => {
    const { container } = render(
      <Icon icon="mail" size="3" class="nj-banner__mail-icon margin-right-05" />,
    );

    expect(getSvg(container)).toHaveAttribute(
      "class",
      "usa-icon usa-icon--size-3 nj-banner__mail-icon margin-right-05",
    );
  });
});
