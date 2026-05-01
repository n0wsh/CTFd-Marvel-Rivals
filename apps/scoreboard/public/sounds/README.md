Put scoreboard sound effects in this directory.

These files are served by the scoreboard app from `/sounds/<filename>`.

Expected filenames:

- `kill.mp3`: correct submission (`flag_correct`)
- `first-blood.mp3`: first solve event
- `leader-changed.mp3`: leader change event
- `hero-confirm.mp3`: hero confirmation event
- `notification.mp3`: organizer and freeze notifications

If a file is missing or playback fails, the scoreboard falls back to the
generated browser sound for that event.
