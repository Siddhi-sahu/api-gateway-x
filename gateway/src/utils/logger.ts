
type LogLevel = "info" | "warn" | "error";

interface LogData {
    [key: string] : unknown
}

function log(level: LogLevel, event: string, data: LogData = {}){
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        event,
        ...data
    }))
}

export const logger = {
    info: (event: string, data?: LogData ) => log("info", event, data),
    warn: (event: string, data?: LogData) => log("warn", event, data),
    error: (event: string, data?: LogData) => log("error", event, data)
}