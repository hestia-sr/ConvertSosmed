# ConvertSosmed V3 — YouTube EJS refresh

V3 keeps the existing ConvertSosmed backend/UI and improves YouTube extraction:

- Explicit Deno JavaScript runtime for yt-dlp.
- Explicit `yt-dlp[default]` dependency, including `yt-dlp-ejs`.
- Enables the official EJS remote component refresh (`ejs:github`).
- Tries the normal YouTube extractor first, then `web_embedded,default`, then the `android_vr,tv` compatibility clients.
- Keeps the X/Twitter syndication + legacy fallbacks.
- No personal YouTube cookies or account credentials are stored on the server.

Important: YouTube can still reject a public datacenter IP with a bot check or require a PO Token. V3 improves the extractor/EJS setup but cannot guarantee access to every YouTube video.
