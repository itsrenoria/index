# Passport Comparison Final Polish Design

## Goal

Complete a final cleanup of the self-contained passport comparison page: remove dead code, strengthen visual hierarchy on desktop and mobile, simplify descriptive content, add a complete single-passport destination browser, and normalize spacing throughout the page.

## Ordered scope

The work follows this order:

1. Remove dead and redundant code.
2. Improve desktop and mobile UI hierarchy.
3. Simplify descriptive content.
4. Add the single-passport full-list feature.
5. Normalize empty space and component gaps.

## Code cleanup

Remove application functions, exports, CSS selectors, and tests that exist only for superseded behavior. In particular, audit the classification and winner helpers retained from earlier versions, unused accessibility utility CSS, unused pseudo-elements, duplicate selectors, and redundant declarations.

Keep the embedded 199-destination dataset, direct comparison engine, destination lookup, access summaries, access-mode annotations, escaping, and active render functions. Preserve the single-file offline deliverable and avoid new dependencies.

## Comparison-card hierarchy

All six direct comparison cards remain visible.

### Card header

Keep the two passport names and centered “vs” marker, but reduce unused vertical padding and maintain a strong dividing rule.

### Shared metrics

Replace the low-contrast shared-count strip with two clearly separated metric tiles:

- A green-accented tile for destinations positive on both passports.
- A neutral or red-accented tile for destinations negative on both passports.

Each tile uses a large number, a short plain label, stronger contrast, and enough internal padding to read as a summary rather than another destination row.

### Unique-passport sections

Make each “Passport only” block a distinct section header rather than plain text above the country list. The header includes:

- A small uppercase eyebrow such as “Unique access.”
- The passport name as the dominant heading.
- The destination count in a compact badge.

Use a subtly tinted background, border, or accent rule so the section boundary remains obvious while scrolling. Destination rows retain the exact two Passport Index labels and stay lengths.

On mobile, unique destination lists flow naturally without nested scrolling. On desktop, long lists may use the existing bounded scroll area.

## Content cleanup

Descriptions should state what the section contains, not explain the implementation or ranking logic.

Use straightforward copy:

- Hero description: “Search entry requirements and compare four passports across 199 destinations.”
- Destination search: “See the entry status for every passport.”
- Passport overview: “Access totals for each passport.”
- Direct comparisons: “Destinations available to only one of the two passports.”
- Passport browser: “View every destination for one passport.”

Keep a compact factual access note:

- “Visa-free and ETA/eVisitor access is normally free or pre-cleared.”
- “Visa on arrival may include a border fee.”

Retain the source date and official-rules warning. Do not include personal or family context.

## Single-passport browser

Add a final section after direct comparisons and before the source footer.

### Controls

Use four segmented passport buttons—Albania, Greece, Germany, and United States—rather than a native dropdown. The selected button is visually and programmatically indicated with `aria-pressed="true"`. Albania is selected initially.

### Results

Show all 199 destinations for the selected passport in alphabetical order. Each row contains:

- Destination name.
- Exact Passport Index status and stay length.
- Visible Positive or Negative rank.
- Practical annotation: Free/pre-cleared, On arrival, or Visa needed/restricted.

Desktop uses a compact table-like row layout with consistent columns. Mobile stacks the status information beneath the destination name. The list is not paginated or collapsed; changing the selected passport rerenders the same result area.

## Spacing and responsive behavior

Audit the complete page at narrow mobile and desktop widths.

- Reduce oversized gaps between the hero, search panel, passport overview, comparisons, passport browser, and footer.
- Use one consistent section spacing scale.
- Tighten comparison-card internal spacing without crowding text.
- Prevent accidental horizontal overflow.
- Keep touch controls at least 44 pixels tall.
- Maintain horizontally scrollable passport summary cards on mobile.
- Maintain two comparison columns on desktop and one on mobile.

## Accessibility

- Preserve semantic headings and one page-level `h1`.
- Keep the skip link and reduced-motion rule.
- Keep live search results announced without excessive rerender noise.
- Use real buttons for passport selection and visible focus styles.
- Preserve readable contrast for metric tiles, badges, and text.

## Verification

Automated tests will verify:

- Removed helpers and selectors no longer exist.
- All six direct comparisons still partition all 199 destinations correctly.
- Comparison markup contains distinct shared metrics and unique-passport section headers.
- Simplified copy is present and explanatory legacy copy is absent.
- The passport browser exposes four buttons, selects Albania initially, and renders 199 rows.
- Browser rows preserve exact raw labels, binary rank, and practical annotation.
- The page remains self-contained and mobile-first.

Safari verification will cover desktop and mobile spacing, comparison-card hierarchy, destination search, all passport-browser selections, keyboard focus, and horizontal overflow.
