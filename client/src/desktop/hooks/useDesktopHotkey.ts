import { useEffect, useMemo } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useUIStore } from '@/stores/uiStore';

export interface HotkeyOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  /**
   * If true (default), the hotkey only activates when the global Hotkeys toggle is ON.
   * Set to false for bindings that must work even when hints/hotkeys are hidden (e.g. 'h').
   */
  respectGlobalToggle?: boolean;
}

export interface HotkeyEnvironment {
  targetWindow?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
  isMobile?: boolean;
  isTablet?: boolean;
}

const INPUT_TAGS = new Set(['input', 'textarea', 'select']);

export const normalizeHotkey = (value: string) => {
  if (!value) return value;
  // Normalize whitespace and casing
  const lower = value === ' ' ? 'space' : value.toLowerCase();

  // Map a few common aliases and keypad codes to semantic keys
  switch (lower) {
    case 'return':
      return 'enter';
    case 'numpadenter':
      return 'enter';
    case 'numpadadd':
    case 'add':
    case 'plus':
      return '+';
    case 'equal': // event.code for '=' key on US layout
      return '=';
    case 'numpadsubtract':
    case 'subtract':
    case 'minus':
      return '-';
    default:
      return lower;
  }
};

const defaultEnv: HotkeyEnvironment = {
  targetWindow: typeof window !== 'undefined' ? window : undefined,
  isMobile,
  isTablet,
};

export function registerDesktopHotkey(
  keys: string | string[],
  handler: (event: KeyboardEvent) => void,
  options: HotkeyOptions = {},
  env: HotkeyEnvironment = defaultEnv,
) {
  const { enabled = true, preventDefault = false } = options;

  if (!enabled) {
    return undefined;
  }

  if (env.isMobile || env.isTablet) {
    return undefined;
  }

  const targetWindow = env.targetWindow;
  if (!targetWindow) {
    return undefined;
  }

  const keyList = Array.isArray(keys) ? keys : [keys];
  const normalizedKeys = keyList.map(normalizeHotkey);

  const listener = (event: KeyboardEvent) => {
    if (event.repeat) {
      return;
    }

    const target = event.target as HTMLElement | null;
    const tag = target?.tagName?.toLowerCase();
    if (target?.isContentEditable || (tag && INPUT_TAGS.has(tag))) {
      return;
    }

    const keyMatch = normalizeHotkey(event.key);
    const codeMatch = normalizeHotkey(event.code);

    if (!normalizedKeys.includes(keyMatch) && !normalizedKeys.includes(codeMatch)) {
      return;
    }

    if (preventDefault) {
      event.preventDefault();
    }

    handler(event);
  };

  targetWindow.addEventListener('keydown', listener);

  return () => {
    targetWindow.removeEventListener('keydown', listener);
  };
}

/**
 * Registers a keyboard listener that only runs on desktop devices.
 * Overloads allow passing a boolean `enabled` directly to reduce boilerplate.
 */
export function useDesktopHotkey(keys: string | string[], handler: (event: KeyboardEvent) => void): void;
export function useDesktopHotkey(keys: string | string[], handler: (event: KeyboardEvent) => void, enabled: boolean): void;
export function useDesktopHotkey(keys: string | string[], handler: (event: KeyboardEvent) => void, options: HotkeyOptions): void;
export function useDesktopHotkey(
  keys: string | string[],
  handler: (event: KeyboardEvent) => void,
  optionsOrEnabled: HotkeyOptions | boolean = {},
) {
  const { showHotkeys } = useUIStore();
  const keyList = useMemo(() => (
    Array.isArray(keys) ? keys : [keys]
  ), [keys]);
  const dependencyKey = useMemo(() => (
    keyList.map(normalizeHotkey).join('|')
  ), [keyList]);

  const normalizedOptions: HotkeyOptions = typeof optionsOrEnabled === 'boolean'
    ? { enabled: optionsOrEnabled }
    : (optionsOrEnabled ?? {});
  const { enabled = true, preventDefault = false, respectGlobalToggle = true } = normalizedOptions;
  const globalAllowed = respectGlobalToggle ? showHotkeys : true;
  const finalEnabled = enabled && globalAllowed;

  useEffect(() => {
    const cleanup = registerDesktopHotkey(keyList, handler, { enabled: finalEnabled, preventDefault });
    return cleanup;
  }, [dependencyKey, handler, finalEnabled, preventDefault, keyList]);
}

/**
 * Convenience helper for the common toggle pattern: flips a boolean state when keys are pressed.
 * Accepts a React setState function (functional update supported).
 */
export function useHotkeyToggle(
  keys: string | string[],
  setState: (value: ((prev: boolean) => boolean) | boolean) => void,
  optionsOrEnabled: HotkeyOptions | boolean = {},
) {
  const opts: HotkeyOptions = typeof optionsOrEnabled === 'boolean' ? { enabled: optionsOrEnabled } : (optionsOrEnabled ?? {});
  useDesktopHotkey(keys, () => setState((prev: boolean) => !prev), opts);
}
