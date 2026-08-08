export const CODE_EXTENSIONS = new Set([
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "java",
  "c",
  "cpp",
  "h",
  "hpp",
  "cs",
  "php",
  "rb",
  "go",
  "rs",
  "swift",
  "kt",
  "kts",
  "html",
  "css",
  "scss",
  "sass",
  "less",
  "json",
  "xml",
  "yaml",
  "yml",
  "sql",
  "sh",
  "bash",
  "md",
  "txt",
  "env",
]);

export const MONACO_LANGUAGE_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "javascript", label: "JavaScript" },
  { value: "jsx", label: "JSX" },
  { value: "typescript", label: "TypeScript" },
  { value: "tsx", label: "TSX" },
  { value: "python", label: "Python" },
  { value: "java", label: "Java" },
  { value: "c", label: "C" },
  { value: "cpp", label: "C++" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "rust", label: "Rust" },
  { value: "swift", label: "Swift" },
  { value: "kotlin", label: "Kotlin" },
  { value: "shell", label: "Bash" },
  { value: "html", label: "HTML" },
  { value: "css", label: "CSS" },
  { value: "scss", label: "SCSS" },
  { value: "less", label: "Less" },
  { value: "json", label: "JSON" },
  { value: "xml", label: "XML" },
  { value: "yaml", label: "YAML" },
  { value: "sql", label: "SQL" },
  { value: "markdown", label: "Markdown" },
  { value: "plaintext", label: "Text" },
];

const EXTENSION_TO_MONACO_LANGUAGE = {
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  py: "python",
  java: "java",
  c: "c",
  cpp: "cpp",
  h: "c",
  hpp: "cpp",
  cs: "csharp",
  php: "php",
  rb: "ruby",
  go: "go",
  rs: "rust",
  swift: "swift",
  kt: "kotlin",
  kts: "kotlin",
  html: "html",
  css: "css",
  scss: "scss",
  sass: "scss",
  less: "less",
  json: "json",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  sql: "sql",
  sh: "shell",
  bash: "shell",
  md: "markdown",
  txt: "plaintext",
  env: "plaintext",
};

export const getFileExtension = (fileName = "") =>
  fileName.split(".").pop()?.toLowerCase() || "";

export const isCodeFileName = (fileName = "") =>
  CODE_EXTENSIONS.has(getFileExtension(fileName));

const looksLikeJavaScript = (content = "") =>
  /(?:\bimport\b|\bexport\b|=>|function\s+\w+\s*\(|console\.(log|error|warn)|React\.createElement)/.test(
    content
  );

const looksLikeTypeScript = (content = "") =>
  /(?:interface\s+\w+|type\s+\w+\s*=|:\s*(string|number|boolean|unknown|any)\b)/.test(
    content
  );

const looksLikePython = (content = "") =>
  /(?:^\s*def\s+\w+\s*\(|^\s*class\s+\w+\s*\(|^\s*print\s*\(|^\s*import\s+\w+)/m.test(
    content
  );

const looksLikeShell = (content = "") =>
  /(?:^\s*#!\/usr\/bin\/env\s+(bash|sh)|^\s*echo\s+|^\s*export\s+\w+=)/m.test(
    content
  );

const looksLikeCFamily = (content = "") =>
  /(?:#include\s*[<"]|\bint\s+main\s*\(|\busing\s+namespace\s+std\b)/.test(
    content
  );

export const detectMonacoLanguage = (
  fileName = "",
  content = ""
) => {
  const extension = getFileExtension(fileName);

  if (EXTENSION_TO_MONACO_LANGUAGE[extension]) {
    return EXTENSION_TO_MONACO_LANGUAGE[extension];
  }

  const source = String(content || "");

  if (looksLikePython(source)) {
    return "python";
  }

  if (looksLikeShell(source)) {
    return "shell";
  }

  if (looksLikeTypeScript(source)) {
    return "typescript";
  }

  if (looksLikeJavaScript(source)) {
    return "javascript";
  }

  if (looksLikeCFamily(source)) {
    return "cpp";
  }

  return "plaintext";
};

const MONACO_TO_EXECUTION_LANGUAGE = {
  python: "python",
  c: "c",
  cpp: "cpp",
  h: "c",
  hpp: "cpp",
};

export const getExecutionLanguage = (language = "") =>
  MONACO_TO_EXECUTION_LANGUAGE[
    String(language).toLowerCase()
  ] || null;

export const isRunnableMonacoLanguage = (language = "") =>
  Boolean(getExecutionLanguage(language));
