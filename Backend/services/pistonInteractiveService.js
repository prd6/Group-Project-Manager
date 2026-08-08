import { randomUUID } from "crypto";
import { createHttpError } from "../utils/groupAccess.js";
import { SOCKET_EVENTS } from "../utils/socket.js";

const PISTON_BASE_URL =
  process.env.PISTON_API_URL ||
  "http://localhost:2000";

const DEFAULT_INTERACTIVE_SESSION_TIMEOUT_MS =
  60 * 1000;

const configuredInteractiveTimeoutMs = Number(
  process.env
    .PISTON_INTERACTIVE_SESSION_TIMEOUT_MS
);

const INTERACTIVE_SESSION_TIMEOUT_MS =
  Number.isFinite(
    configuredInteractiveTimeoutMs
  ) && configuredInteractiveTimeoutMs > 0
    ? configuredInteractiveTimeoutMs
    : DEFAULT_INTERACTIVE_SESSION_TIMEOUT_MS;

const INTERACTIVE_COMPILE_TIMEOUT_MS = 10 * 1000;

const INTERACTIVE_INPUT_MAX_BYTES =
  Number(
    process.env
      .PISTON_INTERACTIVE_INPUT_MAX_BYTES
  ) || 8 * 1024;

const INTERACTIVE_START_LIMIT =
  Number(
    process.env
      .PISTON_INTERACTIVE_START_LIMIT
  ) || 4;

const INTERACTIVE_START_WINDOW_MS =
  Number(
    process.env
      .PISTON_INTERACTIVE_START_WINDOW_MS
  ) || 60 * 1000;

const LANGUAGE_CONFIG = {
  python: {
    language: "python",
    version: "3.12.0",
    fileName: "main.py",
  },
  c: {
    language: "c",
    version: "10.2.0",
    fileName: "main.c",
  },
  cpp: {
    language: "c++",
    version: "10.2.0",
    fileName: "main.cpp",
  },
};

const EXTENSION_TO_LANGUAGE = {
  py: "python",
  c: "c",
  cpp: "cpp",
  h: "c",
  hpp: "cpp",
};

const START_HISTORY = new Map();

const toWebSocketUrl = (baseUrl) => {
  const url = new URL("/api/v2/connect", baseUrl);

  if (url.protocol === "https:") {
    url.protocol = "wss:";
  } else if (url.protocol === "http:") {
    url.protocol = "ws:";
  }

  return url.toString();
};

const PISTON_WS_URL = toWebSocketUrl(PISTON_BASE_URL);

const normalizeLanguage = (
  editorLanguage = "auto",
  fileName = "",
  sourceCode = ""
) => {
  let language = String(editorLanguage || "")
    .trim()
    .toLowerCase();

  if (language === "auto" || !language) {
    const extension = String(fileName)
      .split(".")
      .pop()
      .toLowerCase();

    if (EXTENSION_TO_LANGUAGE[extension]) {
      return EXTENSION_TO_LANGUAGE[extension];
    }

    const code = String(sourceCode || "");

    if (
      /#include\s*[<"]/.test(code) ||
      /\bint\s+main\s*\(/.test(code)
    ) {
      return /\bcout\b|using\s+namespace\s+std/.test(
        code
      )
        ? "cpp"
        : "c";
    }

    if (
      /^\s*def\s+\w+\s*\(/m.test(code) ||
      /^\s*print\s*\(/m.test(code) ||
      /^\s*import\s+\w+/m.test(code)
    ) {
      return "python";
    }
  }

  if (
    language === "py" ||
    language === "python3"
  ) {
    return "python";
  }

  if (
    language === "c++" ||
    language === "g++" ||
    language === "cpp"
  ) {
    return "cpp";
  }

  if (language === "gcc") {
    return "c";
  }

  return language;
};

const encodeText = (value = "") =>
  Buffer.byteLength(String(value), "utf8");

const readJson = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const createSocketError = (
  message,
  status = 400
) => {
  const error = createHttpError(status, message);

  error.expose = status < 500;

  return error;
};

const pruneStartHistory = (timestamps) => {
  const cutoff =
    Date.now() - INTERACTIVE_START_WINDOW_MS;

  while (
    timestamps.length &&
    timestamps[0] < cutoff
  ) {
    timestamps.shift();
  }
};

const enforceStartRateLimit = (userId) => {
  if (!userId) {
    return;
  }

  const history = START_HISTORY.get(userId) || [];

  pruneStartHistory(history);

  if (
    history.length >= INTERACTIVE_START_LIMIT
  ) {
    throw createSocketError(
      "Too many interactive code sessions. Please wait before starting another run.",
      429
    );
  }

  history.push(Date.now());

  START_HISTORY.set(userId, history);
};

class InteractivePistonSession {
  constructor({
    socket,
    sourceCode,
    language,
    fileName,
    args = [],
    sessionId,
    onTerminate = null,
  }) {
    this.socket = socket;
    this.id = sessionId || randomUUID();
    this.sourceCode = sourceCode;
    this.language = language;
    this.fileName = fileName;
    this.args = Array.isArray(args) ? args : [];
    this.config = LANGUAGE_CONFIG[language];

    this.ws = null;
    this.completed = false;
    this.stopping = false;
    this.currentStage = "init";
    this.waitingTimer = null;
    this.sessionTimeout = null;
    this.stopTimer = null;
    this.awaitingInput = false;
    this.finishReason = "";
    this.createdAt = Date.now();
    this.lastActivityAt = this.createdAt;
    this.lastActivityReason = "created";
    this.lastInputAt = null;
    this.lastOutputAt = null;
    this.onTerminate =
      typeof onTerminate === "function"
        ? onTerminate
        : null;
  }

  getElapsedMs() {
    return Date.now() - this.createdAt;
  }

  getInactivityMs() {
    return Date.now() - this.lastActivityAt;
  }

  getDebugSnapshot() {
    return {
      sessionId: this.id,
      elapsedMs: this.getElapsedMs(),
      inactivityMs: this.getInactivityMs(),
      stage: this.currentStage,
      completed: this.completed,
      stopping: this.stopping,
      waitingForStdin: this.awaitingInput,
      finishReason: this.finishReason || "",
      lastActivityReason: this.lastActivityReason || "",
      lastInputAt: this.lastInputAt
        ? Date.now() - this.lastInputAt
        : null,
      lastOutputAt: this.lastOutputAt
        ? Date.now() - this.lastOutputAt
        : null,
    };
  }

  debugLog(event, details = {}) {
    console.info(
      "[interactive-piston]",
      event,
      {
        ...this.getDebugSnapshot(),
        ...details,
      }
    );
  }

  markActivity(reason, details = {}) {
    this.lastActivityAt = Date.now();
    this.lastActivityReason = reason;

    if (reason === "stdin") {
      this.lastInputAt = this.lastActivityAt;
    }

    if (
      reason === "stdout" ||
      reason === "stderr"
    ) {
      this.lastOutputAt = this.lastActivityAt;
    }

    this.debugLog("activity", {
      reason,
      ...details,
    });
  }

  emit(eventName, payload = {}) {
    this.socket.emit(eventName, {
      sessionId: this.id,
      ...payload,
    });
  }

  updateState(state, extra = {}) {
    this.emit(SOCKET_EVENTS.CODE_EXECUTION_STATE, {
      state,
      stage: this.currentStage,
      ...extra,
    });
  }

  clearWaitingTimer() {
    if (this.waitingTimer) {
      this.debugLog("clear-waiting-timer", {
        timer: "waitingTimer",
      });
      clearTimeout(this.waitingTimer);
      this.waitingTimer = null;
    }
  }

  clearStopTimer() {
    if (this.stopTimer) {
      this.debugLog("clear-stop-timer", {
        timer: "stopTimer",
      });
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
  }

  scheduleWaitingState() {
    this.clearWaitingTimer();

    if (this.completed || this.currentStage !== "run") {
      return;
    }

    this.waitingTimer = setTimeout(() => {
      if (this.completed || this.stopping) {
        return;
      }

      this.awaitingInput = true;
      this.markActivity("waiting-prompt", {
        timer: "waitingTimer",
      });
      this.updateState("waiting", {
        awaitingInput: true,
      });
    }, 300);
  }

  clearSessionTimeout() {
    if (this.sessionTimeout) {
      this.debugLog("clear-session-timeout", {
        timer: "sessionTimeout",
      });
      clearTimeout(this.sessionTimeout);
      this.sessionTimeout = null;
    }
  }

  refreshSessionTimeout() {
    this.clearSessionTimeout();
    this.markActivity("timeout-refresh");
    const deadlineAt =
      Date.now() + INTERACTIVE_SESSION_TIMEOUT_MS;
    this.debugLog("arm-session-timeout", {
      timer: "sessionTimeout",
      timeoutMs: INTERACTIVE_SESSION_TIMEOUT_MS,
      deadlineInMs: INTERACTIVE_SESSION_TIMEOUT_MS,
      deadlineAt,
    });

    this.sessionTimeout = setTimeout(() => {
      if (this.completed) {
        return;
      }

      this.finishReason = "timeout";
      this.debugLog("session-timeout-fired", {
        timer: "sessionTimeout",
        timeoutMs: INTERACTIVE_SESSION_TIMEOUT_MS,
      });
      this.stop("SIGKILL");

      this.emit(SOCKET_EVENTS.CODE_EXECUTION_ERROR, {
        message:
          "Interactive session timed out.",
      });
    }, INTERACTIVE_SESSION_TIMEOUT_MS);
  }

  finalizeStoppedSession() {
    if (this.completed) {
      return;
    }

    this.debugLog("finalize-stopped-session", {
      message: "Process stopped",
    });

    this.finish("run", {
      code: null,
      signal: "SIGKILL",
      message: "Process stopped",
      status: "stopped",
    });
  }

  getSourceFileName() {
    return (
      this.fileName ||
      this.config.fileName
    );
  }

  send(message) {
    if (
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN
    ) {
      throw createSocketError(
        "Piston connection is not ready.",
        502
      );
    }

    this.ws.send(JSON.stringify(message));
  }

  open() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(PISTON_WS_URL);
        this.debugLog("ws-connecting", {
          url: PISTON_WS_URL,
        });
      } catch (error) {
        this.debugLog("ws-connect-error", {
          message:
            error.message ||
            "Failed to connect to Piston.",
        });
        reject(
          createSocketError(
            error.message ||
              "Failed to connect to Piston.",
            502
          )
        );
        return;
      }

      this.ws.addEventListener("open", () => {
        try {
          this.debugLog("ws-open");
          this.send({
            type: "init",
            language: this.config.language,
            version: this.config.version,
            files: [
              {
                name: this.getSourceFileName(),
                content: this.sourceCode,
              },
            ],
            args: this.args,
            compile_timeout:
              INTERACTIVE_COMPILE_TIMEOUT_MS,
            compile_cpu_time:
              INTERACTIVE_COMPILE_TIMEOUT_MS,
            run_timeout: INTERACTIVE_SESSION_TIMEOUT_MS,
            run_cpu_time: INTERACTIVE_SESSION_TIMEOUT_MS,
          });

          this.updateState("starting", {
            language: this.language,
            runtime: {
              language: this.config.language,
              version: this.config.version,
            },
          });

          this.refreshSessionTimeout();
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      this.ws.addEventListener("message", (event) => {
        this.debugLog("ws-message", {
          rawType: typeof event.data,
        });
        this.handleMessage(event.data);
      });

      this.ws.addEventListener("error", (event) => {
        this.debugLog("ws-error", {
          message:
            event?.message ||
            "Piston WebSocket error.",
        });
        if (!this.completed) {
          this.emit(
            SOCKET_EVENTS.CODE_EXECUTION_ERROR,
            {
              message:
                "Piston WebSocket error.",
            }
          );
        }
      });

      this.ws.addEventListener("close", (event) => {
        this.debugLog("ws-close", {
          code: event?.code ?? null,
          reason:
            typeof event?.reason === "string"
              ? event.reason
              : "",
          wasClean: event?.wasClean ?? null,
        });
        if (!this.completed) {
          if (this.stopping) {
            this.finish(
              this.currentStage,
              {
                code: null,
                signal: "SIGKILL",
                message:
                  this.finishReason === "timeout"
                    ? "Interactive session timed out."
                    : "Process stopped",
                status:
                  this.finishReason === "timeout"
                    ? "timeout"
                    : "stopped",
              }
            );
            return;
          }

          this.emit(
            SOCKET_EVENTS.CODE_EXECUTION_ERROR,
            {
              message:
                "Piston connection closed unexpectedly.",
            }
          );

          this.finish(this.currentStage, {
            code: null,
            signal: null,
            message:
              "Piston connection closed unexpectedly.",
            status: "XX",
          });
        }
      });
    });
  }

  safeStop(signal = "SIGTERM") {
    try {
      this.debugLog("safe-stop", {
        signal,
      });
      if (
        this.ws &&
        this.ws.readyState === WebSocket.OPEN
      ) {
        this.ws.send(
          JSON.stringify({
            type: "signal",
            signal,
          })
        );
      }
    } catch (error) {
      console.error(
        "Failed to stop Piston session:",
        error
      );
    }
  }

  stop(signal = "SIGTERM") {
    if (this.completed) {
      return;
    }

    if (this.stopping) {
      this.debugLog("stop-ignored", {
        signal,
        reason: "already-stopping",
      });
      return;
    }

    this.stopping = true;
    this.debugLog("stop-requested", {
      signal,
    });
    this.awaitingInput = false;
    this.clearWaitingTimer();
    this.clearSessionTimeout();
    this.updateState("stopping");
    this.safeStop(signal);

    this.clearStopTimer();
    this.stopTimer = setTimeout(() => {
      if (!this.completed) {
        this.debugLog("stop-escalate-sigkill", {
          signal: "SIGKILL",
        });
        this.safeStop("SIGKILL");
        this.finalizeStoppedSession();
      }
    }, 1500).unref?.();
  }

  close() {
    this.debugLog("ws-close-requested");
    this.clearWaitingTimer();
    this.clearSessionTimeout();
    this.clearStopTimer();

    try {
      if (
        this.ws &&
        this.ws.readyState === WebSocket.OPEN
      ) {
        this.ws.close();
      }
    } catch (error) {
      console.error(
        "Failed to close Piston session:",
        error
      );
    }
  }

  finish(stage, payload = {}) {
    if (this.completed) {
      return;
    }

    this.debugLog("finish-start", {
      stage,
      payload,
    });
    this.completed = true;
    this.currentStage = stage || this.currentStage;
    this.clearWaitingTimer();
    this.clearSessionTimeout();
    this.clearStopTimer();

    const finalPayload = {
      stage: this.currentStage,
      ...payload,
    };

    this.emit(
      SOCKET_EVENTS.CODE_EXECUTION_COMPLETED,
      finalPayload
    );

    this.updateState("completed", finalPayload);
    this.close();
    this.onTerminate?.();
    this.debugLog("finish-complete", {
      finalPayload,
    });
  }

  handleMessage(rawMessage) {
    const message =
      typeof rawMessage === "string"
        ? readJson(rawMessage)
        : readJson(Buffer.from(rawMessage).toString("utf8"));

    if (!message || typeof message !== "object") {
      this.debugLog("ws-message-ignored", {
        reason: "non-json",
      });
      return;
    }

    switch (message.type) {
      case "runtime": {
        this.markActivity("runtime", {
          language: message.language,
          version: message.version,
        });
        this.emit(
          SOCKET_EVENTS.CODE_EXECUTION_RUNTIME,
          {
            runtime: {
              language: message.language,
              version: message.version,
            },
          }
        );
        break;
      }

      case "stage": {
        this.currentStage =
          message.stage === "compile"
            ? "compile"
            : "run";

        this.awaitingInput = false;
        this.markActivity("stage", {
          stage: this.currentStage,
        });
        this.refreshSessionTimeout();
        this.updateState("running", {
          stage: this.currentStage,
        });

        if (this.currentStage === "run") {
          this.scheduleWaitingState();
        }

        break;
      }

      case "data": {
        if (
          message.stream === "stdout" ||
          message.stream === "stderr"
        ) {
          this.markActivity(message.stream, {
            stage: this.currentStage,
            bytes: encodeText(
              typeof message.data === "string"
                ? message.data
                : String(message.data ?? "")
            ),
          });
          this.emit(
            SOCKET_EVENTS.CODE_EXECUTION_OUTPUT,
            {
              stream: message.stream,
              data:
                typeof message.data === "string"
                  ? message.data
                  : String(message.data ?? ""),
            }
          );

          this.refreshSessionTimeout();

          if (this.currentStage === "run") {
            this.awaitingInput = false;
            this.updateState("running", {
              stage: this.currentStage,
            });
            this.scheduleWaitingState();
          }
        }

        break;
      }

      case "exit": {
        const exitPayload = {
          stage: message.stage || this.currentStage,
          code: message.code ?? null,
          signal: message.signal ?? null,
          message: message.message ?? null,
          status: message.status ?? null,
        };

        if (
          exitPayload.stage === "compile" &&
          (exitPayload.code !== 0 &&
            exitPayload.code !== null ||
            exitPayload.signal)
        ) {
          this.debugLog("exit-compile-error", {
            exitPayload,
          });
          this.finish("compile", exitPayload);
          return;
        }

        if (exitPayload.stage === "compile") {
          this.currentStage = "run";
          this.markActivity("compile-exit", {
            exitPayload,
          });
          this.refreshSessionTimeout();
          this.updateState("running", {
            stage: "run",
          });
          this.scheduleWaitingState();
          return;
        }

        this.debugLog("exit-run", {
          exitPayload,
        });
        this.finish("run", {
          ...exitPayload,
          cpu_time: message.cpu_time ?? null,
          wall_time: message.wall_time ?? null,
          memory: message.memory ?? null,
        });
        break;
      }

      case "error": {
        const messageText =
          message.message ||
          "Piston reported an execution error.";

        this.debugLog("piston-error", {
          message: messageText,
          status: message.status || "XX",
        });
        this.emit(
          SOCKET_EVENTS.CODE_EXECUTION_ERROR,
          {
            message: messageText,
          }
        );

        this.finish(this.currentStage, {
          code: null,
          signal: null,
          message: messageText,
          status: message.status || "XX",
        });
        break;
      }

      default:
        break;
    }
  }

  async sendInput(input) {
    if (this.completed) {
      this.debugLog("stdin-rejected-completed");
      throw createSocketError(
        "This interactive session has ended.",
        400
      );
    }

    if (this.currentStage !== "run") {
      this.debugLog("stdin-rejected-stage", {
        currentStage: this.currentStage,
      });
      throw createSocketError(
        "Input is only available during the run stage.",
        400
      );
    }

    const data = String(input ?? "");

    if (!data && data !== "") {
      return;
    }

    if (
      encodeText(data) >
      INTERACTIVE_INPUT_MAX_BYTES
    ) {
      this.debugLog("stdin-rejected-size", {
        bytes: encodeText(data),
        maxBytes: INTERACTIVE_INPUT_MAX_BYTES,
      });
      throw createSocketError(
        "Input line is too large.",
        413
      );
    }

    this.awaitingInput = false;
    this.markActivity("stdin", {
      bytes: encodeText(data),
    });
    this.updateState("running", {
      stage: this.currentStage,
    });
    this.refreshSessionTimeout();
    this.debugLog("stdin-send", {
      bytes: encodeText(data),
    });

    this.send({
      type: "data",
      stream: "stdin",
      data: data.endsWith("\n") ? data : `${data}\n`,
    });

    this.emit(SOCKET_EVENTS.CODE_EXECUTION_INPUT, {
      input: data,
    });

    this.scheduleWaitingState();
  }
}

export const registerInteractiveCodeRunner = (
  socket
) => {
  let activeSession = null;

  const clearActiveSession = () => {
    activeSession = null;
  };

  const ensureNoActiveSession = () => {
    if (activeSession && !activeSession.completed) {
      activeSession.debugLog("ensure-no-active-session-stop");
      activeSession.stop("SIGTERM");
      activeSession = null;
    }
  };

  socket.on(
    SOCKET_EVENTS.CODE_EXECUTION_START,
    async (payload, acknowledgment) => {
      try {
        const userId =
          socket.data.user?.id;

        if (!userId) {
          throw createSocketError(
            "Authentication required.",
            401
          );
        }

        enforceStartRateLimit(userId);
        console.info("[interactive-piston]", "start-request", {
          userId,
          language: payload?.language || "",
        });

        const sourceCode =
          typeof payload?.sourceCode === "string"
            ? payload.sourceCode
            : typeof payload?.source_code === "string"
              ? payload.source_code
              : "";

        if (!String(sourceCode || "").trim()) {
          throw createSocketError(
            "Source code is required.",
            400
          );
        }

        if (
          encodeText(sourceCode) >
          1024 * 1024
        ) {
          throw createSocketError(
            "Source code is too large.",
            413
          );
        }

        const normalizedLanguage = normalizeLanguage(
          payload?.language,
          payload?.fileName,
          sourceCode
        );

        if (!LANGUAGE_CONFIG[normalizedLanguage]) {
          throw createSocketError(
            "Only Python, C, and C++ are supported for interactive execution.",
            400
          );
        }

        ensureNoActiveSession();

        let session = null;

        session = new InteractivePistonSession({
          socket,
          sourceCode,
          language: normalizedLanguage,
          fileName: payload?.fileName || "",
          args: Array.isArray(payload?.args)
            ? payload.args
            : [],
          onTerminate: () => {
            if (activeSession === session) {
              activeSession = null;
            }

            if (
              socket.data.interactiveCodeSession ===
              session
            ) {
              delete socket.data.interactiveCodeSession;
            }
          },
        });

        activeSession = session;
        session.debugLog("session-created", {
          normalizedLanguage,
          fileName: payload?.fileName || "",
        });

        await session.open();

        socket.data.interactiveCodeSession = session;

        socket.emit(
          SOCKET_EVENTS.CODE_EXECUTION_STARTED,
          {
            sessionId: session.id,
            state: "starting",
            runtime: {
              language:
                LANGUAGE_CONFIG[normalizedLanguage].language,
              version:
                LANGUAGE_CONFIG[normalizedLanguage].version,
            },
          }
        );

        acknowledgment?.({
          success: true,
          sessionId: session.id,
          state: "starting",
          runtime: {
            language:
              LANGUAGE_CONFIG[normalizedLanguage].language,
            version:
              LANGUAGE_CONFIG[normalizedLanguage].version,
          },
        });
      } catch (error) {
        console.error("[interactive-piston]", "start-error", {
          message:
            error.message ||
            "Failed to start interactive execution.",
        });
        acknowledgment?.({
          success: false,
          message:
            error.message ||
            "Failed to start interactive execution.",
        });

        socket.emit(
          SOCKET_EVENTS.CODE_EXECUTION_ERROR,
          {
            message:
              error.message ||
              "Failed to start interactive execution.",
          }
        );
      }
    }
  );

  socket.on(
    SOCKET_EVENTS.CODE_EXECUTION_INPUT,
    async (payload, acknowledgment) => {
      try {
        if (!activeSession) {
          throw createSocketError(
            "No interactive session is active.",
            400
          );
        }

        activeSession.debugLog("stdin-request", {
          bytes: encodeText(payload?.input ?? ""),
        });
        await activeSession.sendInput(
          payload?.input ?? ""
        );

        acknowledgment?.({
          success: true,
          sessionId: activeSession.id,
        });
      } catch (error) {
        acknowledgment?.({
          success: false,
          message:
            error.message ||
            "Failed to send input.",
        });
      }
    }
  );

  socket.on(
    SOCKET_EVENTS.CODE_EXECUTION_STOP,
    (payload, acknowledgment) => {
      try {
        if (!activeSession) {
          acknowledgment?.({
            success: true,
            message: "No active session.",
          });
          return;
        }

        activeSession.finishReason = "stopped";
        activeSession.debugLog("stop-request", {
          signal: payload?.signal || "SIGTERM",
        });
        activeSession.stop(
          payload?.signal || "SIGTERM"
        );

        acknowledgment?.({
          success: true,
          sessionId: activeSession.id,
        });
      } catch (error) {
        acknowledgment?.({
          success: false,
          message:
            error.message ||
            "Failed to stop execution.",
        });
      }
    }
  );

  socket.on("disconnect", () => {
    if (activeSession) {
      activeSession.finishReason = "disconnect";
      activeSession.debugLog("socket-disconnect");
      activeSession.stop("SIGTERM");
      activeSession = null;
    }
  });

  return {
    getActiveSession: () => activeSession,
    clearActiveSession: clearActiveSession,
  };
};
