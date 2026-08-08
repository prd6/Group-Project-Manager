import { createHttpError } from "../utils/groupAccess.js";

const PISTON_BASE_URL =
  process.env.PISTON_API_URL || "http://localhost:2000";

const PISTON_TIMEOUT_MS =
  Number(process.env.PISTON_TIMEOUT_MS) || 15000;

const LANGUAGE_CONFIG = {
  python: {
    language: "python",
    version: "3.12.0",
    extension: "py",
    fileName: "main.py",
  },

  c: {
    language: "c",
    version: "10.2.0",
    extension: "c",
    fileName: "main.c",
  },

  cpp: {
    language: "c++",
    version: "10.2.0",
    extension: "cpp",
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
      return /\bcout\b|using\s+namespace\s+std/.test(code)
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

  // Normalize common frontend language names.
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

const readPistonError = async (response) => {
  const text = await response.text();

  if (!text) {
    return response.statusText || "Piston request failed.";
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

  const normalizedLanguage =
    normalizeLanguage(
      editorLanguage,
      fileName,
      normalizedSource
    );

  const config =
    LANGUAGE_CONFIG[normalizedLanguage];

  if (!config) {
    throw createHttpError(
      400,
      "Only Python, C, and C++ are supported for execution."
    );
  }

  const args = String(
    commandLineArguments || ""
  )
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  const payload = {
    language: config.language,
    version: config.version,

    files: [
      {
        name: config.fileName,
        content: normalizedSource,
      },
    ],

    stdin: normalizedStdin,

    args,

    run_timeout: 3000,
    run_cpu_time: 3000,

    compile_timeout: 10000,
    compile_cpu_time: 10000,
  };

  const controller =
    new AbortController();

  const timeoutId = setTimeout(
    () => controller.abort(),
    PISTON_TIMEOUT_MS
  );

  try {
    const response = await fetch(
      `${PISTON_BASE_URL}/api/v2/execute`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(payload),

        signal: controller.signal,
      }
    );

    if (!response.ok) {
      throw createHttpError(
        response.status >= 500
          ? 502
          : response.status,
        await readPistonError(response)
      );
    }

    const data =
      await response.json();

    const stage =
      data?.compile || data?.run || {};

    return {
      language: data.language,
      version: data.version,

      stdout:
        data?.run?.stdout || "",

      stderr:
        data?.run?.stderr ||
        data?.compile?.stderr ||
        "",

      output:
        data?.run?.output ||
        data?.compile?.output ||
        "",

      code:
        data?.run?.code ??
        data?.compile?.code ??
        null,

      signal:
        data?.run?.signal ??
        data?.compile?.signal ??
        null,

      message:
        data?.run?.message ||
        data?.compile?.message ||
        null,

      status:
        data?.run?.status ||
        data?.compile?.status ||
        null,

      cpu_time:
        data?.run?.cpu_time ??
        data?.compile?.cpu_time ??
        null,

      wall_time:
        data?.run?.wall_time ??
        data?.compile?.wall_time ??
        null,

      memory:
        data?.run?.memory ??
        data?.compile?.memory ??
        null,
    };
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createHttpError(
        504,
        "Code execution timed out."
      );
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};