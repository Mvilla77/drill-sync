# Framer Drill Sync

A tiny REST service that lets n8n read and edit your "Drill Card" component
instances in Framer, and publish the site. It wraps Framer's official
Server API (`framer-api`), which only speaks WebSocket, behind plain HTTP
endpoints n8n's HTTP Request node can call directly.

This is written to run entirely on Railway, as a third service alongside
your existing `n8n` and `Postgres` services -- no local machine, no Node
install needed on your end.

## 0. Regenerate your API key

You pasted a Framer Server API key in a chat earlier -- treat that one as
compromised regardless of the exact value shown. Go to **Site Settings ->
General -> Server API** in Framer, delete the old key, and generate a
fresh one. It only ever goes into a Railway environment variable, never
into code or chat.

## 1. Get this code into Railway

Simplest path, no command line required:
1. Go to github.com, create a new (private is fine) repository.
2. Use the "Add file -> Upload files" button on the repo page and drag in
   everything from this folder (keep the `src/` folder structure intact).
3. Commit.

Then in Railway, inside your existing **AI Agent** project (same one as
`n8n` and `Postgres`):
1. Click **+ New** -> **GitHub Repo** -> select the repo you just created.
2. Railway will auto-detect it as a Node project and deploy it as a new
   service, e.g. `framer-drill-sync`, sitting right next to `n8n`.

## 2. Set environment variables

On the new service in Railway, open **Variables** and add:
- `FRAMER_API_KEY` - your new key
- `FRAMER_PROJECT_URL` - your Framer project URL
- `SERVICE_API_KEY` - make up a long random string; this is what n8n will
  authenticate with when it calls this service
(`PORT` is set automatically by Railway -- no need to add it.)

Redeploy after saving variables if it doesn't restart automatically.

## 3. Get a public URL and run discovery -- from the cloud

In the service's **Settings -> Networking**, click **Generate Domain** to
get a public URL, e.g. `https://framer-drill-sync-production.up.railway.app`.

`GET /drills` doubles as your discovery step -- it returns every Drill Card
it found, including the raw internal control keys Framer actually uses
(they may not be exactly `duration`/`exercise`/`coachNotes`/`purpose`).
Run this from any terminal (your own laptop's terminal is fine -- this is
just calling a URL, not running the project):

```bash
curl https://<your-service>.up.railway.app/drills \
  -H "Authorization: Bearer <your SERVICE_API_KEY>"
```

Send me that output. If the `program`/`day`/`block` values are wrong, or
`duration`/`exercise`/`coachNotes`/`purpose` come back `null` while
`rawControls` clearly has the data, I'll adjust the matching logic in
`src/framer-drills.ts`, you push the change to GitHub, and Railway
redeploys automatically.

## 4. Wire it into n8n

**List drills (for dropdowns in your form):**
`GET {service_url}/drills`
Header: `Authorization: Bearer <SERVICE_API_KEY>`
Returns one entry per real drill, already merged across its Desktop/Tablet/Phone
breakpoint copies.

**Update one drill:**
`PATCH {service_url}/drills`
Header: `Authorization: Bearer <SERVICE_API_KEY>`
Body (JSON) -- `program`, `day`, `block`, and `exercise` identify *which* drill
(match its current values exactly), the rest are the fields you're changing:
```json
{
  "program": "Adult Class", "day": "Monday", "block": "Adult Footwork Block",
  "exercise": "Hill-hill & Toe-toe",
  "duration": "12 min"
}
```
This updates every breakpoint copy of that drill together, so the site stays
consistent across screen sizes. Add `?publish=true` to the URL to publish
immediately, or leave it off and call `POST /publish` once after batching
several edits.

**Debug view:** `GET {service_url}/drills/raw` returns every individual
component instance (one row per breakpoint), including the untouched
`rawControls` object -- useful if Framer's internal control keys ever change.

Suggested n8n flow:
1. **Form Trigger** (or Telegram trigger later) - Program / Day / Block dropdowns,
   a drill picker, and the fields to change.
2. **HTTP Request** - `GET /drills` to populate the drill picker with current values.
3. **HTTP Request** - `PATCH /drills` with the new field values.
4. Optionally write the same change to a Google Sheet as your running drill
   database/backup.

## Notes / limitations

- This only works on component instances named exactly `Drill Card`
  (see `DRILL_COMPONENT_NAME` in `src/framer-drills.ts`). If you rename
  the component in Framer, update that constant.
- The Framer Server API is in open beta and is not transactional -- if a
  script errors mid-update, only some edits may have applied. The
  service returns clear errors per-request so n8n can retry safely.
- `getNodesWithType` returns instances from the whole project; if you ever
  reuse the "Drill Card" component somewhere unrelated, tighten the
  filter in `listDrillCards`.

## 5. Import the n8n workflow

`n8n/update-drill-workflow.json` is a ready-to-import workflow: it exposes a
webhook that takes a drill's identity plus the new values, calls this
service, and returns the result.

1. In n8n: **Workflows -> Import from File** -> pick `n8n/update-drill-workflow.json`.
2. Add a credential: **Credentials -> New -> Header Auth**. Name it
   `Framer Drill Sync Service Key`. Set the header name to `Authorization`
   and the value to `Bearer <your SERVICE_API_KEY>` (same value as the
   Railway env var). Then open the **Update Drill in Framer** node in the
   imported workflow and select that credential (it imports with a
   placeholder that needs to be pointed at your real one).
3. Add an n8n environment variable (**Settings -> Variables**, or via
   `N8N_` env vars on Railway) called `FRAMER_DRILL_SYNC_URL` set to your
   service's public URL, e.g. `https://drill-sync-production.up.railway.app`
   (no trailing slash). The workflow reads this via `$vars.FRAMER_DRILL_SYNC_URL`.
4. Activate the workflow. n8n will show you the production webhook URL,
   e.g. `https://n8n-production-39c0.up.railway.app/webhook/update-drill`.

### Calling it

Send a POST with JSON body identifying the drill (`program`, `day`, `block`,
`currentExercise` -- match the drill's values exactly as they are now) plus
whichever fields you want to change:

```powershell
$body = @{
  program         = "Adult Class"
  day             = "Monday"
  block           = "Adult Footwork Block"
  currentExercise = "Hill-hill & Toe-toe"
  duration        = "12 min"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://n8n-production-39c0.up.railway.app/webhook/update-drill" -Method Post -ContentType "application/json" -Body $body
```

To rename the drill itself, add `exercise = "New Name"` to the body (that's
the *new* name -- `currentExercise` is only used to find it). Any of
`duration`, `exercise`, `coachNotes`, `purpose` can be included or omitted;
omitted fields are left unchanged. The workflow publishes automatically.
