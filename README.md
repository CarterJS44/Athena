# Athena
This repo contains a handful of **Tampermonkey** user‑scripts written for Athena.  
They automate the repetitive clicks, highlight problem rows, and generally shave minutes off every routing/databuild sessions.
The basic guide should be reviewed before downloading and using scripts. 

> drop the scripts into Tampermonkey, visit the matching Athena page, flip the toggle buttons that appear in the toolbar, and enjoy.
> use the Downloading Installing and Using Tamper Monkey guide for how-to information. 



- All code is plain ES6, no build step.  
- To keep footprint small we use a single `MutationObserver` per script and debounce heavy work with `requestAnimationFrame`.  
- **Hotkeys:** search for the `HOTKEY` constant at the top of each file.  
- **Persistent settings:** one `localStorage` key per script – feel free to wipe it if something acts up.  
- Pull‑requests welcome (or just DM/Slack Carter).

-------------------------------------------------------------------

## License

Internal helpers for **EDUlog** staff. Not for redistribution outside the company.
