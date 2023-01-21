export type LoggerLevel = "silent" | "debug" | "info" | "warn" | "error"
export type Logger = Pick<Console, "debug" | "info" | "warn" | "error">

const loggerLevelsMap = {
  silent: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4
}

type SetupReporting = (level?: LoggerLevel) => Logger

export const setupReporting: SetupReporting = (level = "debug") => {
  const levelIndex = loggerLevelsMap[level]

  const output = console

  return {
    debug: (...args) => {
      if (levelIndex >= 1) {
        return output.debug(...args)
      }
    },
    info: (...args) => {
      if (levelIndex >= 2) {
        return output.info(...args)
      }
    },
    warn: (...args) => {
      if (levelIndex >= 3) {
        return output.warn(...args)
      }
    },
    error: (...args) => {
      if (levelIndex >= 4) {
        return output.error(...args)
      }
    }
  }
}
