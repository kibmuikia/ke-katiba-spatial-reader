/**
 * @file logger.ts
 * @description Centralized, structured logging utility with obfuscated module identifiers.
 *
 * Code-name Mapping (Security obfuscation):
 * - MN  => "KKR-NM"  (main.ts)
 * - BG  => "KKR-GB" (background.ts)
 * - PT  => "KKR-TP"  (pageTexture.ts)
 */

export type LogModuleCode =
  | "KKR-NM" // main.ts
  | "KKR-GB" // background.ts
  | "KKR-TP"; // pageTexture.ts

export interface LogOptions {
  module: LogModuleCode;
  scope?: string;
  data?: unknown;
}

// Erasable syntax means TypeScript constructs that can be erased simply by deleting type annotations, leaving valid JavaScript code behind without needing transpilation or code generation.
// Note: can't use enum because enums are not erasable syntax, so we use a const object instead : `"erasableSyntaxOnly": true,` in tsconfig.json
/* export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
} */
// logger.ts
export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

class Logger {
  private minLevel: LogLevel =
    typeof import.meta !== "undefined" && import.meta.env.DEV
      ? LogLevel.DEBUG
      : LogLevel.INFO;

  public setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private formatTag(module: LogModuleCode, scope?: string): string {
    return scope ? `[${module}:${scope}]` : `[${module}]`;
  }

  public debug(msg: string, options: LogOptions): void {
    if (this.minLevel > LogLevel.DEBUG) return;
    const tag = this.formatTag(options.module, options.scope);
    if (options.data !== undefined) {
      console.debug(tag, msg, options.data);
    } else {
      console.debug(tag, msg);
    }
  }

  public info(msg: string, options: LogOptions): void {
    if (this.minLevel > LogLevel.INFO) return;
    const tag = this.formatTag(options.module, options.scope);
    if (options.data !== undefined) {
      console.info(tag, msg, options.data);
    } else {
      console.info(tag, msg);
    }
  }

  public warn(msg: string, options: LogOptions): void {
    if (this.minLevel > LogLevel.WARN) return;
    const tag = this.formatTag(options.module, options.scope);
    if (options.data !== undefined) {
      console.warn(tag, msg, options.data);
    } else {
      console.warn(tag, msg);
    }
  }

  public error(msg: string, options: LogOptions): void {
    if (this.minLevel > LogLevel.ERROR) return;
    const tag = this.formatTag(options.module, options.scope);
    if (options.data !== undefined) {
      console.error(tag, msg, options.data);
    } else {
      console.error(tag, msg);
    }
  }
}

export const logger = new Logger();
