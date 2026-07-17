# Simplified Access Labels Design

## Goal

Replace umbrella access wording with short, direct entry-status labels across destination search, passport browsing, Passport Reach, the legend, and the mobile navigation.

## Entry status labels

Search results and Browse One Passport will use the source entry type directly:

- `home` → **Home country**
- `visa-free` → **Visa free**
- `eta` with an ETA source label → **ETA**
- `eta` with an eVisitor source label → **eVisitor**
- `registration` → **Entry form**
- `visa-on-arrival` → **On arrival**
- `evisa` → **eVisa**
- `visa-required` → **Visa needed**
- `not-admitted` → **Not admitted**

Positive and negative rank labels remain separate from the direct status badge. The comparison and ranking logic does not change.

## Passport Reach

The existing **Free / pre-cleared** metric becomes **Visa free**. Its count includes only entries whose type is `visa-free`; home-country, ETA/eVisitor, entry-form, and on-arrival entries are excluded from that metric. The positive-destination total remains unchanged.

## Legend

The legend keeps two compact rows:

- **Free entry** — “Visa-free, ETA or eVisitor.”
- **On arrival** — “May include a border fee.”

The wording is short enough to remain on one line where the viewport allows.

## Navigation

The four navigation labels become:

- **Check**
- **Reach**
- **Compare**
- **Browse**

The links retain their existing targets, focus treatment, sticky behavior, and 44-pixel touch height. The shorter labels should fit within a 440-pixel viewport without horizontal scrolling.

## Implementation

Replace the umbrella access-mode helper with a direct status helper shared by search and passport browsing. Group visual colors by convenience: home/visa-free/ETA/eVisitor/entry-form use green, on-arrival uses amber, and eVisa/visa-needed/not-admitted use red.

Update Passport Reach summarization to expose an exact `visaFree` count. Remove superseded `free-precleared` wording and styles.

## Verification

- Add failing tests for every direct status mapping and label.
- Verify all four home-country rows show **Home country** in search and passport browsing.
- Verify ETA and eVisitor, and eVisa and Visa needed, remain distinct.
- Verify Passport Reach counts only `visa-free` entries in its Visa Free metric.
- Verify the legend and navigation copy exactly match the approved wording.
- Run the complete Node test suite, whitespace checks, and Safari mobile review before publishing.
