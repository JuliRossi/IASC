import { createLogger, format, transports } from "winston";

export function createLoggerForService(service) {
    return createLogger({
        level: "info",
        format: format.combine(
          format.timestamp({
            format: "YYYY-MM-DD HH:mm:ss",
          }),
          format.errors({ stack: true }),
          format.splat(),
          format.json()
        ),
        defaultMeta: { service: service },
        transports: [
          new transports.Console({
            format: format.combine(format.colorize(), format.simple()),
          }),
        ],
      });
}

