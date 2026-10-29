# Farkfield desktop app

Desktop shell for [Farkfield](https://farkfield.vercel.app). It opens the live Farkfield site in its own
window and signs you in through your normal browser. It contains no server code, no API keys and no data.

## Download

Get the latest installers from the [Releases page](../../releases/latest):

- **Windows:** `Farkfield-Setup-x64.exe` (installer) or `Farkfield-Portable-x64.exe` (no install)
- **macOS:** `Farkfield-macOS-arm64.dmg` (Apple Silicon) or `Farkfield-macOS-x64.dmg` (Intel)

These test builds are not code-signed, so Windows SmartScreen or macOS Gatekeeper may warn about an unknown
publisher. Each release lists SHA-256 checksums so you can verify the file.

## Build it yourself

    npm ci
    npm run build:windows   # or build:mac

Installers are written to `release/`. Releases are built by GitHub Actions when a `v*` tag is pushed.
