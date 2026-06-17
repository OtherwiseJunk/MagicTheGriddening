import type { Meta, StoryObj } from "@storybook/react";
import RulesDialog from "./rulesDialog";

const meta: Meta<typeof RulesDialog> = {
  component: RulesDialog,
  parameters: { layout: "centered" },
};
export default meta;

type Story = StoryObj<typeof RulesDialog>;

// Click the Rules button to open the dialog
export const Default: Story = {};
