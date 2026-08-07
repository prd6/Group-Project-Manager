import {
  FaCopy,
  FaPlay,
  FaSave,
} from "react-icons/fa";

const EditorToolbar = ({
  fileName,
  language,
  languageOptions,
  onLanguageChange,
  fontSize,
  onFontSizeChange,
  onRun,
  onSave,
  onCopy,
  isRunning,
  isSaving,
  copied,
  isDirty,
  canRun,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] bg-[#0d0d10] px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium text-zinc-300">
          {fileName}
        </p>

        <p className="mt-0.5 text-[10px] text-zinc-600">
          {isDirty ? "Unsaved changes" : "Saved"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onRun}
          disabled={isRunning || !canRun}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500/15 px-3 py-2 text-[11px] font-medium text-emerald-300 transition hover:bg-emerald-500/25 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaPlay className="text-[10px]" />
          {isRunning ? "Running..." : "Run"}
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || !isDirty}
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] font-medium text-zinc-300 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FaSave className="text-[10px]" />
          {isSaving ? "Saving..." : "Save"}
        </button>

        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] font-medium text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
        >
          <FaCopy className="text-[10px]" />
          {copied ? "Copied" : "Copy"}
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
          <label className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
            Language
          </label>

          <select
            value={language}
            onChange={(event) => onLanguageChange(event.target.value)}
            className="bg-transparent text-[11px] font-medium text-zinc-200 outline-none"
          >
            {languageOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-[#111114] text-zinc-100"
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
          <label className="text-[10px] uppercase tracking-[0.12em] text-zinc-600">
            Font
          </label>

          <input
            type="number"
            min="11"
            max="24"
            step="1"
            value={fontSize}
            onChange={(event) =>
              onFontSizeChange(Number(event.target.value) || 13)
            }
            className="w-14 bg-transparent text-[11px] font-medium text-zinc-200 outline-none"
          />
        </div>
      </div>
    </div>
  );
};

export default EditorToolbar;
