import { createHttpError } from "../utils/groupAccess.js";

const JUDGE0_BASE_URL = (
  process.env.JUDGE0_API_URL || "https://ce.judge0.com"
).replace(/\/$/, "");

const JUDGE0_AUTH_HEADER =
  process.env.JUDGE0_AUTH_HEADER || "X-Auth-User";

const JUDGE0_AUTH_TOKEN =
  process.env.JUDGE0_AUTH_TOKEN || "";

const JUDGE0_TIMEOUT_MS =
  Number(process.env.JUDGE0_TIMEOUT_MS) || 30000;

const LANGUAGE_CACHE_TTL_MS =
  Number(process.env.JUDGE0_LANGUAGE_CACHE_TTL_MS) ||
  60 * 60 * 1000;

let cachedLanguages = null;
let cachedLanguagesAt = 0;

const EDITOR_TO_JUDGE0_MATCHERS = {
  javascript: [/javascript/i, /node\.?js/i],
  jsx: [/javascript/i, /node\.?js/i],
  typescript: [/typescript/i],
  tsx: [/typescript/i],
  python: [/python/i],
  java: [/java/i],
  c: [/^c\s*\(/i, /\bc\s*\(/i],
  cpp: [/c\+\+/i],
  csharp: [/c#/i, /csharp/i],
  php: [/php/i],
  ruby: [/ruby/i],
  go: [/\bgo\b/i],
  rust: [/rust/i],
  swift: [/swift/i],
  kotlin: [/kotlin/i],
  shell: [/bash/i, /shell/i],
};

const SUPPORTED_EDITOR_LANGUAGES = new Set(
  Object.keys(EDITOR_TO_JUDGE0_MATCHERS)
);

const EXTENSION_TO_EDITOR_LANGUAGE = {
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
  sh: "shell",
  bash: "shell",
};

const getFileExtension = (fileName = "") =>
  String(fileName)
    .split(".")
    .pop()
    .toLowerCase();

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

const getDefaultEditorLanguage = (
  fileName = "",
  sourceCode = ""
) => {
  const extension =
    EXTENSION_TO_EDITOR_LANGUAGE[
      getFileExtension(fileName)
    ];

  if (extension) {
    return extension;
  }

  const content = String(sourceCode || "");

  if (looksLikePython(content)) {
    return "python";
  }

  if (looksLikeShell(content)) {
    return "shell";
  }

  if (looksLikeTypeScript(content)) {
    return "typescript";
  }

  if (looksLikeJavaScript(content)) {
    return "javascript";
  }

  if (looksLikeCFamily(content)) {
    return "cpp";
  }

  return "plaintext";
};

const buildRequestHeaders = () => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (JUDGE0_AUTH_TOKEN) {
    headers[JUDGE0_AUTH_HEADER] = JUDGE0_AUTH_TOKEN;
  }

  return headers;
};

const readResponseError = async (response) => {
  const text = await response.text();

  if (!text) {
    return response.statusText || "Judge0 request failed";
  }

  try {
    const parsed = JSON.parse(text);
    return (
      parsed?.message ||
      parsed?.error ||
      response.statusText ||
      text
    );
  } catch {
    return text;
  }
};

const fetchJudge0Languages = async () => {
  const now = Date.now();

  if (
    cachedLanguages &&
    now - cachedLanguagesAt < LANGUAGE_CACHE_TTL_MS
  ) {
    return cachedLanguages;
  }

  const response = await fetch(`${JUDGE0_BASE_URL}/languages`);

  if (!response.ok) {
    throw createHttpError(
      502,
      await readResponseError(response)
    );
  }

  const languages = await response.json();

  cachedLanguages = Array.isArray(languages)
    ? languages
    : [];

  cachedLanguagesAt = now;

  return cachedLanguages;
};

const matchesAny = (value, matchers = []) =>
  matchers.some((matcher) => matcher.test(value));

export const resolveJudge0LanguageId = async ({
  editorLanguage = "auto",
  fileName = "",
  sourceCode = "",
}) => {
  const normalizedLanguage = (
    String(editorLanguage || "").trim() === "auto"
      ? getDefaultEditorLanguage(fileName, sourceCode)
      : String(editorLanguage || "").trim()
  );

  if (!SUPPORTED_EDITOR_LANGUAGES.has(normalizedLanguage)) {
    throw createHttpError(
      400,
      "Selected language is not supported for execution."
    );
  }

  const activeLanguages =
    await fetchJudge0Languages();

  const matchers =
    EDITOR_TO_JUDGE0_MATCHERS[normalizedLanguage] || [];

  const candidate = activeLanguages.find((language) =>
    matchesAny(
      String(language?.name || ""),
      matchers
    )
  );

  if (!candidate?.id) {
    throw createHttpError(
      400,
      "No matching Judge0 runtime is available for the selected language."
    );
  }

  return candidate.id;
};

export const runJudge0Code = async ({
  sourceCode,
  stdin = "",
  editorLanguage = "auto",
  fileName = "",
  compilerOptions = "",
  commandLineArguments = "",
}) => {
  const normalizedSource = String(sourceCode ?? "");
  const normalizedStdin = String(stdin ?? "");

  if (!normalizedSource.trim()) {
    throw createHttpError(
      400,
      "Source code is required."
    );
  }

  if (
    Buffer.byteLength(
      normalizedSource,
      "utf8"
    ) > 1024 * 1024
  ) {
    throw createHttpError(
      413,
      "Source code is too large."
    );
  }

  if (
    Buffer.byteLength(
      normalizedStdin,
      "utf8"
    ) > 128 * 1024
  ) {
    throw createHttpError(
      413,
      "Standard input is too large."
    );
  }

  const judge0LanguageId =
    await resolveJudge0LanguageId({
      editorLanguage,
      fileName,
      sourceCode: normalizedSource,
    });

  const payload = {
    source_code: normalizedSource,
    language_id: judge0LanguageId,
    stdin: normalizedStdin,
    compiler_options: String(compilerOptions || ""),
    command_line_arguments: String(
      commandLineArguments || ""
    ),
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    JUDGE0_TIMEOUT_MS
  );

  try {
    const response = await fetch(
      `${JUDGE0_BASE_URL}/submissions?base64_encoded=false&wait=true`,
      {
        method: "POST",
        headers: buildRequestHeaders(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw createHttpError(
        response.status >= 500 ? 502 : response.status,
        await readResponseError(response)
      );
    }

    const data = await response.json();

    return {
      ...data,
      judge0LanguageId,
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createHttpError(
        504,
        "Judge0 execution timed out."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};
