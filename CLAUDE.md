# bushy-bear

`index.html` in this repo is the master copy of the SNS 90-Day Restructuring dashboard.

The published view lives at https://claude.ai/artifact/NbbhDeiqXtVPFpmCi1eACz and is
always a copy of `index.html`, never edited on its own.

## Making a change

1. Edit `index.html` here.
2. Commit and push.
3. Republish the artifact from this file: Artifact tool, `file_path` = this repo's
   `index.html`, `url` = the artifact link above. Don't create a new artifact.

If the artifact was changed somewhere else (a republish notice, or a conflict on
publish), copy those changes into `index.html` first, then commit, then republish.

## Style

Matches the Wine & Drama dashboards in a blue palette: Cormorant Garamond for
display and numbers, Inter for body. Every color is a token on `:root`, with dark-mode
overrides under `prefers-color-scheme` and `[data-theme="dark"]`.

## SNS Command Board (`sns-command-board.html`)

A second, separate page: the running SNS action list, calendar blocks, Cody's Sandbox
and project tracker, in the country-club theme from Katerina's "Six buckets" Command Board
(cream/tan grounds, pine green, Luxurious Script + Playfair Display).

- Published at https://claude.ai/artifact/PLoGt3Tz11k1oBWndNFjRj (private). Republish from
  this file with that `url`; omit `capabilities` on redeploy to keep the db rules.
- The data is NOT in the HTML. It lives in the artifact's `db`, collection `board`, one doc
  per item with `kind` = action | cal | cody | flag | project. Edit rows with ArtifactData.
- Access rule: root read/write = admin, so only the owner and Editors see anything.
  Never loosen it: the Sandbox tab is candid about Cody's ideas.
- Never merge this into `index.html`; that page is shared by link.
