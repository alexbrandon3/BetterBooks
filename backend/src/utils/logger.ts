/**
 * Lightweight logging utility that can be easily extended later
 */

type LogLevel = 'info' | 'success' | 'error';

const formatMessage = (level: LogLevel, message: string, context?: string): string => {
  const prefix = context ? `[${context}]` : '';
  const emoji = {
    info: '🚀',
    success: '✅',
    error: '❌'
  }[level];

  return `${emoji} ${prefix} ${message}`;
};

export const logInfo = (message: string, context?: string): void => {
  // console.log(formatMessage('info', message, context));
};

export const logSuccess = (message: string, context?: string): void => {
  // console.log(formatMessage('success', message, context));
};

export const logError = (message: string, context?: string): void => {
  console.error(formatMessage('error', message, context));
}; 