# BHARATSHIELD face and interface update

## Install on Windows
1. Stop the old backend with Ctrl+C. Keep the old folder as a backup.
2. Extract this ZIP into a new folder.
3. Copy the complete `backend/private` folder from your working installation into this version's `backend` folder. This preserves accounts, keys, registry and evidence. Do not mix individual database/key files.
4. Open PowerShell in the new `backend` folder and run:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

If `py -3.12` is unavailable, use an installed Python 3.11 or 3.13 runtime (`py -0p` lists runtimes). This build was checked with Python 3.12. Do not copy an old virtual environment.

5. Open http://127.0.0.1:8000 and press Ctrl+F5 once. The rebuilt frontend, local OCR assets and ONNX models are included. No frontend install is required for this packaged startup.
6. Sign in with your existing account. For later starts, double-click `START_LOCAL.bat`.

## What changed
- YuNet retries smaller image scales after a zero-face result. Boxes and all five landmarks map back to the original working image. Extra faces are not silently discarded, and face-comparison confidence thresholds are unchanged.
- The same scale helper is used for face comparison, retained template extraction, liveness and portrait-region inspection.
- Document and person captures both undergo the existing quality gates. A poor document portrait now explicitly requests recapture instead of producing an unreliable similarity score.
- Camera preview explicitly starts playback. Capture waits for nonzero frame dimensions, prevents duplicate clicks and ignores callbacks from closed/restarted sessions.
- Liveness can start a fresh challenge and camera after failures. Requests have timeouts, cancellation and stale-result protection.
- Invalid replacement uploads clear the old preview. Supported files without a browser MIME label are accepted for server-side validation; malformed images remain rejected.
- Person panel prioritizes status, similarity, face counts and liveness. Technical metadata and longer privacy explanations are expandable.
- The navy/blue theme remains. Forensic explanations are shorter, with methodology under details.
- Existing filename-triggered document simulations remain clearly labelled as simulated results in the result screen. Face/liveness measurements are not preset.

## Rehearse on your computer
Use a new, undecided screening with a readable portrait.
1. Expand Optional person comparison and liveness.
2. Enable optional person comparison, upload a clear photo and select Compare locally.
3. Check the result ABOVE the controls: detected document/person faces and a similarity value if processing succeeds.
4. Repeat using Open live camera > Capture person > Compare locally.
5. Run active liveness. Follow each prompt, capture once, and wait for the next step.
6. Try denying camera permission, retrying, choosing an invalid file, and starting a second screening.

A successful comparison displays Ready for officer review. That is intentional: similarity is not a verified identity verdict. Inconclusive means the image/model evidence was insufficient. A positioning guide in the camera preview is not live face detection.

## Validation limits
Automated component tests simulate browser camera APIs. They cannot test your physical webcam, lighting, browser permissions or actual head movements. Model inference was checked with the supplied sample image, including a same-image consistency control; this is not a biometric accuracy benchmark.

## Checks completed for this update
- 21 targeted backend regression tests passed.
- 16 frontend component tests passed (rerun for this flow update).
- Production frontend build passed; compiled assets are included.
- Real YuNet/SFace inference through the in-process API detected one document face and one submitted face for both upload and camera source paths using a same-image control. This tests API processing, not physical camera capture or identity accuracy.
- Backend startup completed. Separate localhost HTTP access and browser launch were unavailable in this execution environment; full browser layout and physical webcam verification remain local rehearsal tasks.
- Model checks used Python 3.12 and OpenCV 4.10.0.84.

Older version validation documents describe their original releases, not additional testing performed for this update.

## Optional face flow update
This copy builds on BHARATSHIELD_FACE_UI_UPDATE, using the earlier bharatshieldss.zip source. The newer e84fa5dd ZIP was unavailable and was not merged.

- The summary shows document and registry evidence first. A person-comparison card appears only after a recorded attempt; it is not shown for NOT_RUN or SKIPPED.
- Open Face verification (optional), then enable the check to choose camera or upload. Empty similarity metrics are hidden until an attempt returns.
- The screen moves to the top when a result opens or a different document is selected. Refreshing face results within that same case does not move you away from the face panel.
- Earlier camera readiness, retry and upload fixes are included.

Rehearsal: run local checks and confirm the result opens at the top with no unrequested person result. Expand Face verification (optional), enable it, capture/upload, then Compare locally. Inspect the returned result in that panel. Physical webcam and browser scrolling still require verification on your Windows machine.

## Interface cleanup
Removed the SIH26188 Demo Readiness panel from Dashboard and System status.
