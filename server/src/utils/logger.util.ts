import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const devFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  logFormat
);

const prodFormat = combine(
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: process.env.NODE_ENV === 'production' ? prodFormat : devFormat,
  defaultMeta: { service: 'gradeflow-api' },
  transports: [
    new winston.transports.Console(),
    // Add file transports for production
    ...(process.env.NODE_ENV === 'production'
      ? [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]
      : []),
  ],
  exceptionHandlers: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production'
      ? [new winston.transports.File({ filename: 'logs/exceptions.log' })]
      : []),
  ],
  rejectionHandlers: [
    new winston.transports.Console(),
    ...(process.env.NODE_ENV === 'production'
      ? [new winston.transports.File({ filename: 'logs/rejections.log' })]
      : []),
  ],
});
