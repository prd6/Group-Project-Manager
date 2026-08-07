const renderStatusLabel = (status = {}) => {
  const description = status?.description || "Not run yet";

  if (/accepted/i.test(description)) {
    return "Accepted";
  }

  return description;
};

const Console = ({
  stdin,
  onStdinChange,
  output,
  isRunning,
  error,
}) => {
  const hasOutput = Boolean(
    output?.stdout ||
      output?.stderr ||
      output?.compile_output ||
      output?.message
  );

  const outputSections = [
    {
      label: "stdout",
      value: output?.stdout,
    },
    {
      label: "stderr",
      value: output?.stderr,
    },
    {
      label: "compile_output",
      value: output?.compile_output,
    },
    {
      label: "message",
      value: output?.message,
    },
  ].filter((section) => section.value);

  return (
    <div className="grid min-h-0 gap-3 xl:grid-cols-[1fr_1.15fr]">
      <section className="flex min-h-[220px] flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#09090b]">
        <div className="shrink-0 border-b border-white/[0.07] px-4 py-3">
          <p className="text-[11px] font-medium text-zinc-300">
            Input (stdin)
          </p>
          <p className="mt-0.5 text-[10px] text-zinc-600">
            Anything you type here is sent to the program.
          </p>
        </div>

        <textarea
          value={stdin}
          onChange={(event) => onStdinChange(event.target.value)}
          spellCheck={false}
          placeholder="Enter stdin for the program..."
          className="min-h-0 flex-1 resize-none bg-transparent px-4 py-4 font-mono text-[12px] leading-6 text-zinc-200 outline-none placeholder:text-zinc-700"
        />
      </section>

      <section className="flex min-h-[220px] flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#09090b]">
        <div className="shrink-0 border-b border-white/[0.07] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium text-zinc-300">
                Output console
              </p>
              <p className="mt-0.5 text-[10px] text-zinc-600">
                Judge0 results, errors, and runtime metadata.
              </p>
            </div>

            <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-zinc-400">
              {isRunning
                ? "Running"
                : renderStatusLabel(output?.status)}
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
          {error ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-xs leading-6 text-red-300">
              {error}
            </div>
          ) : isRunning ? (
            <div className="flex h-full items-center justify-center text-xs text-zinc-600">
              Running code...
            </div>
          ) : hasOutput ? (
            <div className="space-y-4 text-xs leading-6 text-zinc-300">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
                    Status
                  </p>
                  <p className="mt-2 text-sm font-medium text-zinc-100">
                    {renderStatusLabel(output?.status)}
                  </p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                  <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
                    Metrics
                  </p>
                  <p className="mt-2 text-sm font-medium text-zinc-100">
                    {output?.time ? `${output.time}s` : "-"}
                    {"  "}
                    {typeof output?.memory === "number"
                      ? `${output.memory} KB`
                      : output?.memory || "-"}
                  </p>
                </div>
              </div>

              {outputSections.map((section) => (
                <div
                  key={section.label}
                  className="rounded-xl border border-white/[0.06] bg-[#0c0c10]"
                >
                  <div className="border-b border-white/[0.05] px-4 py-2">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
                      {section.label}
                    </p>
                  </div>

                  <pre className="overflow-x-auto whitespace-pre-wrap px-4 py-3 font-mono text-[12px] leading-6 text-zinc-200">
                    {String(section.value)}
                  </pre>
                </div>
              ))}

              {!outputSections.length && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 text-zinc-500">
                  No stdout, stderr, or compile output returned.
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02] px-6 text-center text-xs leading-6 text-zinc-600">
              Run the code to see stdout, stderr, compile errors, execution time,
              and memory usage here.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Console;
