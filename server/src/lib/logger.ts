/**
 * Structured Logger
 * Centralized logging with levels and context
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private minLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.minLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
    this.isDevelopment = process.env.NODE_ENV !== 'production';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const formatted = this.formatMessage(level, message, context);

    switch (level) {
      case 'debug':
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
        console.error(formatted);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    const errorContext = error
      ? {
          ...context,
          error: {
            message: error.message,
            stack: error.stack,
            ...(error.code && { code: error.code }),
          },
        }
      : context;

    this.log('error', message, errorContext);
  }

  // Specialized logging methods
  apiRequest(method: string, path: string, context?: LogContext): void {
    this.info(`API ${method} ${path}`, context);
  }

  apiResponse(method: string, path: string, statusCode: number, duration: number): void {
    this.info(`API ${method} ${path} ${statusCode}`, { duration: `${duration}ms` });
  }

  dbQuery(query: string, duration?: number): void {
    this.debug('Database query', { query, duration: duration ? `${duration}ms` : undefined });
  }

  payment(action: string, context: LogContext): void {
    this.info(`Payment: ${action}`, context);
  }

  order(action: string, orderId: string, context?: LogContext): void {
    this.info(`Order: ${action}`, { orderId, ...context });
  }

  business(action: string, businessId: string, context?: LogContext): void {
    this.info(`Business: ${action}`, { businessId, ...context });
  }
}

// Export singleton instance
export const logger = new Logger();
