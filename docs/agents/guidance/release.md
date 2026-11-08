# Release (maintainers only)

Agents and outside contributors do not tag, publish, or push to `main`.

1. Bump `version` in `apps/desktop/package.json` (semver: patch for fixes, minor for
   features, major for breaking changes) and merge via PR.
2. Tag `vX.Y.Z` on `main` and push the tag.
3. `.github/workflows/release.yml` runs tests, then builds on three runners: Windows (NSIS
   installer and portable), macOS (dmg, unsigned), Linux (AppImage). Artifacts upload to a
   **draft** GitHub release.
4. A maintainer smoke-tests the Windows build on a real PC with the game (enable the log,
   see events, export a redacted sample, check the tray and quit).
5. Publish the draft release.

Auto-update uses `electron-updater` and works only for the NSIS installer. Portable, dmg
and AppImage users update manually. The macOS build is unsigned, so Gatekeeper warns; say
so in the release notes.
