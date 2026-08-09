export const KEYBOARD_TARGET_KEYS = [
  "Escape",
  "ArrowLeft",
  "ArrowRight",
] as const;
export type KeyboardTargetKey = (typeof KEYBOARD_TARGET_KEYS)[number];

export const IGNORED_TARGET_KEYS = ["INPUT", "TEXTAREA", "SELECT"] as const;
export type IgnoredTargetKey = (typeof IGNORED_TARGET_KEYS)[number];
