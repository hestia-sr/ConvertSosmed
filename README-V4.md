# ConvertSosmed V4 — YouTube EJS + PO Token provider

V4 keeps the working ConvertSosmed UI/backend from V3 and adds a free, self-contained YouTube PO Token setup for hosted deployments.

### What changed

- Keeps yt-dlp 2026.08.19+ and `yt-dlp-ejs`.
- Keeps explicit Deno + `ejs:github` for YouTube JavaScript challenge solving.
- Adds `bgutil-ytdlp-pot-provider==1.3.1`.
- Builds the provider during the Docker image build and uses its **script mode**, so Back4app does not need a second always-on container.
- yt-dlp is pointed at `/opt/bgutil-ytdlp-pot-provider/server` for automatic PO-token generation.
- Keeps the V3 YouTube client fallbacks and X/Twitter fallbacks.
- Does **not** use personal YouTube cookies, browser sessions, or account credentials.

### Important limitation

The PO Token provider can help with YouTube bot checks and PO-token enforcement, but it does **not** guarantee that a public cloud/datacenter IP will be accepted by YouTube. YouTube may still reject particular videos, IPs, or clients.

### Why script mode

The provider documentation offers an HTTP-server mode and a script mode. Script mode avoids running a second permanent service, which is a better fit for a single free Back4app container. It is slower than a persistent provider under high concurrency, but ConvertSosmed is designed for one/few downloads at a time.

### No cookies

Do not add personal YouTube cookies to this public server. If YouTube still blocks the Back4app IP after V4, that is an infrastructure/IP restriction rather than something we should solve by exposing a private account session.
