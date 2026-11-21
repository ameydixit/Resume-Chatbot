# Folio — Interview practice

A resume-grounded interview practice app based on `w2_s7_03_resume_chatbot.ipynb`. The AI answers as the candidate, stays within the uploaded resume, and handles unknown experience honestly.

## Run locally

1. Install Node.js 20.9 or later.
2. From this folder, install dependencies and start the development server:

   ```bash
   npm install
   Copy-Item .env.example .env.local
   ```

3. Add your OpenAI API key to `.env.local`. Set `OPENAI_MODEL` to a model available to your API account if you don't want the default `gpt-4o-mini`.
4. Start the app:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

For a production build, run `npm run typecheck` and `npm run build`, then `npm start`.

## How it works

- Upload a PDF or UTF-8 text resume (up to 10 MB). PDF text extraction and input checks run in the Node.js API route.
- The browser holds the extracted resume text and conversation in memory for the current page session. The chat API sends the resume and recent messages to OpenAI to generate each answer; this app does not save resume data or chat history to a database.
- The OpenAI key is only read by the server. Configure `OPENAI_API_KEY` and optionally `OPENAI_MODEL` in `.env.local`; never add the key to a `NEXT_PUBLIC_*` variable.
- Scanned/image-only PDFs need OCR before upload. This version does not perform OCR or retain interview history after the page is refreshed.

The UI uses shadcn/ui-style components and Tailwind CSS. Components live in `components/ui` and can be extended with the shadcn CLI.
