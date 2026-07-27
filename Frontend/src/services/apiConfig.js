/**
 * Base API URL.
 * Reads from Vite environment and falls back to localhost during development.
 */
export const API_ORIGIN = (
    import.meta.env.VITE_API_ORIGIN || ""
).replace(/\/$/, "");

/**
 * Build a full API URL.
 * Supports both relative paths and already absolute URLs.
 */
export const buildApiUrl = (path = "") => {
    if (!path) return API_ORIGIN;

    if (
        path.startsWith("http://") ||
        path.startsWith("https://")
    ) {
        return path;
    }

    return `${API_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
};

/**
 * Safely parse API responses.
 */
export const parseApiResponse = async (response) => {
    const rawText = await response.text();

    if (!rawText) {
        return {
            data: null,
            errorMessage:
                response.statusText || "Request failed",
            rawText: "",
        };
    }

    try {
        const data = JSON.parse(rawText);

        return {
            data,
            errorMessage:
                data?.message ||
                response.statusText ||
                "Request failed",
            rawText,
        };
    } catch {
        const trimmed = rawText.trim();

        const isHtmlResponse =
            trimmed.startsWith("<!DOCTYPE") ||
            trimmed.startsWith("<html");

        return {
            data: null,
            errorMessage: isHtmlResponse
                ? `Request failed with status ${response.status}`
                : trimmed ||
                  response.statusText ||
                  "Request failed",
            rawText,
        };
    }
};

/**
 * Convert backend asset paths into accessible URLs.
 */
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
