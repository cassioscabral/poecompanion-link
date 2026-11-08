# What PoE Companion Link reads, and what it never does

Trust is the whole point of this app, so here is the full list. If the code ever disagrees
with this page, that's a bug. Please open an issue.

## Reads (all opt-in, all local)

| Source                                                      | When                                                | Why                                                            |
| ----------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| `Client.txt` (the game's own log file)                      | Only after you enable it in Settings                | Zone changes, level ups, deaths, AFK, whispers, trade requests |
| Clipboard                                                   | Only right after **you** press the item-copy hotkey | Read the item you are hovering                                 |
| Public GGG / community APIs (trade data, currency exchange) | When you ask for a lookup                           | Prices and listings. Requests go out from **your** PC          |

## Never

- Read or write game memory, or inject anything into the game client
- Read your screen (no OCR, no screenshots of the game)
- Ask for, store or send your POESESSID or password
- Press keys or send chat messages in the game unless **you** pressed the hotkey for that one action
- Reply to or invite players automatically, from the PC or from your phone
- Send anything to our servers unless you explicitly connect an account (not built yet)

GGG's developer guidelines, which this follows: https://www.pathofexile.com/developer/docs

This product isn't affiliated with or endorsed by Grinding Gear Games in any way.
