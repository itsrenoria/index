# Passport Advantage Dashboard Design

## Purpose

Build a single self-contained HTML page that makes the practical differences among Albanian, Greek, German, and United States passports easy to understand. The page must answer both broad questions—what each passport adds or lacks—and destination-specific questions about entry requirements and permitted stay.

## Data Source and Scope

- Source the comparison data from Passport Index's prepared 2026 passport comparison in Safari.
- Include every destination available in the comparison.
- Preserve Passport Index's entry labels and stay lengths where supplied.
- Display the source and retrieval date in the interface.
- Include a reminder that entry rules can change and should be verified before travel.
- Do not include personal context about the intended users or their current or future citizenships.

## Comparison Rules

Treat entry types as an ordered measure of travel convenience:

1. Visa-free
2. Visa on arrival
3. ETA
4. eVisa
5. Visa required

When two passports have the same entry type, a longer stated permitted stay wins. Equal entry types with equal or absent stay lengths are ties. The interface must still show each entry type separately rather than collapsing them into a generic accessible/not-accessible result.

Where Passport Index combines categories for one destination, such as eVisa and visa on arrival, preserve that combined label and compare it by its easiest available entry path.

## Information Architecture

### Summary

The top of the page presents four passport cards. Each card shows:

- Passport name and mobility score.
- Number of outright destination wins.
- Number of tied-best destinations.
- Number of destinations where another passport offers a better result.
- A concise list of distinctive advantages over the other three passports.
- A concise list of notable gaps relative to the best available passport.

A compact “who wins where” overview immediately below groups destinations by winning passport and calls out ties.

### Destination Explorer

The main section is a searchable comparison matrix with one row per destination and one column per passport. Every cell shows the entry category and stay length, when present. Each row marks a single winner or a tie using both text and color-independent symbols.

Controls include:

- Destination search.
- Entry-category filter.
- Passport advantage filter.
- “Differences only” toggle.
- “Albania wins” quick filter.
- Sort by destination or by strength of difference.

The initial view emphasizes differences rather than rows where all four passports are equivalent.

## Visual Direction

Use a refined travel-document aesthetic inspired by immigration stamps and archival route maps without reproducing Passport Index branding. The interface should feel editorial and information-dense, with warm paper tones, dark ink, restrained passport-specific accent colors, tabular numerals, and subtle stamp-like markers. It must remain readable on mobile and desktop.

Motion is limited to a short staged page reveal and purposeful filter transitions. Respect `prefers-reduced-motion`.

## Technical Architecture

- Deliver one `index.html` file.
- Embed all CSS, JavaScript, icons, and comparison data directly in the file.
- Use no build step, framework, runtime dependency, external font, or network request.
- Store normalized destination data in one JavaScript array.
- Keep comparison, aggregation, filtering, sorting, and rendering as small named functions with clear inputs and outputs.
- Generate all summaries from the same normalized data used by the matrix so totals and destination details cannot drift apart.

## Accessibility and Resilience

- Use semantic headings, buttons, labels, and table structure.
- Provide keyboard-operable controls and visible focus styles.
- Never rely on color alone for entry categories or winners.
- Make the matrix horizontally scrollable on narrow screens while keeping destination names understandable.
- Handle missing stay lengths as unknown rather than zero.
- Treat unrecognized source labels as neutral/unknown and expose the original label instead of silently assigning a ranking.

## Verification

- Verify source-row parsing against representative destinations for every entry category and for missing stay lengths.
- Unit-check the ranking and stay-length tie-break behavior in the browser console or a small local script.
- Confirm summary counts are derived from and reconcile with matrix outcomes.
- Exercise search, each filter, both sort modes, and reset behavior.
- Check responsive layouts at narrow mobile, tablet, and desktop widths.
- Check keyboard navigation, focus visibility, reduced motion, and basic contrast.
- Open the final file directly from disk to confirm it works without a server or network connection.

