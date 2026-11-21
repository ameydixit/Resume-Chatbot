import { NextResponse } from "next/server";
import { MAX_RESUME_CHARS } from "@/lib/interview";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_MULTIPART_OVERHEAD = 128 * 1024;

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_FILE_BYTES + MAX_MULTIPART_OVERHEAD) {
    return NextResponse.json({ error: "Your resume must be no larger than 10 MB." }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "The upload could not be read. Please try again." }, { status: 400 });
  }
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a PDF or text resume to continue." }, { status: 400 });
  }

  if (file.size === 0 || file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "Your resume must be non-empty and no larger than 10 MB." },
      { status: 400 },
    );
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== "pdf" && extension !== "txt") {
    return NextResponse.json({ error: "Upload a PDF or plain text (.txt) file." }, { status: 415 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  let text: string;

  try {
    if (extension === "pdf") {
      pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
        path.join(process.cwd(), "node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs"),
      ).href;
      const document = await pdfjs.getDocument({
        data: new Uint8Array(buffer),
        useSystemFonts: true,
      }).promise;

      const pages: string[] = [];
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        pages.push(
          content.items
            .map((item) => ("str" in item ? item.str : ""))
            .join(" "),
        );
      }
      text = pages.join("\n");
    } else {
      text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    }
  } catch (error) {
    console.error("Resume parsing failed:", error);
    return NextResponse.json(
      { error: "We couldn't read that file. Try a text-based PDF or UTF-8 .txt file." },
      { status: 422 },
    );
  }

  const resumeText = text.replace(/\u0000/g, "").trim();
  if (!resumeText) {
    return NextResponse.json(
      { error: "No readable text was found. Scanned PDFs need OCR before uploading." },
      { status: 422 },
    );
  }

  if (resumeText.length > MAX_RESUME_CHARS) {
    return NextResponse.json(
      { error: "This resume has too much text. Please upload a file under 40,000 characters." },
      { status: 413 },
    );
  }

  return NextResponse.json({
    fileName: file.name,
    resumeText,
    characterCount: resumeText.length,
  });
}
