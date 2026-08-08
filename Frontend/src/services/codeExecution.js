import socket, {
  connectSocket,
} from "./socket";

export const CODE_EXECUTION_EVENTS = {
  START: "code:interactive:start",
  STARTED: "code:interactive:started",
  INPUT: "code:interactive:input",
  STOP: "code:interactive:stop",
  STATE: "code:interactive:state",
  OUTPUT: "code:interactive:output",
  RUNTIME: "code:interactive:runtime",
  COMPLETED: "code:interactive:completed",
  ERROR: "code:interactive:error",
  CLEAR: "code:interactive:clear",
};

export const ensureSocketConnected = async () => {
  if (socket.connected) {
    return socket;
  }

  connectSocket();

  await new Promise((resolve, reject) => {
    const onConnect = () => {
      cleanup();
      resolve();
    };

    const onError = (error) => {
      cleanup();
      reject(
        error instanceof Error
          ? error
          : new Error(
              error?.message ||
                "Failed to connect to the execution socket."
            )
      );
    };

    const cleanup = () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
    };

    socket.once("connect", onConnect);
    socket.once("connect_error", onError);
  });

  return socket;
};

export const startInteractiveExecution = async (
  payload
) => {
  await ensureSocketConnected();

  return new Promise((resolve, reject) => {
    socket.emit(
      CODE_EXECUTION_EVENTS.START,
      payload,
      (response) => {
        if (response?.success) {
          resolve(response);
          return;
        }

        reject(
          new Error(
            response?.message ||
              "Failed to start interactive execution."
          )
        );
      }
    );
  });
};

export const sendInteractiveInput = async (
  input
) => {
  await ensureSocketConnected();

  return new Promise((resolve, reject) => {
    socket.emit(
      CODE_EXECUTION_EVENTS.INPUT,
      { input },
      (response) => {
        if (response?.success) {
          resolve(response);
          return;
        }

        reject(
          new Error(
            response?.message ||
              "Failed to send input."
          )
        );
      }
    );
  });
};

export const stopInteractiveExecution = async (
  signal = "SIGTERM"
) => {
  await ensureSocketConnected();

  return new Promise((resolve, reject) => {
    socket.emit(
      CODE_EXECUTION_EVENTS.STOP,
      { signal },
      (response) => {
        if (response?.success) {
          resolve(response);
          return;
        }

        reject(
          new Error(
            response?.message ||
              "Failed to stop interactive execution."
          )
        );
      }
    );
  });
};

export { socket };

export default socket;
