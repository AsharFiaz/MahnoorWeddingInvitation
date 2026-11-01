# Deploying to Vercel (personal account)

Nothing in this repository has been pushed or deployed. These are the steps
to do it yourself from the personal GitHub account.

## 1. Push the repository

The local repository already has the personal identity configured and the
remote set to `git@github-personal:AsharFiaz/MahnoorWeddingInvitation.git`.
Create the empty repository on GitHub first (private is fine), then:

```bash
cd "~/Desktop/Mahnoor Wedding"
git push -u origin main
```

## 2. Import into Vercel

1. In Vercel (signed in with the personal GitHub account) choose **Add New
   → Project** and import `AsharFiaz/MahnoorWeddingInvitation`.
2. Framework preset: **Vite**. Build command `npm run build`, output
   directory `dist`, install command `npm install`. Node 20 or newer.
3. Environment variable: `VITE_SITE_URL` = the final origin with no trailing
   slash, for example `https://mahnoor-shirza.vercel.app` or your custom
   domain. This makes the sharing image an absolute URL, which WhatsApp
   needs. You can deploy once without it to learn the URL, then set it and
   redeploy.
4. Deploy.

## 3. Add the music (optional)

Copy the MP3 to `public/audio/until-i-found-you.mp3`, commit, push. The
Music control appears only when that file is served.

## 4. Check the live site before sharing

- Open the URL on a phone over mobile data: the names and dates appear at
  once, the book opens and turns by itself, the summary stays at the end.
- Tap **Event details**, **Get Directions** for both events (they must open
  Elegance Marquee and Zircon Marquee), **Add to Calendar** for both,
  **Open WhatsApp** in the RSVP and both **Call** and **WhatsApp** contact
  buttons.
- Paste the URL into a WhatsApp chat with yourself to see the preview. The
  preview has not been verified from this machine; if the image is missing,
  check `VITE_SITE_URL` and that `/og-image.jpg` loads.
- `https://your-site/?now=2026-12-26T19:00:00+05:00` should show the
  countdown to the Barat; `?now=2026-12-27T19:00:00+05:00` should show no
  countdown.

## Custom domain

Project → Settings → Domains in Vercel, then set `VITE_SITE_URL` to the new
origin and redeploy.
