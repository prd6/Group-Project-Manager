import { useEffect, useMemo, useRef, useState } from "react";

const STATUS_LABELS = {
  idle: "Idle",
  starting: "Running",
  running: "Running",
  waiting: "Waiting for input",
  stopping: "Stopping",
  completed: "Completed",
  error: "Error",
};

const STATUS_STYLES = {
  idle: "border-white/[0.07] bg-white/[0.03] text-zinc-500",
  starting:
    "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300",
  running:
    "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-300",
  waiting:
    "border-amber-500/20 bg-amber-500/[0.06] text-amber-300",
  stopping:
    "border-amber-500/20 bg-amber-500/[0.06] text-amber-300",
  completed:
    "border-white/[0.07] bg-white/[0.03] text-zinc-400",
  error:
    "border-red-500/20 bg-red-500/[0.06] text-red-300",
};

const streamStyles = {
  stdout: "text-zinc-200",
  stderr: "text-red-300",
  system: "text-zinc-600",
  input: "text-zinc-200",
};

const Console = ({
  entries = [],
  onSendInput,
  state = "idle",
  error = "",
  result = null,
}) => {
  const terminalRef = useRef(null);
  const inputRef = useRef(null);
  const [draft, setDraft] = useState("");

  const canType =
    state === "starting" ||
    state === "running" ||
    state === "waiting";

  const statusLabel =
    STATUS_LABELS[state] || STATUS_LABELS.idle;

  const completionStats = useMemo(
    () =>
      [
        {
          label: "Exit code",
          value:
            result?.code !== undefined &&
              result?.code !== null
              ? String(result.code)
              : "",
        },
        {
          label: "CPU time",
          value:
            result?.cpu_time !== undefined &&
              result?.cpu_time !== null
              ? `${result.cpu_time} ms`
              : "",
        },
        {
          label: "Wall time",
          value:
            result?.wall_time !== undefined &&
              result?.wall_time !== null
              ? `${result.wall_time} ms`
              : "",
        },
        {
          label: "Memory",
          value:
            result?.memory !== undefined &&
              result?.memory !== null
              ? `${(Number(result.memory) / 1024 / 1024).toFixed(2)} MB`
              : "",
        },
      ].filter((item) => item.value),
    [result]
  );

  useEffect(() => {
    const terminal = terminalRef.current;

    if (terminal) {
      terminal.scrollTop = terminal.scrollHeight;
    }
  }, [entries, state, error, result, draft]);

  useEffect(() => {
    if (canType) {
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [canType, state]);

  useEffect(() => {
    if (!canType) {
      setDraft("");
    }
  }, [canType]);

  const focusInput = () => {
    if (canType) {
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (event) => {
    if (!canType) {
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const line = draft;
      setDraft("");
      onSendInput?.(line);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  };

  const hasContent =
    entries.length > 0 || error || canType || state === "completed";

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#09090b]">
      <div className="flex shrink-0 items-center justify-between border-b border-white/[0.06] px-4 py-3">
        <div>
          <p className="text-[11px] font-medium text-zinc-300">
            Output
          </p>

          <p className="mt-0.5 text-[10px] text-zinc-600">
            {state === "waiting"
              ? "Program is waiting for input."
              : "Program output"}
          </p>
        </div>

        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${STATUS_STYLES[state] || STATUS_STYLES.idle
            }`}
        >
          {statusLabel}
        </span>
      </div>

      <div
        ref={terminalRef}
        tabIndex={0}
        role="textbox"
        aria-label="Interactive terminal"
        aria-multiline="true"
        onClick={focusInput}
        className="relative min-h-0 flex-1 overflow-auto px-4 py-4 font-mono text-[12px] leading-6 outline-none"
      >
        {error && (
          <div className="mb-3 whitespace-pre-wrap text-xs leading-5 text-red-300">
            {error}
          </div>
        )}

        {!hasContent ? (
          <div className="flex min-h-[180px] items-center justify-center text-xs text-zinc-700">
            Run the code to see output.
          </div>
        ) : (
          <div
            className="whitespace-pre-wrap break-words"
            onClick={focusInput}
          >
            {entries
              .filter((entry) => entry.kind !== "system")
              .map((entry) => (
                <span
                  key={entry.id}
                  className={
                    streamStyles[entry.kind] ||
                    streamStyles.system
                  }
                >
                  {entry.kind === "input"
                    ? `${entry.text}\n`
                    : entry.text}
                </span>
              ))}

            {canType && (
              <span className="text-zinc-100">
                {draft}
                <span className="ml-[1px] animate-pulse text-zinc-400">
                  |
                </span>
              </span>
            )}
          </div>
        )}

        <textarea
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!canType}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          aria-label="Terminal input"
          tabIndex={canType ? 0 : -1}
          className="absolute h-px w-px opacity-0"
        />

        {state === "completed" && (
          <div className="mt-5 border-t border-white/[0.05] pt-3">
            <div className="text-[10px] text-zinc-600">
              {result?.status === "stopped"
                ? "Process stopped"
                : `Process completed · code ${result?.code ?? "?"}`}
            </div>

            {result?.status !== "stopped" &&
              completionStats.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {completionStats.map((item) => (
                    <span
                      key={item.label}
                      className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[10px] text-zinc-500"
                    >
                      {item.label}: {item.value}
                    </span>
                  ))}
                </div>
              )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Console;
