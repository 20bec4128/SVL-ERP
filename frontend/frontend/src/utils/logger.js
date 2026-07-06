const isDev = import.meta.env.DEV;

function sendRemoteLog(_level, _message, _meta) {
  // Production-ready hook for external logging integrations.
}

function write(level, message, meta) {
  if (isDev) {
    const method = console[level] ? level : "log";
    if (typeof meta === "undefined") {
      console[method](message);
      return;
    }
    console[method](message, meta);
    return;
  }

  sendRemoteLog(level, message, meta);
}

const logger = {
  info(message, meta) {
    write("info", message, meta);
  },
  warn(message, meta) {
    write("warn", message, meta);
  },
  error(message, meta) {
    write("error", message, meta);
  },
};

export default logger;

