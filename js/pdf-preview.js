/* Renders page 1 of a PDF drawing to an image URL, so plotted AutoCAD sheets
   can be used as card and modal images. Loaded only when a project uses a PDF. */
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;

export async function renderPdfPreview(url, width = 1600) {
  const task = getDocument({ url });
  try {
    const pdf = await task.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: width / page.getViewport({ scale: 1 }).width });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    await page.render({ canvas, viewport }).promise;
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.9));
    return URL.createObjectURL(blob);
  } finally {
    task.destroy();
  }
}
