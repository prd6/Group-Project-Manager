import Editor from "@monaco-editor/react";

const editorOptions = {
  automaticLayout: true,
  fontLigatures: true,
  fontSize: 13,
  minimap: {
    enabled: false,
  },
  lineNumbers: "on",
  renderLineHighlight: "all",
  wordWrap: "off",
  smoothScrolling: true,
  cursorSmoothCaretAnimation: "on",
  scrollBeyondLastLine: false,
  scrollbar: {
    verticalScrollbarSize: 10,
    horizontalScrollbarSize: 10,
  },
  padding: {
    top: 16,
    bottom: 16,
  },
  tabSize: 2,
  insertSpaces: true,
  formatOnPaste: true,
  formatOnType: true,
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  bracketPairColorization: {
    enabled: true,
  },
};

const CodeEditor = ({
  value,
  onChange,
  language,
  fileName,
  editorKey,
  fontSize = 13,
  loading = false,
}) => {
  return (
    <div className="relative h-full min-h-[320px] overflow-hidden rounded-xl border border-white/[0.06] bg-[#09090b] shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      {loading ? (
        <div className="flex h-full items-center justify-center bg-[#09090b] px-6 text-center text-xs text-zinc-600">
          Loading editor...
        </div>
      ) : (
        <Editor
          key={editorKey || `${fileName}-${language}`}
          height="100%"
          width="100%"
          theme="vs-dark"
          language={language}
          path={fileName || undefined}
          value={value}
          onChange={(nextValue) => onChange(nextValue ?? "")}
          options={{
            ...editorOptions,
            fontSize,
          }}
          loading={
            <div className="flex h-full items-center justify-center bg-[#09090b] px-6 text-center text-xs text-zinc-600">
              Loading Monaco Editor...
            </div>
          }
        />
      )}
    </div>
  );
};

export default CodeEditor;
