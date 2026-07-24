import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

import {
  FaDownload,
  FaTrash,
  FaSearch,
  FaTimes,
  FaBars,
  FaChevronLeft,
} from "react-icons/fa";

import UserAvatar from "../Components/UserAvatar";

const FilesPage = () => {
  const { groupId } = useParams();

  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [fileContent, setFileContent] = useState("");
  const [loadingContent, setLoadingContent] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  /* =========================
         FETCH FILES
      ========================== */

  const fetchFiles = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/files/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setFiles(data);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* =========================
         DELETE FILE
      ========================== */

  const handleDelete = async () => {
    if (!selectedFile) return;

    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${selectedFile.originalName}"?`,
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `http://localhost:5000/api/files/${selectedFile._id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        setSelectedFile(null);
        setPreviewFile(null);
        fetchFiles();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong.");
    }
  };

  /* =========================
         FILE ICON
      ========================== */

  const getFileIcon = (fileType, large = false) => {
    const size = large ? "text-3xl" : "text-xl";

    if (!fileType) return <FaFileAlt className={`${size} text-zinc-400`} />;

    if (fileType.includes("pdf"))
      return <FaFilePdf className={`${size} text-red-400`} />;

    if (fileType.startsWith("image/"))
      return <FaFileImage className={`${size} text-sky-400`} />;

    if (fileType.includes("word"))
      return <FaFileWord className={`${size} text-blue-400`} />;

    if (fileType.includes("excel") || fileType.includes("spreadsheet"))
      return <FaFileExcel className={`${size} text-emerald-400`} />;

    if (
      fileType.includes("zip") ||
      fileType.includes("rar") ||
      fileType.includes("7z")
    )
      return <FaFileArchive className={`${size} text-amber-400`} />;

    return <FaFileAlt className={`${size} text-zinc-400`} />;
  };

  /* =========================
         HELPERS
      ========================== */

  const filteredFiles = files.filter((file) =>
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const totalStorage = files.reduce((total, file) => total + file.fileSize, 0);

  const getFileUrl = (fileId) =>
    `http://localhost:5000/api/files/view/${fileId}`;

  const getDownloadUrl = (fileId) =>
    `http://localhost:5000/api/files/download/${fileId}`;

  const canDelete =
    selectedFile &&
    (selectedFile.currentUserRole === "Owner" ||
      selectedFile.uploadedBy?._id === currentUser?._id);

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSelectFile = async (file) => {
    setSelectedFile(file);
    setPreviewFile(file);
    setFileContent("");

    if (!isCodeFile(file)) {
      return;
    }

    try {
      setLoadingContent(true);

      const token = localStorage.getItem("token");

      const response = await fetch(getFileUrl(file.fileUrl), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load file");
      }

      const text = await response.text();

      setFileContent(text);
    } catch (error) {
      console.error("Failed to load file content:", error);
      setFileContent("Unable to load this file.");
    } finally {
      setLoadingContent(false);
    }
  };

  const maxStorage = 20 * 1024 * 1024; // 100 MB

  const storagePercentage = Math.min((totalStorage / maxStorage) * 100, 100);

  const codeExtensions = [
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
  ];

  const getFileExtension = (fileName = "") => {
    return fileName.split(".").pop()?.toLowerCase() || "";
  };

  const isCodeFile = (file) => {
    if (!file) return false;

    const extension = getFileExtension(file.originalName);

    return codeExtensions.includes(extension);
  };

  const getLanguage = (fileName = "") => {
    const extension = getFileExtension(fileName);

    const languages = {
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
      sass: "sass",
      less: "less",

      json: "json",

      xml: "xml",

      yaml: "yaml",
      yml: "yaml",

      sql: "sql",

      sh: "bash",
      bash: "bash",

      md: "markdown",

      txt: "text",
      env: "text",
    };

    return languages[extension] || "text";
  };

  const handleCopyFile = async () => {
    if (!fileContent) return;

    try {
      await navigator.clipboard.writeText(fileContent);

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy file:", error);
    }
  };

  /* =========================
         UI
      ========================== */

  return (
    <>

      <div className="h-[calc(100vh-64px)] bg-[#08080a] text-white flex flex-col overflow-hidden">
        {/* =====================================================
                SECOND NAVBAR
            ====================================================== */}

        <div
          className="
        shrink-0
        border-b border-white/[0.07]
        bg-[#08080d]/80
        backdrop-blur-xl
    "
        >
          <div
            className="
            flex
            min-h-15
            items-center
            justify-between
            gap-6
            px-5
            md:px-7
        "
          >
            {/* LEFT */}

            <div className="flex min-w-0 items-center gap-4">
              {/* Small accent */}

              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <h1
                    className="
                            truncate
                            text-2xl
                            font-semibold
                            tracking-tight
                            text-zinc-100
                        "
                  >
                    Project Files
                  </h1>
                </div>
              </div>
            </div>

            {/* RIGHT */}

            <div className="flex shrink-0 items-center">
              {/* Total files */}

              <div
                className="
                    hidden
                    sm:block
                    border-r border-white/[0.07]
                    px-5
                    text-right
                "
              >
                <p
                  className="
                        text-[9px]
                        font-medium
                        uppercase
                        tracking-[0.12em]
                        text-zinc-600
                    "
                >
                  Files
                </p>

                <p
                  className="
                        mt-0.5
                        text-xs
                        font-medium
                        text-zinc-300
                    "
                >
                  {files.length}
                </p>
              </div>

              {/* Storage */}

              <div className="hidden sm:block w-[190px] pl-5">
                {/* Label + usage */}
                <div className="flex items-center justify-between">
                  <p
                    className="
                text-[9px]
                font-medium
                uppercase
                tracking-[0.12em]
                text-zinc-600
            "
                  >
                    Storage
                  </p>

                  <p className="text-[10px] font-medium text-zinc-400">
                    {formatFileSize(totalStorage)} / {maxStorage / 1024 / 1024}{" "}
                    MB
                  </p>
                </div>

                {/* Storage Bar */}
                <div
                  className="
            mt-2
            h-[5px]
            w-full
            overflow-hidden
            rounded-full
            bg-white/[0.07]
        "
                >
                  <div
                    className="
                h-full
                rounded-full
                bg-violet-500
                transition-all
                duration-500
            "
                    style={{
                      width: `${storagePercentage}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
                WORKSPACE
            ====================================================== */}

        <div className="relative flex flex-1 min-h-0">
          {/* =================================================
                    SIDEBAR
                ================================================== */}

          <aside
            className={`
                        shrink-0
                        overflow-hidden
                        border-r border-white/[0.07]
                        bg-[#0b0b0e]
                        transition-[width]
                        duration-300
                        ease-in-out

                        ${sidebarOpen ? "w-[340px]" : "w-0 border-r-0"}
                    `}
          >
            <div className="flex h-full w-[340px] flex-col">
              {/* Sidebar header */}

              <div
                className="
                                shrink-0
                                border-b border-white/[0.06]
                                px-4 py-4
                            "
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold">Files</h2>

                    <p className="mt-0.5 text-[11px] text-zinc-600">
                      {filteredFiles.length} items
                    </p>
                  </div>

                  {/* Close sidebar */}

                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="
                                        flex
                                        h-8 w-8
                                        items-center
                                        justify-center
                                        rounded-lg
                                        text-zinc-500
                                        transition
                                        hover:bg-white/[0.05]
                                        hover:text-white
                                    "
                    title="Close sidebar"
                  >
                    <FaChevronLeft className="text-xs" />
                  </button>
                </div>

                {/* Search */}

                <div className="relative mt-4">
                  <FaSearch
                    className="
                                        absolute
                                        left-3
                                        top-1/2
                                        -translate-y-1/2
                                        text-[11px]
                                        text-zinc-600
                                    "
                  />

                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search files..."
                    className="
                                        w-full
                                        rounded-lg
                                        border border-white/[0.07]
                                        bg-white/[0.025]
                                        py-2.5
                                        pl-9 pr-8
                                        text-xs
                                        text-zinc-200
                                        outline-none
                                        transition
                                        placeholder:text-zinc-600
                                        focus:border-violet-500/40
                                        focus:ring-1
                                        focus:ring-violet-500/20
                                    "
                  />

                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="
                                            absolute
                                            right-3
                                            top-1/2
                                            -translate-y-1/2
                                            text-zinc-600
                                            hover:text-white
                                        "
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  )}
                </div>
              </div>

              {/* =============================================
                            FILE CARDS
                        ============================================== */}

              <div
                className="
                                flex-1
                                overflow-y-auto
                                p-2
                            "
              >
                {filteredFiles.length === 0 ? (
                  <div
                    className="
                                        flex h-40
                                        items-center
                                        justify-center
                                        text-xs
                                        text-zinc-600
                                    "
                  >
                    No files found
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredFiles.map((file) => {
                      const active = selectedFile?._id === file._id;

                      return (
                        <button
                          key={file._id}
                          onClick={() => handleSelectFile(file)}
                          className={`
                                                    w-full
                                                    rounded-lg
                                                    border
                                                    px-3 py-3
                                                    text-left
                                                    transition

                                                    ${
                                                      active
                                                        ? `
                                                                border-violet-500/30
                                                                bg-violet-500/[0.08]
                                                            `
                                                        : `
                                                                border-transparent
                                                                hover:border-white/[0.06]
                                                                hover:bg-white/[0.03]
                                                            `
                                                    }
                                                `}
                        >
                          {/* File name */}

                          <p
                            title={file.originalName}
                            className={`
                                                        truncate
                                                        text-[13px]
                                                        font-medium

                                                        ${
                                                          active
                                                            ? "text-white"
                                                            : "text-zinc-300"
                                                        }
                                                    `}
                          >
                            {file.originalName}
                          </p>

                          {/* Size */}

                          <p
                            className="
                                                        mt-1
                                                        text-[10px]
                                                        text-zinc-600
                                                    "
                          >
                            {formatFileSize(file.fileSize)}
                          </p>

                          {/* Uploaded by */}

                          <div
                            className="
                                                        mt-3
                                                        flex
                                                        items-center
                                                        gap-2
                                                    "
                          >
                            <UserAvatar user={file.uploadedBy} size="sm" />

                            <div className="min-w-0">
                              <p
                                className="
                                                                text-[9px]
                                                                text-zinc-600
                                                            "
                              >
                                Uploaded by
                              </p>

                              <p
                                className="
                                                                truncate
                                                                text-[11px]
                                                                text-zinc-400
                                                            "
                              >
                                {file.uploadedBy?.name || "Unknown User"}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* =================================================
                    MAIN FILE AREA
                ================================================== */}

          <main className="relative flex min-w-0 flex-1 flex-col bg-[#08080a]">
            {/* Open sidebar button */}

            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="
                                absolute
                                left-4 top-4
                                z-30
                                flex
                                h-9 w-9
                                items-center
                                justify-center
                                rounded-lg
                                border border-white/[0.08]
                                bg-[#111114]
                                text-zinc-400
                                shadow-lg
                                transition
                                hover:bg-[#18181c]
                                hover:text-white
                            "
                title="Open files"
              >
                <FaBars className="text-xs" />
              </button>
            )}

            {!selectedFile ? (
              /* =========================================
                                              EMPTY STATE
                                          ========================================== */

              <div
                className="
                                flex
                                flex-1
                                items-center
                                justify-center
                            "
              >
                <div className="text-center">
                  <div
                    className="
                                        mx-auto
                                        h-10 w-10
                                        rounded-xl
                                        border border-white/[0.07]
                                        bg-white/[0.025]
                                    "
                  />

                  <h2
                    className="
                                        mt-4
                                        text-sm
                                        font-medium
                                        text-zinc-300
                                    "
                  >
                    Select a file
                  </h2>

                  <p
                    className="
                                        mt-1
                                        text-xs
                                        text-zinc-600
                                    "
                  >
                    Choose a file from the sidebar to preview it.
                  </p>
                </div>
              </div>
            ) : (
              <>
{/* =====================================
    FILE HEADER
====================================== */}

<div
    className="
        shrink-0
        border-b border-white/[0.07]
        bg-[#0b0b0e]
        px-5 py-4
    "
>
    <div
        className={`
            flex
            items-center
            justify-between
            gap-6
            ${!sidebarOpen ? "pl-12" : ""}
        `}
    >
        {/* LEFT */}

        <div className="min-w-0">

            {/* Filename */}

            <h2
                title={selectedFile.originalName}
                className="
                    truncate
                    text-[14px]
                    font-semibold
                    text-zinc-100
                    md:max-w-[650px]
                "
            >
                {selectedFile.originalName}
            </h2>

            {/* All metadata in ONE row */}

            <div
                className="
                    mt-2
                    flex
                    flex-wrap
                    items-center
                    gap-2
                    text-[10px]
                    text-zinc-600
                "
            >
                {/* Size */}

                <span>
                    {formatFileSize(selectedFile.fileSize)}
                </span>

                <span className="text-zinc-700">•</span>

                {/* Type */}

                <span>
                    {selectedFile.fileType}
                </span>

                <span className="mx-1 text-zinc-800">
                    |
                </span>

                {/* PFP */}

                <UserAvatar
                    user={selectedFile.uploadedBy}
                    size="sm"
                />

                <span>
                    Uploaded by
                </span>

                <span className="font-medium text-zinc-300">
                    {selectedFile.uploadedBy?.name ||
                        "Unknown User"}
                </span>

                <span className="text-zinc-700">•</span>

                {/* Date */}

                <span>
                    {new Date(
                        selectedFile.createdAt
                    ).toLocaleString()}
                </span>
            </div>

        </div>


        {/* RIGHT ACTIONS */}

        <div className="flex shrink-0 items-center gap-2">

            <a
                href={getDownloadUrl(
                    selectedFile.fileUrl
                )}
                className="
                    rounded-lg
                    border border-white/[0.08]
                    bg-white/[0.035]
                    px-3.5 py-2
                    text-[11px]
                    font-medium
                    text-zinc-300
                    transition
                    hover:bg-white/[0.07]
                    hover:text-white
                "
            >
                Download
            </a>

            {canDelete && (
                <button
                    onClick={handleDelete}
                    className="
                        rounded-lg
                        border border-red-500/20
                        bg-red-500/[0.05]
                        px-3.5 py-2
                        text-[11px]
                        font-medium
                        text-red-400
                        transition
                        hover:bg-red-500/10
                    "
                >
                    Delete
                </button>
            )}

        </div>
    </div>
</div>
                {/* =====================================
                                FILE PREVIEW
                    ====================================== */}

                <div
                  className="
        min-h-0
        flex-1
        overflow-hidden
        bg-[#050507]
        p-3
    "
                >
                  <div
                    className="
            h-full
            overflow-hidden
            rounded-lg
            border
            border-white/[0.06]
            bg-[#09090b]
        "
                  >
                    {/* =================================
            IMAGE
        ================================== */}

                    {previewFile?.fileType?.startsWith("image/") ? (
                      <div
                        className="
                    flex
                    h-full
                    items-center
                    justify-center
                    overflow-auto
                    p-5
                "
                      >
                        <img
                          src={getFileUrl(previewFile.fileUrl)}
                          alt={previewFile.originalName}
                          className="
                        max-h-full
                        max-w-full
                        object-contain
                    "
                        />
                      </div>
                    ) : previewFile?.fileType?.includes("pdf") ? (
                      /* =================================
                                                                      PDF
                                                                  ================================== */

                      <iframe
                        src={getFileUrl(previewFile.fileUrl)}
                        title={previewFile.originalName}
                        className="
                    h-full
                    w-full
                    border-0
                    bg-white
                "
                      />
                    ) : isCodeFile(previewFile) ? (
                      /* =================================
                                                                      CODE / TEXT
                                                                  ================================== */

                      <div className="flex h-full flex-col">
                        {/* Code Header */}

                        <div
                          className="
                        flex
                        h-11
                        shrink-0
                        items-center
                        justify-between
                        border-b
                        border-white/[0.07]
                        bg-[#0d0d10]
                        px-4
                    "
                        >
                          <span
                            className="
                            max-w-[70%]
                            truncate
                            text-[11px]
                            font-medium
                            text-zinc-400
                        "
                          >
                            {previewFile.originalName}
                          </span>

                          <div className="flex items-center gap-3">
                            {!loadingContent && (
                              <span className="text-[10px] text-zinc-600">
                                {fileContent
                                  ? `${fileContent.split("\n").length} lines`
                                  : ""}
                              </span>
                            )}

                            <button
                              onClick={handleCopyFile}
                              disabled={!fileContent || loadingContent}
                              className="
            rounded-md
            border border-white/[0.08]
            bg-white/[0.03]
            px-2.5
            py-1.5
            text-[10px]
            font-medium
            text-zinc-400
            transition
            hover:bg-white/[0.07]
            hover:text-white
            disabled:cursor-not-allowed
            disabled:opacity-40
        "
                            >
                              {copied ? "Copied!" : "Copy"}
                            </button>
                          </div>
                        </div>

                        {/* Code */}

                        <div
                          className="
                        min-h-0
                        flex-1
                        overflow-auto
                    "
                        >
                          {loadingContent ? (
                            <div
                              className="
                                flex
                                h-full
                                items-center
                                justify-center
                            "
                            >
                              <span
                                className="
                                    text-xs
                                    text-zinc-600
                                "
                              >
                                Loading file...
                              </span>
                            </div>
                          ) : (
                            <SyntaxHighlighter
                              language={getLanguage(previewFile.originalName)}
                              style={vscDarkPlus}
                              showLineNumbers
                              wrapLongLines={false}
                              customStyle={{
                                margin: 0,
                                minHeight: "100%",
                                background: "#09090b",
                                padding: "16px 0",
                                fontSize: "13px",
                                lineHeight: "1.65",
                              }}
                              lineNumberStyle={{
                                minWidth: "50px",
                                paddingRight: "18px",
                                color: "#52525b",
                                userSelect: "none",
                              }}
                              codeTagProps={{
                                style: {
                                  fontFamily:
                                    "'JetBrains Mono', 'Fira Code', Consolas, monospace",
                                },
                              }}
                            >
                              {fileContent}
                            </SyntaxHighlighter>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* =================================
                                                                      UNSUPPORTED
                                                                  ================================== */

                      <div
                        className="
                    flex
                    h-full
                    flex-col
                    items-center
                    justify-center
                    px-6
                    text-center
                "
                      >
                        <h3
                          className="
                        text-sm
                        font-medium
                        text-zinc-300
                    "
                        >
                          Preview unavailable
                        </h3>

                        <p
                          className="
                        mt-2
                        max-w-sm
                        text-xs
                        leading-5
                        text-zinc-600
                    "
                        >
                          This file type cannot be previewed directly in the
                          browser.
                        </p>

                        <a
                          href={getDownloadUrl(previewFile?.fileUrl)}
                          className="
                        mt-4
                        rounded-lg
                        bg-violet-600
                        px-4
                        py-2
                        text-xs
                        font-medium
                        text-white
                        transition
                        hover:bg-violet-500
                    "
                        >
                          Download file
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </>
  );
};

export default FilesPage;
