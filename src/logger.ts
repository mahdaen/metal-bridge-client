import { EventEmitter } from './event';

export enum LogLevel {
  DEBUG,
  INFO,
  WARN,
  ERROR
}

export type LoggerConfig = {
  level: LogLevel;
};

export class Logger {
  public static config: LoggerConfig = {
    level: LogLevel.DEBUG,
  };

  public static ondebug = new EventEmitter();
  public static oninfo = new EventEmitter();
  public static onwarn = new EventEmitter();
  public static onerror = new EventEmitter();

  public static debug(message: string, data?: any): void {
    this.ondebug.emit(message, data);
    if (this.config.level <= LogLevel.DEBUG) {
      print(message, 'debug');
    }
  }

  public static info(message: string, data?: any): void {
    this.oninfo.emit(message, data);
    if (this.config.level <= LogLevel.INFO) {
      print(message, 'info');
    }
  }

  public static warn(message: string, data?: any): void {
    this.onwarn.emit(message, data);
    if (this.config.level <= LogLevel.WARN) {
      print(message, 'warn');
    }
  }

  public static error(message: string, error: Error): void {
    this.onerror.emit<any>(message, error);
    if (this.config.level <= LogLevel.ERROR) {
      print(message, 'error');
    }
  }
}

const printRef: any = {
  debug: {
    icon: '[ ]',
    color: '\x1b[37m%s\x1b[0m',
    fn: console.log
  },
  info: {
    icon: '[✓︎]',
    color: '\x1b[36m%s\x1b[0m',
    // tslint:disable-next-line:no-console
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
};

function print(message: string, level: string): void {
  printRef[level].fn(printRef[level].color, `${printRef[level].icon} ${message}`);
}
