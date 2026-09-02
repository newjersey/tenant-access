import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

export async function expectNoAxeViolations(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

  const summary = violations.map((violation) => {
    const targets = violation.nodes.map((node) => node.target.join(" ")).join(" | ");
    return `${violation.id}: ${targets}`;
  });

  expect(summary).toEqual([]);
}
