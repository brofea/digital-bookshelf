import HTMLFlipBook from "react-pageflip";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { pdfjsLib } from "../lib/pdf";

type BookReaderProps = {
  pdfUrl: string;
  title: string;
};

type RenderedPage = {
  url: string;
  width: number;
  height: number;
};

type Bookmark = {
  id: string;
  title: string;
  pageNumber: number;
  level: number;
};

type PageSize = {
  width: number;
  height: number;
};

const DEFAULT_PAGE_SIZE: PageSize = { width: 480, height: 680 };
const RENDER_BACK_WINDOW = 2;
const RENDER_FORWARD_WINDOW = 5;

export function BookReader({ pdfUrl, title }: BookReaderProps) {
  const flipBookRef = useRef<any>(null);
  const documentRef = useRef<PDFDocumentProxy | null>(null);
  const renderedUrlsRef = useRef<Map<number, string>>(new Map());
  const renderingRef = useRef<Set<number>>(new Set());
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageInput, setPageInput] = useState("1");
  const [pageSize, setPageSize] = useState<PageSize>(DEFAULT_PAGE_SIZE);
  const [pages, setPages] = useState<Map<number, RenderedPage>>(new Map());
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [isOutlineOpen, setIsOutlineOpen] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");
    setPageCount(0);
    setCurrentPage(0);
    setPageInput("1");
    setBookmarks([]);
    setPageSize(DEFAULT_PAGE_SIZE);
    setPages(new Map());

    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    loadingTask.promise
      .then(async (pdf) => {
        if (cancelled) {
          pdf.destroy();
          return;
        }
        documentRef.current = pdf;
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1 });
        const nextHeight = Math.round(DEFAULT_PAGE_SIZE.width * (viewport.height / viewport.width));
        setPageSize({
          width: DEFAULT_PAGE_SIZE.width,
          height: Math.min(Math.max(nextHeight, 620), 760)
        });
        setPageCount(pdf.numPages);
        const outline = await readBookmarks(pdf);
        if (!cancelled) setBookmarks(outline);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message || "PDF 加载失败");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
      loadingTask.destroy();
      documentRef.current?.destroy();
      documentRef.current = null;
      renderedUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      renderedUrlsRef.current.clear();
      renderingRef.current.clear();
    };
  }, [pdfUrl]);

  const visiblePageNumbers = useMemo(() => {
    if (!pageCount) return [];
    const center = currentPage + 1;
    const start = Math.max(1, center - RENDER_BACK_WINDOW);
    const end = Math.min(pageCount, center + RENDER_FORWARD_WINDOW);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [currentPage, pageCount]);

  const renderPage = useCallback(async (pageNumber: number) => {
    const pdf = documentRef.current;
    if (!pdf || renderedUrlsRef.current.has(pageNumber) || renderingRef.current.has(pageNumber)) {
      return;
    }

    renderingRef.current.add(pageNumber);
    try {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const scale = (pageSize.width * pixelRatio) / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      renderedUrlsRef.current.set(pageNumber, url);
      setPages((previous) => {
        const next = new Map(previous);
        next.set(pageNumber, { url, width: canvas.width, height: canvas.height });
        return next;
      });
    } finally {
      renderingRef.current.delete(pageNumber);
    }
  }, [pageSize.width]);

  useEffect(() => {
    visiblePageNumbers.forEach((pageNumber) => {
      void renderPage(pageNumber);
    });

    const keep = new Set(visiblePageNumbers);
    setPages((previous) => {
      const next = new Map(previous);
      previous.forEach((_page, pageNumber) => {
        if (!keep.has(pageNumber)) {
          const url = renderedUrlsRef.current.get(pageNumber);
          if (url) URL.revokeObjectURL(url);
          renderedUrlsRef.current.delete(pageNumber);
          next.delete(pageNumber);
        }
      });
      return next;
    });
  }, [renderPage, visiblePageNumbers]);

  useEffect(() => {
    setPageInput(String(currentPage + 1));
  }, [currentPage]);

  function jumpToPage(pageNumber: number) {
    if (!pageCount) return;
    const safePage = Math.min(Math.max(pageNumber, 1), pageCount);
    setCurrentPage(safePage - 1);
    setPageInput(String(safePage));
    visiblePagesAround(safePage, pageCount).forEach((page) => void renderPage(page));
    flipBookRef.current?.pageFlip()?.turnToPage(safePage - 1);
  }

  function handlePageSubmit(event: React.FormEvent) {
    event.preventDefault();
    jumpToPage(Number(pageInput));
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#151515] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.10),transparent_58%)]" />
      <aside
        className={`fixed left-0 top-0 z-40 h-full border-r border-white/10 bg-[#111]/95 shadow-2xl backdrop-blur transition-transform duration-300 ${
          isOutlineOpen ? "translate-x-0" : "-translate-x-full"
        } w-72`}
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <h2 className="text-sm font-semibold">目录</h2>
          <button className="rounded border border-white/15 px-3 py-1 text-xs text-white/75" type="button" onClick={() => setIsOutlineOpen(false)}>
            收起
          </button>
        </div>
        <div className="h-[calc(100%-4rem)] overflow-y-auto px-3 py-4">
          {bookmarks.length ? (
            bookmarks.map((bookmark) => (
              <button
                className="mb-1 block w-full rounded px-3 py-2 text-left text-sm text-white/75 transition hover:bg-white/10 hover:text-white"
                key={bookmark.id}
                style={{ paddingLeft: `${12 + bookmark.level * 14}px` }}
                type="button"
                onClick={() => jumpToPage(bookmark.pageNumber)}
              >
                <span className="line-clamp-2">{bookmark.title}</span>
                <span className="mt-1 block text-xs text-white/40">第 {bookmark.pageNumber} 页</span>
              </button>
            ))
          ) : (
            <p className="px-3 text-sm text-white/45">这本 PDF 没有可读取的目录。</p>
          )}
        </div>
      </aside>
      {!isOutlineOpen ? (
        <button className="fixed left-4 top-20 z-40 rounded bg-white/90 px-3 py-2 text-sm font-medium text-[#171717] shadow" type="button" onClick={() => setIsOutlineOpen(true)}>
          目录
        </button>
      ) : null}
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-6">
        <header className="mb-4 flex items-center justify-center px-16 text-center">
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="mt-1 text-sm text-white/60">
              {pageCount ? `${currentPage + 1} / ${pageCount}` : "正在加载"}
            </p>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center">
          {error ? (
            <div className="rounded bg-white/10 px-5 py-4 text-sm text-red-100">{error}</div>
          ) : isLoading ? (
            <div className="rounded bg-white/10 px-5 py-4 text-sm text-white/75">正在载入 PDF</div>
          ) : (
            <div className="relative w-[min(96vw,960px)] overflow-visible">
              <HTMLFlipBook
                ref={flipBookRef}
                width={pageSize.width}
                height={pageSize.height}
                size="stretch"
                minWidth={300}
                maxWidth={pageSize.width}
                minHeight={420}
                maxHeight={pageSize.height}
                drawShadow
                flippingTime={900}
                usePortrait
                startZIndex={10}
                autoSize
                maxShadowOpacity={0.35}
                showCover
                mobileScrollSupport={false}
                clickEventForward={false}
                useMouseEvents
                swipeDistance={20}
                startPage={0}
                showPageCorners={false}
                disableFlipByClick
                onFlip={(event: { data: number }) => {
                  setCurrentPage(event.data);
                  visiblePagesAround(event.data + 1, pageCount).forEach((page) => void renderPage(page));
                }}
                className="book-reader-flipbook drop-shadow-[0_28px_55px_rgba(0,0,0,0.55)]"
                style={{ margin: "0 auto", overflow: "visible" }}
              >
                {Array.from({ length: pageCount }, (_, index) => {
                  const pageNumber = index + 1;
                  const renderedPage = pages.get(pageNumber);
                  return (
                    <div className="h-full w-full bg-[#f9f6ef]" key={pageNumber}>
                      {renderedPage ? (
                        <img className="h-full w-full select-none bg-white object-contain" src={renderedPage.url} alt={`${title} 第 ${pageNumber} 页`} draggable={false} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-[#7d766c]">
                          第 {pageNumber} 页
                        </div>
                      )}
                    </div>
                  );
                })}
              </HTMLFlipBook>
              {pageCount ? (
                <form className="mx-auto mt-6 flex max-w-2xl items-center gap-4 rounded-full bg-white/10 px-4 py-3 backdrop-blur" onSubmit={handlePageSubmit}>
                  <input
                    className="h-2 flex-1 cursor-pointer accent-[#d9b46f]"
                    max={pageCount}
                    min={1}
                    type="range"
                    value={currentPage + 1}
                    onChange={(event) => jumpToPage(Number(event.target.value))}
                  />
                  <div className="flex items-center gap-2 text-sm text-white/75">
                    <input
                      className="w-16 rounded border border-white/15 bg-black/30 px-2 py-1 text-center text-white outline-none"
                      max={pageCount}
                      min={1}
                      type="number"
                      value={pageInput}
                      onChange={(event) => setPageInput(event.target.value)}
                    />
                    <span>/ {pageCount}</span>
                  </div>
                  <button className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-[#171717]" type="submit">
                    跳转
                  </button>
                </form>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function visiblePagesAround(pageNumber: number, pageCount: number) {
  const start = Math.max(1, pageNumber - RENDER_BACK_WINDOW);
  const end = Math.min(pageCount, pageNumber + RENDER_FORWARD_WINDOW);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

async function readBookmarks(pdf: PDFDocumentProxy): Promise<Bookmark[]> {
  const outline = await pdf.getOutline();
  if (!outline) return [];

  const bookmarks: Bookmark[] = [];

  async function walk(items: any[], level: number) {
    for (const item of items) {
      const pageNumber = await resolvePageNumber(pdf, item.dest);
      if (pageNumber) {
        bookmarks.push({
          id: `${bookmarks.length}-${level}-${pageNumber}`,
          title: item.title || `第 ${pageNumber} 页`,
          pageNumber,
          level
        });
      }
      if (item.items?.length) {
        await walk(item.items, level + 1);
      }
    }
  }

  await walk(outline as any[], 0);
  return bookmarks;
}

async function resolvePageNumber(pdf: PDFDocumentProxy, destination: unknown): Promise<number | null> {
  if (!destination) return null;
  const explicitDestination = typeof destination === "string" ? await pdf.getDestination(destination) : destination;
  if (!Array.isArray(explicitDestination) || !explicitDestination[0]) return null;
  try {
    const pageIndex = await pdf.getPageIndex(explicitDestination[0]);
    return pageIndex + 1;
  } catch {
    return null;
  }
}
