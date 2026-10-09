# Enable the local recovery test version

This development mode enables prayer protection on **http://localhost:5173**
against a separate local Supabase database. It uses test accounts and local
passkeys with RP ID `localhost`. Production enrollment remains disabled by
default and production accepts only `https://qetoret.com` / `qetoret.com`.

## First setup on this Windows PC

Docker Desktop must be running. The Supabase CLI uses Docker for its local
services; its first start can download container images and take several minutes.
See [Supabase local development](https://supabase.com/docs/guides/local-development).

Open PowerShell and run these commands individually:

```powershell
Set-Location -LiteralPath 'C:\Users\T480s\Desktop\Ministry\projets\pray_for_me'
npm.cmd run setup:recovery-test
npx.cmd --yes supabase --workdir .recovery-test start
npx.cmd --yes supabase --workdir .recovery-test status
```

The setup command creates `.recovery-test/supabase/config.toml`, copies the
project's migrations, and creates `.recovery-test/.env.local` with placeholders.
It uses a separate project ID and ports, disables seed data, and preserves
existing files on subsequent runs. It does not reset a database.

Open `.recovery-test/.env.local` in your text editor. From the **local** `status`
output, replace these three values:

| Setting | Value from the separate local instance |
|---|---|
| `VITE_SUPABASE_ANON_KEY` | Its anon key, or publishable key |
| `SUPABASE_ANON_KEY` | The same anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Its service-role key |

If the CLI provides a secret key instead of a service-role key, remove the
`SUPABASE_SERVICE_ROLE_KEY` line and set `SUPABASE_SECRET_KEY` instead. Keep
server secrets out of variables beginning with `VITE_`. The file is ignored by
Git; do not share its contents or use keys from a hosted project.

Leave the existing URLs and flags in the generated file as they are. They
already enable the test feature. Then run:

```powershell
npm.cmd run dev:recovery-test
```

Keep that PowerShell window open and open **http://localhost:5173** in a new
Chrome or Edge browser profile reserved for this test. Use this exact address;
`127.0.0.1`, a different port, or the PC's
network address does not enable local passkey enrollment.

## Create the test account and check recovery first

On this PC, the isolated stack and local keys were prepared on 2026-10-09.
While the development server is running, you can open the address above
directly. The startup commands remain useful after stopping or restarting it.

Create a new account through the app's email/password registration. This is
an account in the separate local database; your qetoret.com login is not copied.
The current local configuration does not require email confirmation. If you
need to inspect users, local Supabase Studio is at http://127.0.0.1:55423.

1. Create a prayer with a distinctive title and text and wait for synchronization.
2. Open **Settings → Privacy & Security → Prayer protection**. In German:
   **Einstellungen → Privatsphäre & Sicherheit → Gebetsschutz**.
3. Create an emergency code, save it separately, and use the saved-code test.
4. Close the original browser profile. In a separate new browser profile, sign
   in with the same local account and restore using the emergency code.
5. Confirm that the original prayer text is readable. An empty journal or a
   successful sign-in by itself does not prove recovery.
6. Back in the original profile, add a passkey, then enable device unlock using
   that passkey and the independently tested emergency code. Refresh the page
   and verify that it remains locked until device verification succeeds. Leave
   the app untouched for six minutes to check its five-minute idle lock.

Some authenticators can authenticate without providing the PRF extension needed
to unwrap the encryption key. An unsupported message is a failed passkey test,
even if Windows Hello or a PIN dialog worked. Emergency-code recovery can be
tested separately. The longer German walkthrough is
[RECOVERY_TESTANLEITUNG_DE.md](RECOVERY_TESTANLEITUNG_DE.md).

## Start it again later

With Docker running, from the same project directory:

```powershell
npx.cmd --yes supabase --workdir .recovery-test start
npm.cmd run dev:recovery-test
```

Stop the Vite server with Ctrl+C. To stop only this local Supabase stack while
preserving its data:

```powershell
npx.cmd --yes supabase --workdir .recovery-test stop
```

When new migrations are added, rerun `setup:recovery-test`, then apply pending
migrations to the existing **local** instance with:

```powershell
npx.cmd --yes supabase --workdir .recovery-test migration up --local
```

## Troubleshooting and scope

- **“Fill ... with a key”**: placeholders remain in `.recovery-test/.env.local`.
  Obtain keys with the isolated `status` command above and restart Vite.
- **Port 5173 in use**: stop the other development server. This mode refuses
  to silently switch ports because the passkey origin must remain exact.
- **Database/API unavailable**: start Docker and the isolated Supabase stack;
  confirm its API is on port 55421. Keep the `/api/recovery` handler running
  through `dev:recovery-test`, rather than a static file server.
- **Configuration mismatch**: setup retains the existing config/migration and
  reports the mismatch. Reconcile that file before starting; do not reset data
  to dismiss the error.
- **Passkeys unavailable**: use current Chrome/Edge and a provider that supports
  PRF. Record the provider and error; do not bypass the recovery requirement.

This PC setup checks real local API/database behavior, emergency-code recovery,
and supported local authenticators. It cannot establish recovery after losing
a physical phone, provider synchronization, or production offline PWA behavior.
Vite development mode does not provide the production service-worker cache for
offline reload. A phone's `localhost` points to the phone itself, so phone tests
require a separately configured HTTPS test environment. Do not use a LAN URL
or change production flags as a workaround.

The isolated mode reads only its own environment directory, accepts only the
loopback Supabase API on port 55421, and refuses production builds. Root `.env`
files and inherited credentials cannot supply its browser or server settings.
AI and other optional external integrations are disabled in this test mode.
Local passkey wrappers are deliberately rejected in production and production
passkey wrappers are rejected in the local test mode.
