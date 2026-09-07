# MediaForge V2 — Termux

## 1. Install dependencies
```bash
pkg update
pkg install python ffmpeg
python -m pip install --upgrade pip
pip install flask yt-dlp
```

## 2. Run
```bash
cd MediaForge-V2
python app.py
```
Open: http://127.0.0.1:8080

## 3. Update yt-dlp
Platform sites change often. Update periodically:
```bash
pip install -U yt-dlp
```

## Features
- Mobile-first professional UI
- URL metadata preview
- Video / MP3 modes
- Quality selector
- Download history
- PWA manifest
- Automatic temporary-file cleanup
- Clear error messages

Use only content you own or are authorized to download. DRM/login/access controls are not bypassed.

### Hak Cipta
© 2026 Hestia SR. Facebook: https://www.facebook.com/Hestiaa.sr


### ConvertSosmed V4
Premium mobile UI, platform chips, feature cards, enhanced media preview, and subtle interaction animations.


## ConvertSosmed V5 Ultimate
- Premium responsive interface
- Metadata preview card
- Background download jobs with progress polling
- Video / MP3 modes and quality selector
- Recent download history
- Indonesian / English UI
- PWA install support
- Responsible-use notice; no DRM/login/access-control bypass


### YouTube compatibility
The hosted build installs the current yt-dlp default dependencies and Deno for YouTube JavaScript challenges. If a YouTube datacenter request is rejected by a bot-check page, the downloader automatically retries with a supported alternate YouTube client configuration. Personal Google/YouTube cookies are not stored on the public server.


## Back4app platform compatibility
- YouTube: current yt-dlp + EJS/Deno support, with a supported client fallback for some datacenter restrictions.
- X: tries the default GraphQL extractor first, then the public syndication and legacy extractor APIs. Some X posts still require account access or may be unavailable to yt-dlp.
- The app does not store or ship personal Google/X cookies.


## V3 YouTube extractor
See `README-V3.md` for the YouTube/EJS changes and limitations.


## V4 YouTube PO Token update

V4 adds `bgutil-ytdlp-pot-provider` in script mode to improve YouTube bot-check/PO-token handling without requiring a second Back4app container. See `README-V4.md`. This still cannot guarantee that YouTube accepts every public datacenter IP.
