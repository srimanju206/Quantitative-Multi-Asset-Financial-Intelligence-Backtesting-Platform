<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d1430052-42e3-4f93-9b18-eab8ea516565

## Run Locally

**Prerequisites:** Node.js 20 or newer


1. Install dependencies:
   `npm install`
2. (Optional) Set `GEMINI_API_KEY` in `.env` to enable AI advisor responses. The other API features work without it.
3. Run the development server:
   `npm run dev`
4. Open http://localhost:3000

## Production

```text
npm run build
npm start
```

The production server is available at http://localhost:3000.
