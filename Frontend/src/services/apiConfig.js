export const API_ORIGIN =
  import.meta.env.VITE_API_ORIGIN || "http://localhost:5000";

export const buildApiUrl = (path) =>
  `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;

export const parseApiResponse = async (response) => {
  const rawText = await response.text();

  if (!rawText) {
    return {
      data: null,
      errorMessage: response.statusText || "Request failed",
      rawText: "",
    };
  }

  try {
    const data = JSON.parse(rawText);

    return {
      data,
      errorMessage:
        data?.message || response.statusText || "Request failed",
      rawText,
    };
  } catch {
    const trimmed = rawText.trim();
    const isHtmlResponse =
      trimmed.startsWith("<!DOCTYPE") || trimmed.startsWith("<html");

    return {
      data: null,
      errorMessage: isHtmlResponse
        ? `Request failed with status ${response.status}`
        : trimmed || response.statusText || "Request failed",
      rawText,
    };
  }
};

export const getAssetUrl = (path) => {
  if (!path) return "";

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  return buildApiUrl(path);
};
