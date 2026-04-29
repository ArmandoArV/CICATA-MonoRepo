import "server-only";

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";

const COLORS: Record<LogLevel, string> = {
  INFO: "\x1b[36m",
  WARN: "\x1b[33m",
  ERROR: "\x1b[31m",
  DEBUG: "\x1b[90m",
};
const RESET = "\x1b[0m";

function log(level: LogLevel, tag: string, message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const color = COLORS[level];
  const prefix = `${color}[${level}]${RESET} ${timestamp} [${tag}]`;

  if (data !== undefined) {
    console.log(`${prefix} ${message}`, data);
  } else {
    console.log(`${prefix} ${message}`);
  }
}

export const Logger = {
  info: (tag: string, message: string, data?: unknown) =>
    log("INFO", tag, message, data),

  warn: (tag: string, message: string, data?: unknown) =>
    log("WARN", tag, message, data),

  error: (tag: string, message: string, data?: unknown) =>
    log("ERROR", tag, message, data),

  debug: (tag: string, message: string, data?: unknown) => {
    if (process.env.NODE_ENV !== "production") {
      log("DEBUG", tag, message, data);
    }
  },
};
