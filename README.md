# DealerTrack - Printer ID Assignment Tool

A lightweight Chrome extension for finding, replacing, exporting, and importing Printer ID values in DealerTrack DMS.

## Features

- Find and replace Printer ID values across the full grid.
- Replace all rows at once.
- Click a value in the preview list to auto-fill the Find box.
- Clear all Printer ID values.
- Export current Printer IDs to a `.txt` file.
- Import a `.txt` file and apply values to the 46 rows in order.

## Installation

### Load unpacked in Chrome

1. Download or clone this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the extension folder.

## Usage

1. Open the DealerTrack DMS page that contains the Printer ID grid.
2. Open the extension popup.
3. Enter a value in **Find** and **Replace with**.
4. Click **Replace All** to update matching rows.
5. Use **Clear All**, **Export**, or **Import** as needed.

## Import format

The import file should contain one Printer ID per line.

Example:

```txt
TEST1SDP1
TEST1SDP2
TEST1SDP3
```

Values are applied to rows in order, from top to bottom.

## Built for

- DealerTrack DMS
- Chrome Manifest V3

## Author

Matt Smith  
[https://matt.work](https://matt.work)

## Date

May 3, 2026
