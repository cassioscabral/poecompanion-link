# Living docs

`docs/WHAT-WE-READ.md` is a promise to players. If the code disagrees with it, that is a bug.

- Any PR that adds a data source (file, clipboard use, API, network call, stored data) must
  update `docs/WHAT-WE-READ.md` in the same PR, and say so in the PR description.
- Any PR that removes or narrows a source updates it too.
- Changes to user-visible behavior update `README.md`. Release steps live in
  `docs/agents/guidance/release.md`. Rules for agents live in `CLAUDE.md` and this folder.
- Keep docs short and true. Delete statements that stopped being accurate.
