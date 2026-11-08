import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

// SAFETY GUARD: this app must never automate game input. GGG's developer rules allow a
// macro only as one user keypress -> one action. These libraries synthesize keyboard or
// mouse input, so importing them is blocked everywhere. If a future, maintainer-approved
// feature needs one, add the file to ALLOWED_INPUT_FILES below in the same PR that
// updates docs/WHAT-WE-READ.md. See docs/agents/guidance/safety-and-ggg.md.
const INPUT_AUTOMATION_PATTERNS = [
  "robotjs",
  "@jitsi/robotjs",
  "@nut-tree/*",
  "@nut-tree-fork/*",
  "node-key-sender",
  "uiohook-napi",
  "iohook",
  "ffi-napi",
  "koffi",
  "@hurdlegroups/robotjs",
  "keysender",
  "autohotkey",
];
const ALLOWED_INPUT_FILES = [
  // Placeholder for a future, maintainer-approved file. No such file exists today.
  "apps/desktop/src/main/hotkey-action.ts",
];

const noInputAutomation = {
  "no-restricted-imports": [
    "error",
    {
      patterns: INPUT_AUTOMATION_PATTERNS.map((group) => ({
        group: [group],
        message:
          "Input automation is forbidden (one keypress -> one action). See docs/agents/guidance/safety-and-ggg.md.",
      })),
    },
  ],
  "no-restricted-syntax": [
    "error",
    {
      selector:
        "CallExpression[callee.name='require'][arguments.0.value=/^(robotjs|@nut-tree|node-key-sender|uiohook-napi)/]",
      message: "Input automation is forbidden. See docs/agents/guidance/safety-and-ggg.md.",
    },
    {
      selector: "MemberExpression[property.name=/^(keyTap|keyToggle|sendKeys|typeString)$/]",
      message: "Synthesizing key input is forbidden. See docs/agents/guidance/safety-and-ggg.md.",
    },
  ],
};

export default tseslint.config(
  { ignores: ["**/dist/**", "**/release/**", "**/out/**", "**/node_modules/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      ...noInputAutomation,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ALLOWED_INPUT_FILES,
    rules: { "no-restricted-imports": "off", "no-restricted-syntax": "off" },
  },
);
