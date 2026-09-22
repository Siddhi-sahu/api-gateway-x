type LogLevel = "info" | "warn" | "error";


function log(level: LogLevel, event: string){
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level,
        event
    }))
}

// export const logger