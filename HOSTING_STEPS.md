# BHARATSHIELD evaluator deployment preparation

This is an overlay for BHARATSHIELD_CLEAN_DASHBOARD_NO_DEMO_BANNER(1).zip.
Merge its BHARATSHIELD folder into a COPY of the original project. This is not a complete application ZIP.
No live website has been deployed. Do not submit a URL until the checks below pass.

## 1. GitHub
Commit the merged project from the directory containing package.json.
Keep backend/private, local keys, databases, uploads and virtual environments out of GitHub.
Use fresh hosted accounts and synthetic registry data. Do not copy private runtime data into this deployment.

## 2. Backend
Use a Docker-capable server with HTTPS, a persistent volume and a terminal for creating accounts.
Build from the project root using Dockerfile.backend. Expose internal port 8000.
Run ONE instance/worker because this version stores data in SQLite.
Mount persistent storage at /data. This contains accounts, evidence, encryption keys and registry data; back it up together.
Set:
BHARATSHIELD_HOSTED=1
BHARATSHIELD_DATA_DIR=/data
BHARATSHIELD_ALLOWED_HOSTS=your-backend.example.com,your-project.vercel.app
BHARATSHIELD_ALLOWED_ORIGINS=https://your-project.vercel.app
Replace all example names with real domains. No trailing slash in origins. Add custom domains explicitly if used.
TLS must be provided by the server platform. The container port must not be exposed as a public plain-HTTP service.
The app deliberately does not trust forwarded IP headers; proxied login attempts can share throttling. Validate this under evaluator load.
The backend includes YuNet/SFace model files from the original project. Configure and test any additional language assets required by your samples.

## 3. Vercel
Edit vercel.json: replace REPLACE-BACKEND-HOST with the backend HTTPS hostname.
Import your GitHub repository. Root Directory is the directory containing package.json.
Framework: Vite. Build: npm run build. Output: dist.
Set VITE_HOSTED_MODE=1 for Production AND Preview builds before building.
This disables the filename-triggered frontend OCR presets. Hosted backend mode also disables the corresponding preset interceptor.
Do not claim preset results as actual analysis. Previously clean preset files may produce different results through real OCR/checks.
Use the stable production domain in backend allowed origins; allow preview domains individually only if needed.
The /api rewrite keeps browser requests and session cookies on the frontend origin.
Official rewrite reference: https://vercel.com/docs/routing/rewrites

## 4. Create fresh accounts
From the running backend container terminal (working directory /app/backend):
python manage_users.py --username admin --name "Project Supervisor" --role supervisor
python manage_users.py --username evaluator --name "SIH Evaluator" --role officer
Passwords are prompted privately. Do not commit passwords or place them in VITE variables.
Sign in as supervisor and load synthetic reference records using the existing registry interface.
The evaluator officer can screen documents; existing build permissions are otherwise unchanged.

## 5. Required live verification
- Open the public Vercel URL in a fresh browser; sign in, reload, then sign out.
- Confirm the session cookie is Secure and HttpOnly; reject an unlisted Origin/Host.
- Run real OCR and screening for both a clean synthetic sample and a DOB-conflict sample.
- Confirm live camera capture over HTTPS, face comparison, saved history and report export.
- Restart the backend and confirm accounts, keys, records and evidence survive.
- Run a second screening without reloading; confirm no stuck Processing state.
- Test upload size and slow analysis through Vercel; external proxy limits still apply.
- Confirm no fabricated pass results or real personal records are seeded.
- Confirm intended evaluators can access the production URL without a Vercel team login.

## Limits of this preparation
This patch configures hosting compatibility, not a completed public security audit.
The full application, container build, remote proxy/session flow, OCR and camera pipeline need deployment testing.
A remotely hosted backend processes uploads on the server. The original local edition remains available for offline use.
