from flask import Flask, render_template, request, jsonify, send_from_directory
from pathlib import Path
import subprocess, threading, time, uuid, json, re, os

APP=Flask(__name__)
BASE=Path(__file__).resolve().parent
DOWNLOADS=BASE/"downloads"; DOWNLOADS.mkdir(exist_ok=True)
JOBS={}
JOBS_LOCK=threading.Lock()
HISTORY=BASE/"history.json"

PLATFORMS=("youtube.com","youtu.be","instagram.com","facebook.com","fb.watch","x.com","twitter.com")
YOUTUBE_HOSTS=("youtube.com","youtu.be")

def is_youtube(url):
    u=(url or "").lower()
    return any(h in u for h in YOUTUBE_HOSTS)

def yt_args(url, fallback=False):
    if is_youtube(url):
        # Keep EJS challenge solving explicit. The PyPI default extras include
        # yt-dlp-ejs, while this flag lets yt-dlp refresh the EJS scripts from
        # the official GitHub distribution when needed.
        common=[
            "--js-runtimes", "deno",
            "--remote-components", "ejs:github",
            "--extractor-args", "youtubepot-bgutilscript:server_home=/opt/bgutil-ytdlp-pot-provider/server",
        ]
        if fallback == "embedded":
            return common + ["--extractor-args", "youtube:player_client=web_embedded,default"]
        if fallback == "legacy":
            # Compatibility fallback for YouTube datacenter/bot-check failures.
            return common + ["--extractor-args", "youtube:player_client=android_vr,tv;player_skip=webpage"]
        return common
    if is_x(url):
        # X sometimes serves a different response through its legacy/syndication
        # endpoints. Try those public extractor APIs before reporting failure.
        if fallback:
            return ["--extractor-args", "twitter:api=syndication"]
    return []

def is_x(url):
    u=(url or "").lower()
    return "x.com" in u or "twitter.com" in u

def extra_attempts(url, base):
    attempts=[base+yt_args(url,False)]
    if is_youtube(url):
        # Try an embeddable public client before the older compatibility clients.
        attempts.append(base+yt_args(url,"embedded"))
        attempts.append(base+yt_args(url,"legacy"))
    elif is_x(url):
        attempts.append(base+["--extractor-args", "twitter:api=syndication"])
        attempts.append(base+["--extractor-args", "twitter:api=legacy"])
    return attempts

def run_ytdlp_info(url):
    base=["yt-dlp","--no-playlist","--dump-single-json","--skip-download"]
    attempts=extra_attempts(url, base)
    last=None
    for cmd in attempts:
        p=subprocess.run(cmd+[url],capture_output=True,text=True,timeout=45)
        if p.returncode==0:
            return json.loads(p.stdout)
        last=(p.stderr or "Tidak dapat membaca URL.").splitlines()[-1]
    raise RuntimeError(last or "Tidak dapat membaca URL.")

def load_history():
    try: return json.loads(HISTORY.read_text(encoding="utf-8"))
    except Exception: return []

def save_history(items):
    HISTORY.write_text(json.dumps(items[:30],ensure_ascii=False,indent=2),encoding="utf-8")

def cleanup_loop():
    while True:
        now=time.time()
        for p in DOWNLOADS.iterdir():
            try:
                if p.is_file() and now-p.stat().st_mtime>3600: p.unlink()
            except OSError: pass
        time.sleep(600)

threading.Thread(target=cleanup_loop,daemon=True).start()

@APP.get("/")
def home(): return render_template("index.html")

@APP.get("/api/health")
def health(): return jsonify(ok=True)

@APP.post("/api/info")
def info():
    data=request.get_json(silent=True) or {}; url=(data.get("url") or "").strip()
    if not url.startswith(("http://","https://")): return jsonify(error="URL tidak valid."),400
    if not any(h in url.lower() for h in PLATFORMS): return jsonify(error="Platform belum didukung."),400
    try:
        x=run_ytdlp_info(url)
        return jsonify(ok=True,title=x.get("title","Untitled"),thumbnail=x.get("thumbnail",""),
                       duration=x.get("duration"),uploader=x.get("uploader",""))
    except Exception as e: return jsonify(error=str(e)[:240]),500

def _set_job(job, **values):
    with JOBS_LOCK:
        if job in JOBS:
            JOBS[job].update(values)

def _run_download(job, url, mode, quality, title):
    out=DOWNLOADS/f"{job}.%(ext)s"
    if mode=="mp3":
        base=["yt-dlp","--no-playlist","-x","--audio-format","mp3","--audio-quality","192K","-o",str(out)]
    else:
        fmt="bestvideo*+bestaudio/best" if quality=="best" else f"best[height<={quality}]/best"
        base=["yt-dlp","--no-playlist","-f",fmt,"--merge-output-format","mp4","-o",str(out)]
    commands=[cmd+[url] for cmd in extra_attempts(url, base)]
    _set_job(job,status="running",progress=5,message="Mengunduh media…")
    try:
        last=""
        for attempt,cmd in enumerate(commands):
            if attempt:
                # Remove partial output from the first YouTube attempt before retrying.
                for partial in DOWNLOADS.glob(f"{job}.*"):
                    try: partial.unlink()
                    except OSError: pass
                _set_job(job,progress=5,message=("Mencoba metode alternatif YouTube…" if is_youtube(url) else "Mencoba metode alternatif X…"))
            p=subprocess.Popen(cmd,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,bufsize=1)
            last=""
            for line in p.stdout:
                last=line.strip()
                m=re.search(r'(\d+(?:\.\d+)?)%', line)
                if m:
                    pct=max(5,min(96,float(m.group(1))))
                    _set_job(job,progress=round(pct,1),message="Mengunduh media…")
            code=p.wait()
            if code==0:
                break
        if code!=0:
            raise RuntimeError((last or "Download gagal.").splitlines()[-1][:300])
        results=[p for p in DOWNLOADS.glob(f"{job}.*") if p.is_file()]
        if not results:
            raise RuntimeError("File hasil tidak ditemukan.")
        f=results[0]

        # Rename the temporary job filename to the original media title.
        # Keep the job id only when needed to avoid overwriting an existing file.
        display_title=(title or f.stem).strip() or "ConvertSosmed"
        safe_title=re.sub(r'[\\/:*?"<>|\x00-\x1f]', "_", display_title)
        safe_title=re.sub(r'\s+', " ", safe_title).strip(" .") or "ConvertSosmed"
        safe_title=safe_title[:150]
        target=DOWNLOADS/f"{safe_title}{f.suffix}"
        if target.exists() and target.resolve()!=f.resolve():
            target=DOWNLOADS/f"{safe_title} ({job[:6]}){f.suffix}"
        try:
            f.replace(target)
            f=target
        except OSError:
            pass

        hist=load_history()
        hist.insert(0,{"title":display_title,"filename":f.name,"mode":mode,
                       "url":f"/files/{f.name}","time":int(time.time())})
        save_history(hist)
        _set_job(job,status="done",progress=100,message="Selesai — file siap diunduh.",
                 title=display_title,filename=f.name,url=f"/files/{f.name}")
    except FileNotFoundError:
        _set_job(job,status="error",progress=0,message="yt-dlp belum terpasang. Jalankan: pip install -U yt-dlp")
    except Exception as e:
        msg=str(e)[:300]
        low=msg.lower()
        if is_x(url) and ("no video could be found" in low or "error(s) while querying api" in low):
            msg="Video X tidak dapat diakses oleh server. Coba posting publik lain yang benar-benar berisi video; beberapa tweet memerlukan akses akun atau sedang bermasalah di extractor X."
        _set_job(job,status="error",progress=0,message=msg)

@APP.post("/api/download")
def download():
    data=request.get_json(silent=True) or {}
    url=(data.get("url") or "").strip()
    mode=data.get("mode","video")
    quality=str(data.get("quality","best"))
    if not url.startswith(("http://","https://")):
        return jsonify(error="URL tidak valid."),400
    if not any(h in url.lower() for h in PLATFORMS):
        return jsonify(error="Platform belum didukung."),400
    job=uuid.uuid4().hex[:12]
    with JOBS_LOCK:
        JOBS[job]={"status":"queued","progress":0,"message":"Menyiapkan download…"}
    threading.Thread(target=_run_download,args=(job,url,mode,quality,data.get("title","")),daemon=True).start()
    return jsonify(ok=True,job=job)

@APP.get("/api/job/<job>")
def job_status(job):
    with JOBS_LOCK:
        data=JOBS.get(job)
    if not data:
        return jsonify(error="Job tidak ditemukan."),404
    return jsonify(ok=True,**data)

@APP.get("/api/history")
def history(): return jsonify(items=load_history())

@APP.post("/api/clear-history")
def clear_history():
    save_history([]); return jsonify(ok=True)

@APP.get("/files/<path:name>")
def file(name): return send_from_directory(DOWNLOADS,name,as_attachment=True)

@APP.errorhandler(404)
def not_found(e):
    if request.path.startswith("/api/"):
        return jsonify(ok=False,error="API endpoint tidak ditemukan."),404
    return e

@APP.errorhandler(405)
def method_not_allowed(e):
    if request.path.startswith("/api/"):
        return jsonify(ok=False,error="Metode request tidak didukung untuk endpoint ini."),405
    return e

@APP.errorhandler(500)
def internal_error(e):
    if request.path.startswith("/api/"):
        return jsonify(ok=False,error="Terjadi kesalahan internal pada server."),500
    return e

if __name__=="__main__":
    APP.run(host="0.0.0.0",port=int(os.environ.get("PORT","8080")),debug=False)
