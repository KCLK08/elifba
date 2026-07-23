/**
 * Lightweight development logging — no external analytics.
 * Prefixes help filter Logcat / Metro during device tests.
 */

type LogScope = 'audio' | 'storage' | 'content' | 'app';

function stamp(scope: LogScope, level: string, message: string, detail?: unknown) {
  const prefix = `[elifba:${scope}]`;
  if (detail !== undefined) {
    // eslint-disable-next-line no-console
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `${prefix} ${message}`,
      detail,
    );
  } else {
    // eslint-disable-next-line no-console
    console[level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log'](
      `${prefix} ${message}`,
    );
  }
}

export const log = {
  info(scope: LogScope, message: string, detail?: unknown) {
    if (__DEV__) stamp(scope, 'log', message, detail);
  },
  warn(scope: LogScope, message: string, detail?: unknown) {
    stamp(scope, 'warn', message, detail);
  },
  error(scope: LogScope, message: string, detail?: unknown) {
    stamp(scope, 'error', message, detail);
  },
};
