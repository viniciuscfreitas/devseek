type LogLevel = "info" | "warn" | "error" | "debug";

const format = (level: LogLevel, message: string, metadata?: unknown) => {
  const base = {
    level,
    timestamp: new Date().toISOString(),
    message,
    metadata,
  };

  return JSON.stringify(base);
};

const log = (level: LogLevel, message: string, metadata?: unknown) => {
  const payload = format(level, message, metadata);
  switch (level) {
    case "error":
      console.error(payload);
      break;
    case "warn":
      console.warn(payload);
      break;
    case "debug":
      if (process.env.NODE_ENV !== "production") {
        console.debug(payload);
      }
      break;
    default:
      console.log(payload);
  }
};

export const logger = {
  info: (message: string, metadata?: unknown) => log("info", message, metadata),
  warn: (message: string, metadata?: unknown) => log("warn", message, metadata),
  error: (message: string, metadata?: unknown) =>
    log("error", message, metadata),
  debug: (message: string, metadata?: unknown) =>
    log("debug", message, metadata),
};


