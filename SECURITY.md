# Security policy

## Reporting a vulnerability

Please report privately through GitHub: Security tab, "Report a vulnerability"
(https://github.com/cassioscabral/poecompanion-link/security/advisories/new). Do not open a
public issue. We aim to acknowledge within 7 days.

## Scope

In scope: the desktop app and the packages in this repo, including anything that could leak
a player's logs, names, or credentials, run unintended code, or make the app send input to
the game on its own (which would also put players' accounts at risk).

Out of scope: vulnerabilities in the game itself, in Path of Exile servers, or in
third-party services; issues needing a machine the attacker already controls.

Never include a raw `Client.txt` in a report; redact it first.
