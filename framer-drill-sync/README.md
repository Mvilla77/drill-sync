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
3. In that same **Update Drill in Framer** node, check the **URL** field --
   it's hardcoded to `https://drill-sync-production.up.railway.app/drills`.
   If your Railway service URL is ever different, edit it there.
   (n8n's built-in "Variables" feature would be the cleaner way to store this,
   but it's an Enterprise/Pro Cloud-only feature -- not available on
   self-hosted Community Edition, so this workflow just hardcodes it directly.)
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

## 6. AI Agent (chat con lenguaje natural)

`n8n/ai-agent-drill-editor.json` agrega una capa de IA encima de todo lo
anterior: le escribes en lenguaje natural ("cambia la duracion del Hill-hill
del lunes a 9 minutos") y el agente decide que herramienta usar.

El agente tiene dos herramientas:
- **List Drills** (GET `/drills` en tu servicio) -- para consultar los
  valores EXACTOS actuales antes de modificar nada. El sistema le exige
  usarla si no esta seguro del texto exacto de program/day/block/exercise,
  porque `Update Drill` necesita coincidencia exacta.
- **Update Drill** (POST al webhook de n8n `update-drill` que ya armamos) --
  reusa exactamente el mismo webhook, no llama a Framer directamente.

### Setup

1. **Importar**: Workflows -> Import from File -> `n8n/ai-agent-drill-editor.json`.
2. **Credencial de Anthropic**: Credentials -> New -> busca "Anthropic" ->
   pega tu API key de https://console.anthropic.com (distinta de tu cuenta
   de Claude.ai). Abre el nodo **Anthropic Chat Model** y selecciona esa
   credencial, y elegi tu modelo real del dropdown (el valor que viene por
   defecto es solo un placeholder).
3. **Header de autorizacion**: en el nodo **List Drills**, reemplaza
   `Bearer <your SERVICE_API_KEY>` por tu clave real, igual que hicimos
   en el otro workflow.
4. **URL del webhook**: el nodo **Update Drill** ya apunta a
   `https://n8n-production-39c0.up.railway.app/webhook/update-drill` (tu
   URL real). Si alguna vez cambia, actualizala ahi.
5. Activa el workflow.

### Probarlo

Abre el workflow en n8n y usa el boton de **Chat** (icono de burbuja,
normalmente abajo a la derecha del editor) para probarlo conversacionalmente
sin necesidad de Telegram todavia. Prueba algo como:

> "Cambia la duracion de Hill-hill & Toe-toe del lunes de adultos a 9 minutos"

El agente deberia: consultar `List Drills` si hace falta, llamar a
`Update Drill` con los campos correctos, y confirmarte en espanol que se
publico el cambio.

## 7. Poblar todas las tarjetas aleatoriamente

`POST /drills/randomize?publish=true` asigna, en una sola llamada, un drill
aleatorio de `src/new-drill-pool.ts` (los 40 drills nuevos) a cada tarjeta
actual del sitio, respetando program + block, sin repetir dentro de cada
grupo. Actualiza los 3 breakpoints de cada tarjeta y publica.

```powershell
Invoke-RestMethod -Uri "https://drill-sync-production.up.railway.app/drills/randomize?publish=true" -Method Post -Headers @{ Authorization = "Bearer 1234567890" } | ConvertTo-Json -Depth 5
```

Devuelve un resumen `before -> after` por cada tarjeta cambiada, para que
puedas confirmar rapido que no quedo ninguna sin actualizar.

## 8. Poblar desde Google Sheets (con n8n + Code node)

Esta es la version recomendada para poblar el sitio: en vez de tener los
drills hardcodeados en el codigo, viven en una Google Sheet que vos podes
editar libremente, y n8n hace la seleccion aleatoria con un Code node.

### La base de datos

`Fencing_Drills_Database_for_Sheets.xlsx` (te la mande por separado) tiene
las columnas exactas que este workflow espera: `program`, `block`,
`duration`, `exercise`, `coachNotes`, `purpose`. Subila a Google Sheets
(Archivo -> Importar, o simplemente arrastrala a Google Drive y abrila con
Sheets). Incluye una segunda hoja "Instructions" con los valores exactos
permitidos para `program` y `block` -- tienen que coincidir letra por letra
con lo que usa el sitio.

### El workflow: `n8n/randomize-from-sheet-workflow.json`

Flujo: **Webhook -> Google Sheets (lee toda la base) -> Get Current Drills
(GET /drills, las 20 tarjetas actuales) -> Code node (elige un drill
aleatorio por tarjeta, sin repetir dentro de cada grupo program+block) ->
Update Drill in Framer (PATCH /drills, una vez por tarjeta) -> Publish Site
(una sola vez, al final) -> Respond**.

Setup:
1. Importa `n8n/randomize-from-sheet-workflow.json`.
2. Abri el nodo **Google Sheets**: conecta tu cuenta de Google (credencial
   OAuth2), y elegi tu spreadsheet real y la hoja "Drills" en los
   dropdowns (los valores que trae son placeholders).
3. En **Get Current Drills**, **Update Drill in Framer**, y **Publish
   Site**, reemplaza `Bearer <your SERVICE_API_KEY>` por tu clave real
   (mismo patron que los otros workflows).
4. Activa el workflow.

### Probarlo

```powershell
Invoke-RestMethod -Uri "https://n8n-production-39c0.up.railway.app/webhook/randomize-from-sheet" -Method Post | ConvertTo-Json -Depth 5
```

Nota: `Update Drill in Framer` tiene `continueOnFail` activado -- si algun
drill de la hoja no encuentra coincidencia exacta en el sitio (program/day/
block/currentExercise), esa tarjeta se salta pero el resto sigue
procesandose normalmente, y la respuesta final lista todo lo que se
intento actualizar.

## 9. Fix: "Too many concurrent sessions" con actualizaciones masivas

Si el workflow de Google Sheets manda muchas tarjetas seguidas por separado
(una llamada PATCH por tarjeta), Framer eventualmente rechaza las conexiones
con `"Too many concurrent sessions for this API key"` -- las sesiones viejas
no se cierran tan rapido como se abren las nuevas.

**`PATCH /drills/bulk`** resuelve esto: recibe la lista completa de cambios
de una vez (`{ "updates": [ {...}, {...}, ... ] }`) y los aplica todos
dentro de UNA sola conexion a Framer, publicando una sola vez al final. El
workflow `randomize-from-sheet-workflow.json` ya esta actualizado para usar
este endpoint -- el Code node ahora devuelve un unico item con el array
completo de updates, en vez de un item por tarjeta.
