import { EventEmitter } from 'event';

export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR
}

export type LoggerConfig = {
  level: LogLevel;
}

export class Logger {
  public static config: LoggerConfig = {
    level: LogLevel.DEBUG
  };

  public static ondebug = new EventEmitter();
  public static oninfo = new EventEmitter();
  public static onwarn = new EventEmitter();
  public static onerror = new EventEmitter();

  public static debug(message: string, data?: any) {
    this.ondebug.emit(message, data);
    if (this.config.level <= LogLevel.DEBUG) {
      print(message, 'debug');
    }
  }

  public static info(message: string, data?: any) {
    this.oninfo.emit(message, data);
    if (this.config.level <= LogLevel.INFO) {
      print(message, 'info');
    }
  }

  public static warn(message: string, data?: any) {
    this.onwarn.emit(message, data);
    if (this.config.level <= LogLevel.WARN) {
      print(message, 'warn');
    }
  }

  public static error(message: string, error: Error) {
    this.onerror.emit<any>(message, error);
    if (this.config.level <= LogLevel.ERROR) {
      print(message, 'error');
    }
  }
}

const printref = {
  debug: {
    icon: '[ ]',
    color: '\x1b[37m%s\x1b[0m',
    fn: console.log
  },
  info: {
    icon: '[✓︎]',
    color: '\x1b[36m%s\x1b[0m',
    fn: console.info
  },
  warn: {
    icon: '[△]',
    color: '\x1b[33m%s\x1b[0m',
    fn: console.warn
  },
  error: {
    icon: '[✕]',
    color: '\x1b[31m%s\x1b[0m',
    fn: console.error
  },
}

function print(message, level) {
  printref[level].fn(printref[level].color, `${printref[level].icon} ${message}`);
}
