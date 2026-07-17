# Selector-driven comparison and Browse design

Date: 17 July 2026

## Goal

Replace the always-visible comparison collection and Browse passport buttons with compact selector-driven views. Both sections should initially show controls only, use the same visual language as the Destination control, and render information only after the required passport selection.

## Shared selector pattern

Passport and Access Status fields use one reusable custom selector pattern derived from Check a Destination:

- The same bordered card background, field height, typography, focus outline, dropdown arrow, and separated clear action.
- A visible label above each field.
- A button-like combobox surface with `aria-expanded`, `aria-controls`, and the selected value.
- A positioned listbox directly below the field.
- Pointer selection plus Arrow Up, Arrow Down, Enter, and Escape support.
- Outside-pointer and focus-leave dismissal.
- A 44px minimum target for the field, arrow, clear action, and options.
- A short placeholder when no value is selected.

The selectors share behavior and styling rather than duplicating separate comparison and Browse implementations.

## Direct comparisons

### Initial state

The section shows two empty selectors:

1. First passport
2. Second passport

The results area contains a concise prompt and no comparison card.

### Selection behavior

- Selecting the first passport preserves the empty second selector.
- The first passport is unavailable in the second selector so a passport cannot be compared with itself.
- A comparison card renders only when two different passports have been selected.
- Changing either selection immediately renders the corresponding comparison.
- Clearing either selection hides the comparison and restores the prompt.
- When the first passport changes to the passport already selected second, the second selection is cleared.

### Results

The existing comparison calculation and card design remain unchanged. Only one comparison card is mounted at a time. The six static cards are not rendered on page load.

## Browse one passport

### Initial state

The section shows:

- An empty Passport selector.
- A disabled Access Status selector showing `ALL`.
- A concise prompt and no destination rows.

### Passport selection

Choosing a passport:

- Enables Access Status.
- Keeps Access Status at `ALL` for the first selection.
- Immediately renders all 199 destinations for that passport.
- Shows each destination's exact direct status, including Home country and Not admitted.

Changing the passport preserves the current Access Status filter. Clearing the passport hides the list, disables Access Status, and resets it to `ALL`.

### Access Status options

The selector contains four options:

- `ALL`: every destination, including Home country and Not admitted.
- `VISA FREE`: Visa free, ETA, eVisitor, and Entry form.
- `ON ARRIVAL`: Visa on arrival.
- `VISA NEEDED`: eVisa and Visa needed.

The table continues to display exact source-derived status badges and text. Grouping affects filtering only.

The clear action on Access Status returns the filter to `ALL`; it does not clear the passport.

## Responsive layout

- Mobile-first controls stack vertically and span the section width.
- At wider widths, Direct comparisons places its two passport selectors side by side.
- At wider widths, Browse places Passport and Access Status side by side.
- Dropdowns align with their fields and remain within the viewport.
- Results follow the existing card and table breakpoints.

## Empty and invalid states

- Direct comparisons: `Choose two passports to compare.`
- Browse: `Choose a passport to view destinations.`
- Same-passport comparison is prevented in the second selector rather than rendered as an error.
- No placeholder card, zero-count table, or unused results frame is shown before valid selections exist.

## Accessibility

- Every selector has a visible label and an accessible combobox name.
- Listboxes expose option selection and disabled states.
- Keyboard navigation follows the existing Destination listbox behavior.
- Escape closes the active selector and returns focus to its trigger.
- Live regions announce comparison changes, Browse counts, filter changes, and cleared states.
- Disabled Access Status is exposed with the native disabled state on its trigger.

## Data and rendering boundaries

- Keep `comparePassports`, `comparisonCardMarkup`, `filterPassportDestinations`, and `passportBrowserMarkup` as the rendering and data helpers.
- Extend Browse filtering so `all` returns the complete dataset.
- Track comparison selections independently from Browse selections.
- Use a reusable selector initializer for DOM state, options, clear behavior, and keyboard handling.
- Render only into the existing `#direct-comparisons` and `#passport-browser-results` hosts.

## Verification

Automated tests cover:

- Empty initial comparison and Browse states.
- Shared selector markup, listbox semantics, clear actions, and 44px targets.
- Distinct passport enforcement and second-selection reset.
- Rendering exactly one comparison card for two valid selections.
- Browse ALL returning 199 exact-status rows.
- Existing grouped Browse filters and counts.
- Passport clearing, status reset, and disabled state.
- Keyboard and dismissal event wiring.
- Mobile stacking and desktop two-column layouts.

Manual responsive verification covers desktop and a 390px mobile viewport, including selecting, changing, clearing, keyboard navigation, and overflow.

## Scope

This change does not alter Passport Index data, access weighting, comparison calculations, Passport reach cards, Check a Destination, or the overall editorial visual direction.
