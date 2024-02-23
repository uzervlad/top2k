import { WriteStream, createWriteStream, existsSync, mkdirSync } from "fs";
import path from "path";
import dateformat from "dateformat";
import cron from "node-cron";

export type Loggable = string | string[];

export enum LogLevel {
  FATAL,
  ERROR,
  WARN,
  INFO,
}

export class Log {
  private static readonly logPath = "./logs";

  private static stream: WriteStream | null;
  private static initialized = false;

  public static init() {
    if(Log.initialized)
      return;

    Log.initStream();

    cron.schedule("0 0 * * *", () => {
      Log.initStream();
    });
  }

  private static stopStream() {
    Log.stream?.close();
    Log.stream = null;
  }

  private static initStream() {
    if(!existsSync(Log.logPath))
      mkdirSync(Log.logPath);
    
    if(Log.stream)
      Log.stopStream();

    let filename = path.join(Log.logPath, dateformat("yyyy-mm-dd") + ".log");

    Log.stream = createWriteStream(filename, { flags: "a+" });
  }

  private static log(l: LogLevel, msg: Loggable): void {
    var time = dateformat("HH:MM:ss");

    if(typeof msg == "string") msg = [ msg ];

    for(let line of msg)
      Log.stream?.write(`${time} [${LogLevel[l]}] ${line}\n`);
  }

  public static fatal(msg: Loggable) {
    Log.log(LogLevel.FATAL, msg);
  }

  public static error(msg: Loggable) {
    Log.log(LogLevel.ERROR, msg);
  }

  public static warn(msg: Loggable) {
    Log.log(LogLevel.WARN, msg);
  }

  public static info(msg: Loggable) {
    Log.log(LogLevel.INFO, msg);
  }
}