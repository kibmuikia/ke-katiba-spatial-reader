import {
  KEYBOARD_TARGET_KEYS,
  IGNORED_TARGET_KEYS,
  type KeyboardTargetKey,
  type IgnoredTargetKey,
} from "./types";

export const isKeyboardTargetKey = (key: string): key is KeyboardTargetKey =>
  (KEYBOARD_TARGET_KEYS as readonly string[]).includes(key);

export const isIgnoredTargetTag = (
  tagName: string,
): tagName is IgnoredTargetKey =>
  (IGNORED_TARGET_KEYS as readonly string[]).includes(tagName);
