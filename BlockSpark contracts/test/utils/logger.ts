import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
// import "hardhat-dotenv";

const LOG_DIR = path.resolve(process.cwd(), 'test-logs');
try {
    if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
    }
} catch (err) {
    console.error("Не вдалося створити папку логів:", err);
}

export function createLogger(moduleName: string): winston.Logger {
    const baseName = path.basename(moduleName).replace('.ts', '');
    const logFilePath = path.join(LOG_DIR, `${baseName}.log`);

    try {
        if (fs.existsSync(logFilePath)) {
            fs.unlinkSync(logFilePath);
        }
    } catch (e) {}

    const fileFormat = winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss' }),
        winston.format.printf(({ timestamp, level, message }) => {
            // Вирізаємо ANSI-коди кольорів
            const cleanMessage = (message as string).replace(/\u001b\[.*?m/g, ''); 
            return `[${timestamp}] ${cleanMessage}`;
        })
    );

    const logger: winston.Logger = winston.createLogger({
        level: process.env.DEBUG ? 'debug' : 'info',
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}] ${message}`)
        ),
        transports: [
            new winston.transports.Console({
                format: winston.format.combine(
                    winston.format.colorize(),
                    winston.format.simple()
                )
            }),
            // new DailyRotateFile({
            //     dirname: LOG_DIR,
            //     filename: 'tests-%DATE%.log',
            //     datePattern: 'YYYY-MM-DD',
            //     zippedArchive: true,
            //     createSymlink: true,
            //     symlinkName: 'latest-tests.log',
            //     maxSize: '20m',
            //     maxFiles: '1'
            // }),
            new winston.transports.File({
                filename: logFilePath,
                format: fileFormat,
                options: { flags: 'w' }
            })
        ]
    });

    return logger;
}