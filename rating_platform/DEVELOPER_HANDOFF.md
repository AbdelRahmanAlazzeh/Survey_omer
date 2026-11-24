# Developer & Researcher Handoff (`rating_platform`)

## 1. Local Verification & Run
The runtime server uses **Python 3 standard library only** (zero pip dependencies).

```bash
cd rating_platform
python server.py
```

- Participant URL: `http://localhost:8080/`
- Researcher Dashboard: `http://localhost:8080/admin.html?key=<YOUR_ADMIN_KEY>`

## 2. Before Going Live (`config.json`)
Edit `rating_platform/config.json`:
1. Set a strong secret in `"admin_key"`. (Empty `""` keeps `/admin.html` and exports locked.)
2. Update `"ethics_approval_no"` and `"contact_email"`.
3. Optionally set `"access_code"` if you want to restrict entry.
4. Restart the service after any edit to `config.json`.

## 3. Adding or Updating Photos
Place new 3-angle composite photos in your source folder named `<number><F|M>[chinese].<ext>`, then run:
```bash
python tools/prepare_faces.py --src "../more dataset/pic for test"
```
This only needs `Pillow`, `opencv-python`, and `numpy` on your preparation workstation (the production server does not need them). Copy `public/faces/` and `data/faces.csv` to the server and restart the service. **Important:** finalize all photos before real data collection starts.

## 4. Production Deployment (Hong Kong VPS + Caddy HTTPS)
1. Copy `rating_platform/` to `/opt/rating_platform` on your Ubuntu/Debian server.
2. Set permissions: `sudo chown -R www-data:www-data /opt/rating_platform`.
3. Install systemd service:
   ```bash
   sudo cp deploy/rating.service /etc/systemd/system/rating.service
   sudo systemctl daemon-reload
   sudo systemctl enable --now rating
   ```
4. Install Caddy (`deploy/Caddyfile` — replace `study.example.com` with your domain) and reload Caddy for automatic HTTPS.
5. Schedule daily SQLite backup via cron (`crontab -e`):
   ```cron
   0 3 * * * /opt/rating_platform/deploy/backup.sh
   ```

## 5. Bradley-Terry Method Used (`bt.py`)
Fits log-strengths (`bt_log_strength`) using Hunter's (2004) iterative Minorization-Maximization (MM) algorithm separately by `face_sex` (`F` / `M`) and by `rater_group` (`all`, `chinese`, `mideast`) on non-repeat answered trials, with minimal symmetric regularization (`eps = 1e-4`) so low-count faces remain finite, mean-centered to `0.0000` per group.

