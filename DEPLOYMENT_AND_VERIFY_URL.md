# Deployment & Verify URL

## "This site can't be reached" / DNS_PROBE_FINISHED_NXDOMAIN

If you see this when opening `https://digiportid.com/verify/start?slug=...&id=...` (or `https://www.digiportid.com/...`), the **domain does not resolve**. The app code is fine; the domain is not pointed at your hosting.

### What to do

1. **Deploy the app** (e.g. Vercel, or your host).
2. **Point the domain to your deployment:**
   - In your DNS provider, add a **CNAME** for `digiportid.com` and/or `www.digiportid.com` → your deployment (e.g. `cname.vercel-dns.com` for Vercel).
   - In your hosting (e.g. Vercel), add `digiportid.com` and `www.digiportid.com` as **custom domains** for this project.
3. **Optional:** Set `NEXT_PUBLIC_APP_URL=https://www.digiportid.com` in your deployment env so generated links use this base when needed.

---

## Testing the verify URL **before** DNS is fixed

The verify flow works on **whatever domain** the app runs on.

- **Local:**  
  `http://localhost:3000/verify/start?slug=fbwf-jwd&id=BA3D4578D3AE8EC1`  
  (run `npm run dev` first.)

- **Deployed (e.g. Vercel):**  
  `https://<your-project>.vercel.app/verify/start?slug=fbwf-jwd&id=BA3D4578D3AE8EC1`  
  Use your real Vercel URL.

Once DNS is set up, the same path works at `https://www.digiportid.com/verify/start?slug=...&id=...`.
