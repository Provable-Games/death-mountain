import { useEffect, useMemo } from 'react';
import { isMobile, isTablet } from 'react-device-detect';

export interface HotkeyOptions {
  enabled?: boolean;
  preventDefault?: boolean;
}

export interface HotkeyEnvironment {
  targetWindow?: Pick<Window, 'addEventListener' | 'removeEventListener'>;
  isMobile?: boolean;
  isTablet?: boolean;
}

const INPUT_TAGS = new Set(['input', 'textarea', 'select']);

export const normalizeHotkey = (value: string) => {
  if (value === ' ') {
    return 'space';
  }
  return value.toLowerCase();
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
 */
export function useDesktopHotkey(
  keys: string | string[],
  handler: (event: KeyboardEvent) => void,
  options: HotkeyOptions = {},
) {
  const keyList = useMemo(() => (
    Array.isArray(keys) ? keys : [keys]
  ), [keys]);
  const dependencyKey = useMemo(() => (
    keyList.map(normalizeHotkey).join('|')
  ), [keyList]);
  const { enabled = true, preventDefault = false } = options ?? {};

  useEffect(() => {
    const cleanup = registerDesktopHotkey(keyList, handler, { enabled, preventDefault });
    return cleanup;
  }, [dependencyKey, handler, enabled, preventDefault, keyList]);
}
