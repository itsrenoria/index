# Direct Passport Comparisons Design

## Goal

Replace bundle scenarios with a simpler, mobile-first page that directly compares the Albanian, Greek, German, and United States passports. All useful comparisons stay visible on one page, while a destination search at the top answers the fastest practical question: what does each passport provide for this country?

## Access model

The dashboard keeps the approved binary ranking model:

- Positive: home country, visa-free, ETA/eVisitor, visa on arrival, and lightweight arrival registration.
- Negative: eVisa, visa required, not admitted, and unknown.
- Stay length never changes rank, but the exact Passport Index wording and days remain visible.

Positive access is further annotated without changing rank:

- **Free / pre-cleared:** home country, visa-free, ETA/eVisitor, and lightweight registration. ETA or registration can still have a small administrative fee, so the interface describes this category as normally free or pre-cleared rather than guaranteeing zero cost.
- **On arrival:** visa on arrival. A fee may be charged at the border.

The published Passport Index mobility score remains a secondary source reference. The prominent positive-access count is recalculated from the simplified model.

## Page structure

### Destination search

A search field appears directly under the hero. Typing a full or partial destination name selects the best match and immediately displays four compact passport results. Each result shows:

- Passport name.
- Exact Passport Index label and stay length.
- Positive or negative ranking.
- Practical access annotation: free/pre-cleared, on arrival, or visa needed.

An unmatched query shows a clear empty state. The 199 destination names are embedded in a native datalist for keyboard and mobile suggestions.

### Passport overview

Four compact cards show Albania, Greece, Germany, and the United States. Each card contains:

- Recalculated positive destination count.
- Negative destination count.
- Published Passport Index mobility score.
- Breakdown of free/pre-cleared versus on-arrival positive destinations.

### Direct comparisons

Show all six passport pairings with no selector:

1. Albania vs Greece.
2. Albania vs Germany.
3. Albania vs United States.
4. Greece vs Germany.
5. Greece vs United States.
6. Germany vs United States.

Each comparison card always shows both passports' unique positive destinations. Shared positive and shared negative destinations appear as concise counts rather than repeated full lists. This preserves the useful differences while removing bundle duplication.

Each unique destination row displays the exact raw source label for both passports so differences such as visa-free, ETA, visa on arrival, eVisa, and stay length remain inspectable. Long unique lists may be visually compacted with a scroll region on desktop and remain naturally readable on mobile; they are not hidden behind selectors or scenario controls.

## Visual direction

Keep the restrained editorial passport aesthetic: warm paper, dark green-black typography, oxblood accents, serif display type, and compact monospaced metadata. The page remains mobile-first:

- One-column search results and comparison cards on narrow screens.
- Horizontally scrollable passport summary cards.
- Two-column comparison grid on larger screens.
- Touch targets remain at least 44 pixels.
- No external fonts, scripts, images, or network requests.

## Data and implementation

Continue using the embedded 199-destination Passport Index dataset. Pure functions will provide:

- Binary access weight.
- Practical access annotation.
- Passport summary and positive-mode breakdown.
- Destination lookup.
- Direct pair comparison and four-way partitioning.

The browser renders the search results, passport cards, and six comparison cards from those functions. The output remains a single offline `index.html`.

## Verification

Automated tests will verify:

- All positive categories tie for ranking and all negative categories tie.
- Stay length does not affect ranking.
- The practical access annotation distinguishes free/pre-cleared from on-arrival access.
- Search handles exact, partial, case-insensitive, and unmatched queries.
- All six direct comparison definitions are present.
- Every comparison partitions all 199 destinations exactly once.
- Exact raw labels remain in detailed comparison and search output.
- The page has no bundle/scenario selector and remains self-contained.

Safari verification will cover desktop and narrow mobile layouts, live destination search, all six visible comparisons, keyboard operation, and the source warning.
