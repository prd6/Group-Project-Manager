import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import API from "../services/api";
import BackButton from "../Components/BackButton";
import UserAvatar from "../Components/UserAvatar";
import CodeEditor from "../Components/CodeEditor";
import EditorToolbar from "../Components/EditorToolbar";
import Console from "../Components/Console";
import {
  MONACO_LANGUAGE_OPTIONS,
  detectMonacoLanguage,
  isCodeFileName,
  isRunnableMonacoLanguage,
} from "../utils/codeLanguages";

import {
  FaBars,
  FaChevronLeft,
  FaFileAlt,
  FaFileArchive,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFileWord,
  FaSearch,
  FaTimes,
  FaUpload,
} from "react-icons/fa";

const MAX_FILE_SIZE = 1 * 1024 * 1024;
const MAX_STORAGE = 20 * 1024 * 1024;

const FilesPage = () => {
  const { groupId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const fileInputRef = useRef(null);
  const previewObjectUrlRef = useRef("");

  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [filesError, setFilesError] = useState("");

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewError, setPreviewError] = useState("");

  const [selectedUploadFile, setSelectedUploadFile] =
    useState(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [fileContent, setFileContent] = useState("");
  const [loadingContent, setLoadingContent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState("auto");
  const [codeFontSize, setCodeFontSize] = useState(13);
  const [codeStdin, setCodeStdin] = useState("");
  const [runOutput, setRunOutput] = useState(null);
  const [runLoading, setRunLoading] = useState(false);
  const [runError, setRunError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [initialCodeContent, setInitialCodeContent] = useState("");

  // ============================================
  // CURRENT USER
  // ============================================

  const currentUser = (() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "{}"
      );
    } catch {
      return {};
    }
  })();

  // ============================================
  // PREVIEW OBJECT URL CLEANUP
  // ============================================

  const clearPreviewObjectUrl = () => {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(
        previewObjectUrlRef.current
      );

      previewObjectUrlRef.current = "";
    }

    setPreviewUrl("");
  };

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(
          previewObjectUrlRef.current
        );

        previewObjectUrlRef.current = "";
      }
    };
  }, []);

  // ============================================
  // FILE HELPERS
  // ============================================

  const isCodeFile = (file) => {
    if (!file) {
      return false;
    }

    return isCodeFileName(file.originalName);
  };

  const isCodeDirty =
    selectedFile &&
    isCodeFile(selectedFile) &&
    fileContent !== initialCodeContent;

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return "0 KB";
    }

    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }

    return `${(
      bytes /
      (1024 * 1024)
    ).toFixed(2)} MB`;
  };

  const getFileIcon = (
    fileType,
    large = false
  ) => {
    const size = large
      ? "text-3xl"
      : "text-xl";

    if (!fileType) {
      return (
        <FaFileAlt
          className={`${size} text-zinc-400`}
        />
      );
    }

    if (fileType.includes("pdf")) {
      return (
        <FaFilePdf
          className={`${size} text-red-400`}
        />
      );
    }

    if (fileType.startsWith("image/")) {
      return (
        <FaFileImage
          className={`${size} text-gray-400`}
        />
      );
    }

    if (fileType.includes("word")) {
      return (
        <FaFileWord
          className={`${size} text-gray-400`}
        />
      );
    }

    if (
      fileType.includes("excel") ||
      fileType.includes("spreadsheet")
    ) {
      return (
        <FaFileExcel
          className={`${size} text-emerald-400`}
        />
      );
    }

    if (
      fileType.includes("zip") ||
      fileType.includes("rar") ||
      fileType.includes("7z")
    ) {
      return (
        <FaFileArchive
          className={`${size} text-amber-400`}
        />
      );
    }

    return (
      <FaFileAlt
        className={`${size} text-zinc-400`}
      />
    );
  };

  // ============================================
  // FETCH FILES
  // ============================================

  const fetchFiles = async () => {
    if (!groupId) {
      setFiles([]);
      setFilesError(
        "Workspace ID is missing."
      );
      setLoadingFiles(false);
      return;
    }

    try {
      setLoadingFiles(true);
      setFilesError("");

      const { data } = await API.get(
        `/files/${groupId}`
      );

      const nextFiles = Array.isArray(data)
        ? data
        : [];

      setFiles(nextFiles);

      if (selectedFile) {
        const updatedSelectedFile =
          nextFiles.find(
            (file) =>
              file._id === selectedFile._id
          );

        if (!updatedSelectedFile) {
          clearPreviewObjectUrl();

          setSelectedFile(null);
          setPreviewFile(null);
          setPreviewError("");
          resetCodeEditorState();
        } else {
          setSelectedFile(
            updatedSelectedFile
          );

          setPreviewFile(
            updatedSelectedFile
          );
        }
      }
    } catch (error) {
      console.error(
        "Failed to load files:",
        error
      );

      setFilesError(
        error.response?.data?.message ||
        error.message ||
        "Failed to load files."
      );

      setFiles([]);
    } finally {
      setLoadingFiles(false);
    }
  };

  // ============================================
  // INITIAL FILE LOAD
  // ============================================

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        fetchFiles();
      },
      0
    );

    return () =>
      window.clearTimeout(timer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  // ============================================
  // AUTO OPEN UPLOAD PICKER
  // ============================================

  useEffect(() => {
    if (
      searchParams.get("upload") !== "true"
    ) {
      return undefined;
    }

    const timer = setTimeout(() => {
      fileInputRef.current?.click();

      const nextParams =
        new URLSearchParams(searchParams);

      nextParams.delete("upload");

      setSearchParams(nextParams, {
        replace: true,
      });
    }, 100);

    return () =>
      clearTimeout(timer);
  }, [searchParams, setSearchParams]);

  // ============================================
  // SELECT UPLOAD FILE
  // ============================================

  const handleFileSelect = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadSuccess("");
    setUploadError("");

    if (file.size > MAX_FILE_SIZE) {
      setUploadError(
        "File is too large. Maximum file size is 1 MB."
      );

      setSelectedUploadFile(null);
      event.target.value = "";

      return;
    }

    setSelectedUploadFile(file);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // ============================================
  // UPLOAD FILE
  // ============================================

  const handleUpload = async () => {
    if (!groupId) {
      setUploadError(
        "Workspace ID is missing."
      );

      return;
    }

    if (!selectedUploadFile) {
      setUploadError(
        "Please select a file to upload."
      );

      return;
    }

    if (
      selectedUploadFile.size >
      MAX_FILE_SIZE
    ) {
      setUploadError(
        "File is too large. Maximum file size is 1 MB."
      );

      return;
    }

    try {
      setUploading(true);
      setUploadError("");
      setUploadSuccess("");

      const formData = new FormData();

      /*
       * IMPORTANT:
       * Backend upload middleware must use:
       *
       * upload.single("file")
       *
       * because the multipart field name
       * sent here is "file".
       */
      formData.append(
        "file",
        selectedUploadFile
      );

      const response = await API.post(
        `/files/upload/${groupId}`,
        formData,
        {
          /*
           * auth.js normally uses application/json.
           * This request contains FormData, so this
           * request must be multipart.
           */
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      console.log(
        "Upload successful:",
        response.data
      );

      setUploadSuccess(
        response.data?.message ||
        "File uploaded successfully."
      );

      setSelectedUploadFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await fetchFiles();
    } catch (error) {
      /*
       * Print the actual backend response.
       * If the server rejects the file, this
       * tells us exactly why.
       */
      console.error(
        "UPLOAD ERROR:",
        error.response?.data ||
        error
      );

      const backendMessage =
        error.response?.data?.message ||
        error.response?.data?.error;

      setUploadError(
        backendMessage ||
        error.message ||
        "Failed to upload file."
      );
    } finally {
      setUploading(false);
    }
  };

  // ============================================
  // DELETE FILE
  // ============================================

  const handleDelete = async () => {
    if (!selectedFile) {
      return;
    }

    const confirmDelete =
      window.confirm(
        `Are you sure you want to delete "${selectedFile.originalName}"?`
      );

    if (!confirmDelete) {
      return;
    }

    try {
      await API.delete(
        `/files/${selectedFile._id}`
      );

      clearPreviewObjectUrl();

      const deletedFileId =
        selectedFile._id;

      setSelectedFile(null);
      setPreviewFile(null);
      setPreviewError("");
      resetCodeEditorState();

      setFiles((currentFiles) =>
        currentFiles.filter(
          (file) =>
            file._id !== deletedFileId
        )
      );
    } catch (error) {
      console.error(
        "Failed to delete file:",
        error.response?.data || error
      );

      window.alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to delete file."
      );
    }
  };

  // ============================================
  // LOAD IMAGE / PDF
  // ============================================

  const loadBinaryPreview = async (
    file
  ) => {
    if (!file?.fileUrl) {
      throw new Error(
        "File URL is missing."
      );
    }

    try {
      const response = await API.get(
        `/files/view/${file.fileUrl}`,
        {
          responseType: "blob",
        }
      );

      const objectUrl =
        URL.createObjectURL(
          response.data
        );

      clearPreviewObjectUrl();

      previewObjectUrlRef.current =
        objectUrl;

      setPreviewUrl(objectUrl);
    } catch (error) {
      console.error(
        "Failed to load binary preview:",
        error.response?.data || error
      );

      throw new Error(
        error.response?.data?.message ||
        "Failed to load preview.",
        {
          cause: error,
        }
      );
    }
  };

  const resetCodeEditorState = () => {
    setFileContent("");
    setInitialCodeContent("");
    setCodeLanguage("auto");
    setCodeStdin("");
    setRunOutput(null);
    setRunError("");
    setRunLoading(false);
    setSaveLoading(false);
    setSaveMessage("");
    setCopied(false);
  };

  const loadCodePreview = async (file) => {
    if (!file?.fileUrl) {
      throw new Error("File URL is missing.");
    }

    const response = await API.get(
      `/files/view/${file.fileUrl}`,
      {
        responseType: "text",

        /*
         * Without this Axios may try to
         * automatically parse JSON files.
         */
        transformResponse: [(data) => data],
      }
    );

    const content =
      typeof response.data === "string"
        ? response.data
        : JSON.stringify(
            response.data,
            null,
            2
          );

    setFileContent(content);
    setInitialCodeContent(content);
    setCodeLanguage(
      detectMonacoLanguage(
        file.originalName,
        content
      )
    );
    setCodeStdin("");
    setRunOutput(null);
    setRunError("");
    setSaveMessage("");
  };

  // ============================================
  // SELECT / PREVIEW FILE
  // ============================================

  const handleSelectFile = async (
    file
  ) => {
    if (!file) {
      return;
    }

    setSelectedFile(file);
    setPreviewFile(file);

    setPreviewError("");
    resetCodeEditorState();
    setLoadingContent(false);

    clearPreviewObjectUrl();

    try {
      // ----------------------------------------
      // IMAGE / PDF
      // ----------------------------------------

      if (
        file.fileType?.startsWith(
          "image/"
        ) ||
        file.fileType?.includes("pdf")
      ) {
        setLoadingContent(true);

        await loadBinaryPreview(file);

        return;
      }

      // ----------------------------------------
      // NON-PREVIEWABLE FILE
      // ----------------------------------------

      if (!isCodeFile(file)) {
        return;
      }

      // ----------------------------------------
      // CODE / TEXT PREVIEW
      // ----------------------------------------

      setLoadingContent(true);

      await loadCodePreview(file);
    } catch (error) {
      console.error(
        "Failed to load file preview:",
        error.response?.data || error
      );

      setPreviewError(
        error.response?.data?.message ||
        error.message ||
        "Unable to load this file."
      );
    } finally {
      setLoadingContent(false);
    }
  };

  // ============================================
  // DOWNLOAD FILE
  // ============================================

  const handleDownload = async (
    file = selectedFile
  ) => {
    if (!file?.fileUrl) {
      return;
    }

    try {
      const response = await API.get(
        `/files/download/${file.fileUrl}`,
        {
          responseType: "blob",
        }
      );

      const objectUrl =
        URL.createObjectURL(
          response.data
        );

      const link =
        document.createElement("a");

      link.href = objectUrl;

      link.download =
        file.originalName ||
        "download";

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(
        objectUrl
      );
    } catch (error) {
      console.error(
        "Failed to download file:",
        error.response?.data || error
      );

      window.alert(
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to download file."
      );
    }
  };

  // ============================================
  // COPY CODE FILE
  // ============================================

  const handleCopyFile = async () => {
    if (!fileContent) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        fileContent
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (error) {
      console.error(
        "Failed to copy file:",
        error
      );
    }
  };

  const handleSaveCode = async () => {
    if (!selectedFile || !isCodeFile(selectedFile)) {
      return;
    }

    try {
      setSaveLoading(true);
      setRunError("");
      setSaveMessage("");

      const response = await API.patch(
        `/files/${selectedFile._id}`,
        {
          content: fileContent,
        }
      );

      const updatedFile = {
        ...selectedFile,
        ...(response.data?.file || {}),
        currentUserRole:
          selectedFile.currentUserRole,
      };

      setSelectedFile(updatedFile);
      setPreviewFile(updatedFile);
      setInitialCodeContent(fileContent);
      setSaveMessage(
        response.data?.message ||
          "File saved successfully."
      );

      setFiles((currentFiles) =>
        currentFiles.map((file) =>
          file._id === updatedFile._id
            ? {
                ...file,
                ...updatedFile,
                currentUserRole:
                  file.currentUserRole,
              }
            : file
        )
      );

      window.setTimeout(() => {
        setSaveMessage("");
      }, 2500);
    } catch (error) {
      console.error(
        "Failed to save file:",
        error.response?.data || error
      );

      setRunError(
        error.response?.data?.message ||
          error.message ||
          "Failed to save file."
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const handleRunCode = async () => {
    if (!selectedFile || !isCodeFile(selectedFile)) {
      return;
    }

    const resolvedLanguage =
      codeLanguage === "auto"
        ? detectMonacoLanguage(
            selectedFile.originalName,
            fileContent
          )
        : codeLanguage;

    if (
      !isRunnableMonacoLanguage(resolvedLanguage)
    ) {
      setRunError(
        "This language is not supported by Judge0 execution."
      );
      setRunOutput(null);
      return;
    }

    try {
      setRunLoading(true);
      setRunError("");
      setRunOutput(null);
      setSaveMessage("");

      const response = await API.post("/code/run", {
        sourceCode: fileContent,
        stdin: codeStdin,
        language: resolvedLanguage,
        fileName: selectedFile.originalName,
      });

      setRunOutput(response.data);
    } catch (error) {
      console.error(
        "Failed to run code:",
        error.response?.data || error
      );

      setRunError(
        error.response?.data?.message ||
          error.message ||
          "Failed to execute code."
      );
    } finally {
      setRunLoading(false);
    }
  };

  const handleEditorChange = (value) => {
    setFileContent(value);
    setRunError("");
    setSaveMessage("");
  };

  // ============================================
  // FILTER + STORAGE
  // ============================================

  const filteredFiles = files.filter(
    (file) =>
      file.originalName
        ?.toLowerCase()
        .includes(
          searchTerm.toLowerCase()
        )
  );

  const totalStorage = files.reduce(
    (total, file) =>
      total + (file.fileSize || 0),
    0
  );

  const storagePercentage = Math.min(
    (totalStorage / MAX_STORAGE) * 100,
    100
  );

  const canDelete =
    selectedFile &&
    (selectedFile.currentUserRole ===
      "Owner" ||
      selectedFile.uploadedBy?._id ===
      currentUser?._id);

  const activeEditorLanguage =
    selectedFile && isCodeFile(selectedFile)
      ? codeLanguage === "auto"
        ? detectMonacoLanguage(
            selectedFile.originalName,
            fileContent
          )
        : codeLanguage
      : "plaintext";

  const canRunCode =
    isCodeFile(selectedFile) &&
    !loadingContent &&
    isRunnableMonacoLanguage(
      activeEditorLanguage
    );

  return (
    <div className="h-[calc(100vh-64px)] bg-[#08080a] text-white flex flex-col overflow-hidden">
      <div className="shrink-0 border-b border-white/[0.07] bg-[#08080d]/80 ">
        <div className="flex min-h-[72px] items-center gap-5 px-5 md:px-7">

          {/* Back */}
          <BackButton
            to={`/workspace/${groupId}`}
            label="Workspace"
          />

          {/* Title */}
          <h1 className="shrink-0 text-xl font-semibold tracking-tight text-zinc-100">
            Project Files
          </h1>

          {/* Divider */}
          <div className="hidden h-7 w-px bg-white/[0.08] sm:block" />

          {/* File Count */}
          <div className="hidden shrink-0 sm:block">
            <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-600">
              Files
            </p>

            <p className="mt-0.5 text-xs font-medium text-zinc-300">
              {files.length}
            </p>
          </div>

          {/* Divider */}
          <div className="hidden h-7 w-px bg-white/[0.08] sm:block" />

          {/* Storage */}
          <div className="hidden w-[190px] shrink-0 md:block">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-medium uppercase tracking-[0.12em] text-zinc-600">
                Storage
              </p>

              <p className="text-[10px] font-medium text-zinc-400">
                {formatFileSize(totalStorage)} /{" "}
                {MAX_STORAGE / 1024 / 1024} MB
              </p>
            </div>

            <div className="mt-2 h-[4px] w-full overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="h-full rounded-full bg-gray-500 transition-all duration-500"
                style={{
                  width: `${storagePercentage}%`,
                }}
              />
            </div>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Selected File */}
          {selectedUploadFile && (
            <div className="hidden max-w-[180px] min-w-0 lg:block">
              <p
                title={selectedUploadFile.name}
                className="truncate text-xs text-zinc-400"
              >
                {selectedUploadFile.name}
              </p>

              <p className="mt-0.5 text-[10px] text-zinc-600">
                {formatFileSize(selectedUploadFile.size)}
              </p>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Choose File */}
          <button
            type="button"
            onClick={openFilePicker}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.035] px-4 py-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
          >
            <FaUpload className="text-xs" />
            <span className="hidden sm:inline">Choose File</span>
            <span className="sm:hidden">Choose</span>
          </button>

          {/* Upload */}
          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || !selectedUploadFile}
            className="inline-flex shrink-0 items-center rounded-lg bg-gray-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>

        {/* Messages only appear when needed */}
        {(uploadError || uploadSuccess || filesError) && (
          <div className="px-5 pb-3 md:px-7">
            {uploadError && (
              <p className="text-xs text-red-400">{uploadError}</p>
            )}

            {!uploadError && uploadSuccess && (
              <p className="text-xs text-emerald-400">{uploadSuccess}</p>
            )}

            {!uploadError && !uploadSuccess && filesError && (
              <p className="text-xs text-red-400">{filesError}</p>
            )}
          </div>
        )}
      </div>

      <div className="relative flex flex-1 min-h-0">
        <aside
          className={`
            shrink-0 overflow-hidden border-r border-white/[0.07] bg-[#0b0b0e]
            transition-[width] duration-300 ease-in-out
            ${sidebarOpen ? "w-[340px]" : "w-0 border-r-0"}
          `}
        >
          <div className="flex h-full w-[340px] flex-col">
            <div className="shrink-0 border-b border-white/[0.06] px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold">Files</h2>
                  <p className="mt-0.5 text-[11px] text-zinc-600">
                    {filteredFiles.length} items
                  </p>
                </div>

                <button
                  onClick={() => setSidebarOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.05] hover:text-white"
                  title="Close sidebar"
                >
                  <FaChevronLeft className="text-xs" />
                </button>
              </div>

              <div className="relative mt-4">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-zinc-600" />

                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search files..."
                  className="w-full rounded-lg border border-white/[0.07] bg-white/[0.025] py-2.5 pl-9 pr-8 text-xs text-zinc-200 outline-none transition placeholder:text-zinc-600 focus:border-gray-500/40 focus:ring-1 focus:ring-gray-500/20"
                />

                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {loadingFiles ? (
                <div className="flex h-40 items-center justify-center text-xs text-zinc-600">
                  Loading files...
                </div>
              ) : filesError ? (
                <div className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-4 text-xs text-red-300">
                  {filesError}
                </div>
              ) : filteredFiles.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-xs text-zinc-600">
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
                          w-full rounded-lg border px-3 py-3 text-left transition
                          ${active
                            ? "border-gray-500/30 bg-gray-500/[0.08]"
                            : "border-transparent hover:border-white/[0.06] hover:bg-white/[0.03]"
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">
                            {getFileIcon(file.fileType)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p
                              title={file.originalName}
                              className={`
                                truncate text-[13px] font-medium
                                ${active ? "text-white" : "text-zinc-300"}
                              `}
                            >
                              {file.originalName}
                            </p>

                            <p className="mt-1 text-[10px] text-zinc-600">
                              {formatFileSize(file.fileSize)}
                            </p>

                            <div className="mt-3 flex items-center gap-2">
                              <UserAvatar user={file.uploadedBy} size="sm" />

                              <div className="min-w-0">
                                <p className="text-[9px] text-zinc-600">
                                  Uploaded by
                                </p>

                                <p className="truncate text-[11px] text-zinc-400">
                                  {file.uploadedBy?.name || "Unknown User"}
                                </p>
                              </div>
                            </div>
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

        <main className="relative flex min-w-0 flex-1 flex-col bg-[#08080a]">
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="absolute left-4 top-4 z-30 flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.08] bg-[#111114] text-zinc-400 shadow-lg transition hover:bg-[#18181c] hover:text-white"
              title="Open files"
            >
              <FaBars className="text-xs" />
            </button>
          )}

          {!selectedFile ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025]">
                  <FaFileAlt className="text-zinc-500" />
                </div>

                <h2 className="mt-4 text-sm font-medium text-zinc-300">
                  Select a file
                </h2>

                <p className="mt-1 text-xs text-zinc-600">
                  Choose a file from the sidebar to preview it.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="shrink-0 border-b border-white/[0.07] bg-[#0b0b0e] px-5 py-4">
                <div
                  className={`
                    flex items-center justify-between gap-6
                    ${!sidebarOpen ? "pl-12" : ""}
                  `}
                >
                  <div className="min-w-0">
                    <h2
                      title={selectedFile.originalName}
                      className="truncate text-[14px] font-semibold text-zinc-100 md:max-w-[650px]"
                    >
                      {selectedFile.originalName}
                    </h2>

                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-zinc-600">
                      <span>{formatFileSize(selectedFile.fileSize)}</span>
                      <span className="text-zinc-700">•</span>
                      <span>{selectedFile.fileType}</span>
                      <span className="mx-1 text-zinc-800">|</span>

                      <UserAvatar user={selectedFile.uploadedBy} size="sm" />

                      <span>Uploaded by</span>

                      <span className="font-medium text-zinc-300">
                        {selectedFile.uploadedBy?.name || "Unknown User"}
                      </span>

                      <span className="text-zinc-700">•</span>

                      <span>
                        {new Date(selectedFile.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownload(selectedFile)}
                      className="rounded-lg border border-white/[0.08] bg-white/[0.035] px-3.5 py-2 text-[11px] font-medium text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
                    >
                      Download
                    </button>

                    {canDelete && (
                      <button
                        onClick={handleDelete}
                        className="rounded-lg border border-red-500/20 bg-red-500/[0.05] px-3.5 py-2 text-[11px] font-medium text-red-400 transition hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-hidden bg-[#050507] p-3">
                <div className="h-full overflow-hidden rounded-lg border border-white/[0.06] bg-[#09090b]">
                  {previewError ? (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/[0.08] text-red-300">
                        {getFileIcon(previewFile?.fileType, true)}
                      </div>

                      <h3 className="mt-5 text-sm font-medium text-zinc-200">
                        Preview unavailable
                      </h3>

                      <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-500">
                        {previewError}
                      </p>

                      <button
                        type="button"
                        onClick={() => handleDownload(previewFile)}
                        className="mt-4 rounded-lg bg-gray-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-gray-500"
                      >
                        Download file
                      </button>
                    </div>
                  ) : previewFile?.fileType?.startsWith("image/") ? (
                    loadingContent ? (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-xs text-zinc-600">
                          Loading file...
                        </span>
                      </div>
                    ) : (
                      <div className="flex h-full items-center justify-center overflow-auto p-5">
                        <img
                          src={previewUrl}
                          alt={previewFile.originalName}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    )
                  ) : previewFile?.fileType?.includes("pdf") ? (
                    loadingContent ? (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-xs text-zinc-600">
                          Loading file...
                        </span>
                      </div>
                    ) : (
                      <iframe
                        src={previewUrl}
                        title={previewFile.originalName}
                        className="h-full w-full border-0 bg-white"
                      />
                    )
                  ) : isCodeFile(previewFile) ? (
                    <div className="flex h-full min-h-0 flex-col overflow-hidden">
                      <EditorToolbar
                        fileName={previewFile.originalName}
                        language={codeLanguage}
                        languageOptions={MONACO_LANGUAGE_OPTIONS}
                        onLanguageChange={setCodeLanguage}
                        fontSize={codeFontSize}
                        onFontSizeChange={setCodeFontSize}
                        onRun={handleRunCode}
                        onSave={handleSaveCode}
                        onCopy={handleCopyFile}
                        isRunning={runLoading}
                        isSaving={saveLoading}
                        copied={copied}
                        isDirty={isCodeDirty}
                        canRun={canRunCode}
                      />

                      <div className="min-h-0 flex-1 overflow-hidden p-3">
                        <div className="flex h-full min-h-0 flex-col gap-3">
                          {saveMessage && (
                            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-2 text-[11px] text-emerald-300">
                              {saveMessage}
                            </div>
                          )}

                          <div className="min-h-[320px] flex-[3]">
                            <CodeEditor
                              value={fileContent}
                              onChange={handleEditorChange}
                              language={activeEditorLanguage}
                              fileName={previewFile.originalName}
                              editorKey={codeLanguage}
                              fontSize={codeFontSize}
                              loading={loadingContent}
                            />
                          </div>

                          <div className="min-h-[260px] flex-[2]">
                            <Console
                              stdin={codeStdin}
                              onStdinChange={setCodeStdin}
                              output={runOutput}
                              isRunning={runLoading}
                              error={runError}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025]">
                        {getFileIcon(previewFile?.fileType, true)}
                      </div>

                      <h3 className="mt-5 text-sm font-medium text-zinc-300">
                        Preview unavailable
                      </h3>

                      <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-600">
                        This file type cannot be previewed directly in the browser.
                      </p>

                      <button
                        type="button"
                        onClick={() => handleDownload(previewFile)}
                        className="mt-4 rounded-lg bg-gray-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-gray-500"
                      >
                        Download file
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default FilesPage;
