import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Crop,
    Loader2,
    Move,
    Save,
    X,
    ZoomIn,
} from "lucide-react";

const clamp = (value, min, max) =>
    Math.min(Math.max(value, min), max);

const ImageCropModal = ({
    file,
    open,
    onClose,
    onSave,
    saving = false,
}) => {
    const frameRef = useRef(null);
    const imageRef = useRef(null);
    const dragRef = useRef(null);

    const [naturalSize, setNaturalSize] = useState({
        width: 0,
        height: 0,
    });
    const [frameSize, setFrameSize] = useState({
        width: 0,
        height: 0,
    });
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({
        x: 0,
        y: 0,
    });
    const [dragging, setDragging] = useState(false);

    const imageUrl = useMemo(() => {
        if (!open || !file) {
            return "";
        }

        return URL.createObjectURL(file);
    }, [file, open]);

    const baseScale = useMemo(() => {
        if (
            !frameSize.width ||
            !frameSize.height ||
            !naturalSize.width ||
            !naturalSize.height
        ) {
            return 1;
        }

        return Math.max(
            frameSize.width /
                naturalSize.width,
            frameSize.height /
                naturalSize.height
        );
    }, [frameSize, naturalSize]);

    const getBoundsForZoom = useCallback(
        (zoomValue) => {
            const width =
                naturalSize.width *
                baseScale *
                zoomValue;
            const height =
                naturalSize.height *
                baseScale *
                zoomValue;

            return {
                width,
                height,
                minX: Math.min(
                    0,
                    frameSize.width - width
                ),
                maxX: 0,
                minY: Math.min(
                    0,
                    frameSize.height - height
                ),
                maxY: 0,
            };
        },
        [
            baseScale,
            frameSize.height,
            frameSize.width,
            naturalSize.height,
            naturalSize.width,
        ]
    );

    const clampPosition = useCallback(
        (
            nextPosition,
            zoomValue = zoom
        ) => {
            const bounds =
                getBoundsForZoom(zoomValue);

            return {
                x: clamp(
                    nextPosition.x,
                    bounds.minX,
                    bounds.maxX
                ),
                y: clamp(
                    nextPosition.y,
                    bounds.minY,
                    bounds.maxY
                ),
            };
        },
        [getBoundsForZoom, zoom]
    );

    useEffect(() => {
        return () => {
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
        };
    }, [imageUrl]);

    useEffect(() => {
        if (!open || !frameRef.current) {
            return;
        }

        const element = frameRef.current;

        const updateFrameSize = () => {
            const rect =
                element.getBoundingClientRect();

            setFrameSize({
                width: rect.width,
                height: rect.height,
            });

            if (naturalSize.width && naturalSize.height) {
                const bounds = getBoundsForZoom(zoom);
                setPosition(
                    clampPosition({
                        x:
                            (rect.width - bounds.width) /
                            2,
                        y:
                            (rect.height - bounds.height) /
                            2,
                    }, zoom)
                );
            }
        };

        updateFrameSize();

        const observer = new ResizeObserver(
            updateFrameSize
        );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, [baseScale, clampPosition, getBoundsForZoom, naturalSize.height, naturalSize.width, open, zoom]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        if (open) {
            window.addEventListener(
                "keydown",
                handleKeyDown
            );
        }

        return () => {
            window.removeEventListener(
                "keydown",
                handleKeyDown
            );
        };
    }, [onClose, open]);

    const handlePointerDown = (event) => {
        if (!frameSize.width || !frameSize.height) {
            return;
        }

        event.currentTarget.setPointerCapture(
            event.pointerId
        );

        dragRef.current = {
            x: event.clientX,
            y: event.clientY,
            originX: position.x,
            originY: position.y,
        };

        setDragging(true);
    };

    const handlePointerMove = (event) => {
        if (!dragging || !dragRef.current) {
            return;
        }

        const deltaX =
            event.clientX - dragRef.current.x;
        const deltaY =
            event.clientY - dragRef.current.y;

        setPosition(
            clampPosition({
                x:
                    dragRef.current.originX +
                    deltaX,
                y:
                    dragRef.current.originY +
                    deltaY,
            })
        );
    };

    const handlePointerUp = () => {
        dragRef.current = null;
        setDragging(false);
    };

    const handleImageLoad = () => {
        const image = imageRef.current;

        if (!image) return;

        const nextNaturalSize = {
            width: image.naturalWidth,
            height: image.naturalHeight,
        };

        setNaturalSize(nextNaturalSize);

        if (frameSize.width && frameSize.height) {
            const bounds = getBoundsForZoom(zoom);

            setPosition(
                clampPosition({
                    x:
                        (frameSize.width - bounds.width) /
                        2,
                    y:
                        (frameSize.height - bounds.height) /
                        2,
                }, zoom)
            );
        }
    };

    const handleSave = async () => {
        if (
            !imageRef.current ||
            !frameSize.width ||
            !frameSize.height
        ) {
            return;
        }

        const canvas =
            document.createElement("canvas");
        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.round(
            frameSize.width * dpr
        );
        canvas.height = Math.round(
            frameSize.height * dpr
        );

        const ctx =
            canvas.getContext("2d");

        if (!ctx) return;

        ctx.scale(dpr, dpr);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        const drawWidth =
            naturalSize.width *
            baseScale *
            zoom;
        const drawHeight =
            naturalSize.height *
            baseScale *
            zoom;

        ctx.drawImage(
            imageRef.current,
            position.x,
            position.y,
            drawWidth,
            drawHeight
        );

        const blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/png")
        );

        if (!blob) return;

        const safeName = file?.name
            ? file.name.replace(/\.[^.]+$/, "")
            : "profile-picture";

        const croppedFile = new File(
            [blob],
            `${safeName}-cropped.png`,
            {
                type: "image/png",
            }
        );

        onSave(croppedFile);
    };

    if (!open || !file) {
        return null;
    }

    return (
        <div
            className="
                fixed
                inset-0
                z-[120]
                flex
                items-center
                justify-center
                bg-black/75
                px-4
                py-6
                backdrop-blur-sm
            "
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-[#16121d] shadow-2xl shadow-violet-950/40">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
                    <div>
                        <p className="text-xs font-medium uppercase tracking-[0.22em] text-violet-400">
                            Crop photo
                        </p>
                        <h2 className="mt-1 text-xl font-semibold text-white">
                            Adjust your profile picture
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="grid gap-6 px-5 py-5 sm:px-6 lg:grid-cols-[1.4fr_0.8fr]">
                    <div className="space-y-4">
                        <div
                            ref={frameRef}
                            className="
                                relative
                                aspect-square
                                w-full
                                overflow-hidden
                                rounded-3xl
                                border
                                border-white/10
                                bg-black
                                select-none
                                touch-none
                            "
                            onPointerDown={
                                handlePointerDown
                            }
                            onPointerMove={
                                handlePointerMove
                            }
                            onPointerUp={handlePointerUp}
                            onPointerCancel={
                                handlePointerUp
                            }
                            onPointerLeave={handlePointerUp}
                        >
                            {imageUrl && (
                                <img
                                    ref={imageRef}
                                    src={imageUrl}
                                    alt="Crop preview"
                                    onLoad={handleImageLoad}
                                    draggable="false"
                                    className="absolute left-0 top-0 max-w-none"
                                    style={{
                                        width: `${
                                            naturalSize.width *
                                            baseScale *
                                            zoom
                                        }px`,
                                        height: `${
                                            naturalSize.height *
                                            baseScale *
                                            zoom
                                        }px`,
                                        transform: `translate(${position.x}px, ${position.y}px)`,
                                    }}
                                />
                            )}

                            <div className="pointer-events-none absolute inset-0 border border-white/5" />
                            <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-violet-400/20" />

                            <div className="pointer-events-none absolute inset-x-4 top-4 rounded-full bg-black/30 px-4 py-2 text-xs text-white/80 backdrop-blur-md sm:inset-x-auto sm:left-4">
                                <span className="inline-flex items-center gap-2">
                                    <Move size={14} />
                                    Drag to reposition
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                            <ZoomIn
                                size={17}
                                className="shrink-0 text-violet-300"
                            />

                            <input
                                type="range"
                                min="1"
                                max="3"
                                step="0.01"
                                value={zoom}
                                onChange={(event) => {
                                    const nextZoom =
                                        Number(
                                            event.target.value
                                        );

                                    setZoom(nextZoom);
                                    setPosition((prev) =>
                                        clampPosition(prev, nextZoom)
                                    );
                                }}
                                className="h-2 w-full cursor-pointer accent-violet-500"
                            />

                            <span className="w-12 text-right text-xs text-gray-400">
                                {Math.round(zoom * 100)}%
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between gap-5">
                        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600/15 text-violet-300">
                                    <Crop size={18} />
                                </div>
                                <div>
                                    <p className="font-medium text-white">
                                        Preview
                                    </p>
                                    <p className="text-sm text-gray-400">
                                        JPG, PNG, or WebP file
                                        selected.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 space-y-3 text-sm text-gray-400">
                                <p>
                                    Use the crop area to frame the image
                                    before saving.
                                </p>
                                <p>
                                    Zoom in or out to get the fit you
                                    want, then save to upload the cropped
                                    result.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={saving}
                                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-gray-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {saving ? (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Save size={16} />
                                )}
                                {saving
                                    ? "Saving..."
                                    : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageCropModal;
