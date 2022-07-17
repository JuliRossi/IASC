import { createLogger, format, transports } from "winston";

export function createLoggerForService(service) {
  return createLogger({
    level: "info",
    format: format.combine(
      format.colorize(),
      format.timestamp(),
      format.printf(
        (info) => `[${info.timestamp}] ${info.level}: ${info.message}`
      )
    ),

    transports: [new transports.Console()],
  });
}
