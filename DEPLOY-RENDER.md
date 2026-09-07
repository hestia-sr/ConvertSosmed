# ConvertSosmed — Render Free

## Deploy from GitHub
1. Create a GitHub repository.
2. Upload the contents of this folder so `Dockerfile`, `app.py`, `requirements.txt`, `render.yaml`, `static/`, and `templates/` are at the repository root.
3. In Render, choose **New → Web Service** and connect the GitHub repository.
4. Select the **Free** plan. Render detects the Dockerfile automatically.
5. Deploy and wait for the build to finish.

The public URL will be similar to `https://convertsosmed.onrender.com`.

## Important Free-plan limits
- The service may spin down after inactivity and take a little time to wake up.
- Local files are ephemeral. Downloads are temporary and are not permanent cloud storage.
- For strict $0 usage, do not add a payment method or enable paid resources.
