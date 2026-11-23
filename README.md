# Wordle Starter Generator

A lightweight, zero-dependency web app that draws random 5-letter starting words from the complete official Wordle valid-guess dictionary (**14,855** words) and displays each word like a Wordle guess with randomized tile correctness (**green**, **yellow**, or **grey**).

## Features

- **Complete Valid Wordle Dictionary (14,855 Words)**  
  Includes every accepted 5-letter Wordle guess—from classic high-entropy openers to obscure, unlikely solution words and words with uncommon letters (`Q`, `X`, `Z`, `J`).
- **Category Filters**  
  Narrow random picks by strategy or draw from the full list:
  - **All** — All 14,855 valid Wordle guesses
  - **Top Optimal** — 40 classic high-entropy openers (`SALET`, `CRATE`, `SLATE`, `CRANE`, etc.)
  - **Vowel-Heavy** — 1,682 valid guesses containing 3 or more vowels
  - **Uncommon Letters** — 1,253 valid guesses containing `Q`, `X`, `Z`, or `J`
- **Authentic Wordle Guess Reveal**  
  Each letter is independently assigned a random tile color (**Green** = Correct, **Yellow** = Present, **Grey** = Absent) and revealed with a sequential 3D tile-flip animation, along with a category badge and color breakdown.
- **Re-roll Colors & Copy Grid**  
  Keep the current starter word while randomizing its tile colors again, or copy the word and Wordle emoji row (e.g. `🟩🟨⬛🟨🟩`) to your clipboard.
- **Recent Starters Board**  
  Tracks your last 6 rolls as clickable mini Wordle rows so you can quickly revisit earlier draws.
- **Searchable Dictionary Browser**  
  Open the **Dictionary** modal from the header to browse all 14,855 valid guesses (paginated for instant loading), search by letter or substring, and click any word to roll it immediately.
- **Light & Dark Mode**  
  Switch between classic Wordle Light and Dark themes using the theme button in the top-right corner (preference is saved automatically).

## How to Use

### Running the App

No build tools or dependencies are required. You can run the app in either of two ways:

1. **Open directly in a browser**  
   Double-click `index.html` or open it in any modern web browser.
2. **Serve locally (optional)**  
   Run a local static server from the project directory:
   ```bash
   python3 -m http.server 8765
   ```
   Then visit [http://localhost:8765](http://localhost:8765).

### Controls & Shortcuts

| Action | How |
| --- | --- |
| Draw a random starter | Click **Get Random Starter** or press `Space` |
| Filter word pool | Click **All**, **Top Optimal**, **Vowel-Heavy**, or **Uncommon Letters** |
| Randomize tile colors for current word | Click **Re-roll Colors** |
| Copy word + emoji tiles | Click **Copy Grid** |
| Browse or search valid words | Click **Dictionary 14,855** in the top-left header (`Esc` to close) |
| Re-load a previous draw | Click any row under **Recent Starters** |
| Toggle Light / Dark theme | Click the moon/sun icon in the top-right header |

## Project Structure

```text
WordleStarter/
├── index.html      # App markup, header, Wordle stage, history board, and dictionary modal
├── styles.css      # Authentic Wordle styling, 3D tile flip animations, and Light/Dark themes
├── app.js          # Random word/color selection, flip animation, history, search, and UI controls
├── dictionary.js   # Full 14,855-word official valid Wordle guess list and category classifier
└── README.md       # Project documentation
```
