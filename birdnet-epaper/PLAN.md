# BirdNET Kids on e-paper: plan

A small desk display, the Waveshare **ESP32-S3-ePaper-1.54**, that shows one of the 10 most recently heard birds from the BirdNET Kids site. A top row shows temperature, humidity and time, and the screen refreshes every 5 minutes.

Mockups live in `mockups/` (1x = real panel pixels, `@3x` for viewing). `tools/mockups.py` re-renders them from the site's real `data.json`.

## 1. Decisions in one place

| Question | Decision |
|---|---|
| Do we need code-made versions of the images? | **Yes.** The site's photos are full-size Wikimedia JPEGs (often several MB). The panel is 200×200 with black and white only. A one-time script on the PC turns each photo into a 1-bit dithered bitmap of about 3 KB. |
| Local server on the PC? | **Not needed.** The ESP reads `data.json` straight from GitHub. Everything else (bird pictures, names, icons) is flashed onto the ESP. |
| All species, or only the top 30? | **All of them fit.** 160 species × ~4 KB ≈ 650 KB, out of 8 MB of flash. Only audio would need a limit (see section 6). |
| Refresh | Wake every 5 minutes: read the sensor and clock, fetch the data, draw, and sleep. Do a full refresh when the bird changes, a partial refresh otherwise, and one full refresh at least every 30 minutes to clear ghosting. |
| Which bird to show | Rotate through the latest 10, one step every 5 minutes. A newly arrived detection jumps to the front ("just heard"). A "new bird" story from `news.json` gets its own celebration screen. |
| Language | Hebrew name large, English name small (the site has both). Text is rendered on the PC, so the ESP needs no right-to-left text engine. |

## 2. Hardware (to confirm on the device)

Taken from Waveshare's product listings. Their wiki couldn't be reached from the cloud sandbox, so **pin numbers must be read from Waveshare's demo code** in phase 0:

- ESP32-S3 (PICO-1-N8R8: 8 MB flash, 8 MB PSRAM; some listings say N4R2), Wi-Fi and BLE 5.
- 1.54" e-paper, 200×200, black and white, SPI. About 2 s for a full refresh and 0.3 s for a partial one.
- **SHTC3** temperature and humidity sensor and a **PCF85063** real-time clock, both on I²C.
- ES8311 audio codec with mic and speaker connector, a TF (microSD) slot, and Li-ion charging.
- **Two buttons: BOOT and PWR.** BOOT is usually GPIO0 and can wake the chip from deep sleep. PWR is often tied to a power-latch circuit, with a long press switching the board off. Check this before giving PWR a role.

Note: the board is plugged into your PC, but this plan was written in a cloud container that can't see it. Flashing and phase 0 need a local session (or PlatformIO on the PC).

## 3. Architecture

```
 BirdNET (PC) ──export, hourly──▶ GitHub: Heladoo/Birdnet_kids (data.json, news.json)
                                          │  HTTPS every 5 min (ETag: skip if unchanged)
                                          ▼
 tools/build_pack.py (PC, once / when new species appear)    ESP32-S3
   data.json + expert-data.json                     ├─ SHTC3 → °C, %RH
   → download photos → crop/dither                  ├─ PCF85063 ← NTP (Asia/Jerusalem)
   → render HE/EN names, badge icons                ├─ LittleFS: /cards/<sci>.bin (~160 × 4 KB)
   → littlefs image ──USB flash──────────────────▶  └─ e-paper 200×200
```

**Data fetch.** GET `https://raw.githubusercontent.com/Heladoo/Birdnet_kids/main/data.json` (~250 KB). Parse it as a stream with an ArduinoJson *filter* that keeps only `sci, name, he_name, last_seen, week_count, badges[].en`, then sort by `last_seen` and keep 10. That uses well under 30 KB of RAM, and PSRAM covers it anyway. Send `If-None-Match` so an unchanged file costs a single 304 response.
*Later, optional:* have the export also write a ~1.5 KB `device.json` holding just the top 10. The export script lives on the PC, not in the site repo.

**Unknown species** (heard after the pack was built): show a generic bird silhouette with the names in a built-in font (U8g2 has a Hebrew font). Rebuild and reflash the pack whenever convenient. A later option is to publish the cards next to `data.json` so the ESP can download a missing one and cache it.

## 4. The image pipeline (`tools/build_pack.py`, phase 1)

For each species in `data.json` and `expert-data.json`:

1. Download `image` (the Wikimedia URL) and cache it under `cache/`.
2. Crop to the photo box, centred slightly high (birds usually sit centre-top), using the same `photo_to_1bit()` steps as `tools/mockups.py`: autocontrast, unsharp mask, lighten the background a little, then **Atkinson dither**. Atkinson keeps whites clean, so it reads better on e-paper than Floyd–Steinberg.
3. Optional: cut the bird out of its background (`rembg`, PC only) and dither it onto white, which suits busy backgrounds. An `overrides/<sci>.png` folder lets a hand-picked picture win.
4. Render the Hebrew name (proper font, right-to-left shaping) and the English name as 1-bit strips.
5. Write `/cards/<sci-slug>.bin` with a small header (`w,h` per part) followed by the raw 1-bpp rows, which is exactly what `display.drawBitmap()` takes. The mockup's photo box (200×112) is 2,800 bytes.
6. Write a contact sheet PNG of every card, so bad crops are visible at a glance.

The ESP draws only the parts that change: the top bar, "heard at 13:55", the week count, badge icons and the position dots, using digit fonts and a few pre-rendered Hebrew words.

## 5. Mockups

| | Screen | Notes |
|---|---|---|
| **A** | `a-big-photo` | **Recommended default.** Photo across the full width, big Hebrew name, English below, badge icons, "9 minutes ago". Readable from across a room. |
| B | `b-side-card` | Photo on the left, details on the right (badges with labels, "heard at 12:31", times this week), and 10 dots showing which of the latest 10 is on screen. More data, smaller photo. |
| C | `c-trading-card` | Collectible-card style: round photo, name ribbon, 1–5 rarity stars from `week_count`. The most kid-like. |
| D | `d-top10-list` | The 10 latest with times. Works as the second screen (long press). |
| E | `e-new-bird` | Celebration screen for a `news.json` "new bird" story. |

All screens share the top row: thermometer °C, droplet %RH, and HH:MM on the right.

## 6. Buttons

| Button | Short press | Long press |
|---|---|---|
| **PWR** | **Refresh now**: reconnect, fetch, full refresh (also clears ghosting) | Power off (keep the hardware behaviour) |
| **BOOT** | **Next bird**: step through the latest 10 (partial refresh, about 0.3 s, no Wi-Fi) | Show the top-10 list (D) |

Why "Next bird": the screen shows *one of* ten, so kids will want to flip through. It's instant and needs no network or extra hardware.
**Strong runner-up, phase 3: "Hear it"** plays the bird's call through a speaker on the ES8311 connector. The site already has the clips (`audio/*.mp3`, ~165 KB each). Stream the clip from GitHub on demand, which needs no storage, or keep the latest ~30 on flash or microSD. That is where a top-30 limit would apply. It could move to long-press BOOT, with the list moved to a double press.

Wake sources while asleep: the timer (5 min) plus BOOT (ext0 on GPIO0). PWR's GPIO is checked in phase 0.

## 7. Firmware outline (PlatformIO, Arduino-ESP32 3.x)

- Libraries: **GxEPD2** (SSD1681 200×200 driver class; confirm against Waveshare's demo), **ArduinoJson 7**, an SHTC3 driver (a few lines over `Wire`), a minimal PCF85063 read/write, LittleFS.
- `main`: wake → read SHTC3 (before Wi-Fi heats the board) → time from RTC → if the timer woke us: Wi-Fi + fetch (ETag), and NTP→RTC once a day → choose the bird → draw → `hibernate()` the panel → deep sleep for the rest of the 5 minutes.
- State kept across deep sleep in RTC memory: index into the top 10, last ETag, the top-10 `sci` list, and a partial-refresh counter.
- Wi-Fi credentials in a `secrets.h` (git-ignored). A captive setup page can come later.
- Debug hooks, as in the games: a serial command and a build flag that draw each layout with fixed data, plus `tools/mockups.py` as the reference picture.
- Power: about 4 s awake per 5 minutes. On USB that's nothing; on a small LiPo, expect roughly 1–2 weeks (to be measured).
- Sensor accuracy: the SHTC3 sits next to the ESP. Read it straight after waking, and add a calibration offset if it reads warm.

## 8. Phases

0. **Bring-up (local, on the PC):** flash Waveshare's demo, note the pins (EPD SPI/BUSY/RST/DC/CS, I²C, buttons, power latch), and check the display, SHTC3, RTC and both buttons.
1. **Pack builder:** `build_pack.py` → contact sheet → LittleFS image. Review the dithered photos and fix bad ones with overrides.
2. **Firmware v1:** layout A, top bar, 5-minute cycle, both buttons, deep sleep.
3. **Extras:** list screen D, new-bird screen E, the "Hear it" audio button, `device.json` from the export.

## 9. Open questions for you

- Layout A, B or C as the main screen? Hebrew + English, or one language only?
- Will it run on USB power, or does it need to last on a battery? This decides whether Wi-Fi is used every 5 minutes or less often.
- Is a speaker attached? If so, "Hear it" is a great reason to make audio phase 2.
