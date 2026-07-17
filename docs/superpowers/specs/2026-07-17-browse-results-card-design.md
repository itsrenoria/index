# Browse Results Card Design

## Goal

Make Browse one passport follow the same visual structure as Direct comparisons: selectors sit directly on the page, while selected results appear in a separate, clearly defined card.

## Layout

- Remove the outer beige Browse panel that currently wraps both controls and results.
- Keep the Passport and Access Status selectors in the existing responsive selector grid directly below the section heading.
- Keep the initial prompt beneath the selectors when no passport is selected.
- Render the selected passport's results inside a standalone bordered card with the same paper background and shadow language as a Direct comparisons card.
- Preserve the current mobile-first selector stacking and desktop two-column selector layout.

## Results Header

The result card begins with a dedicated header containing:

- a small uppercase eyebrow reading `Passport access`;
- the selected passport name as the primary title, using the established serif display type;
- the filtered destination count as a separate compact metric.

The title must accommodate Albania, Greece, Germany, and United States without awkward clipping or crowding. On narrow screens, the count may move below the name while remaining visually separate.

## Behavior

- Initial Browse state remains selectors plus the existing prompt, with no result card.
- Choosing a passport still enables Access Status and immediately shows all 199 destinations.
- Access Status filtering and exact row badges remain unchanged.
- Clearing Access Status still returns to `ALL`.
- Clearing the passport still removes the result card, restores the prompt, resets Access Status to `ALL`, and disables it.

## Accessibility

- Preserve the existing live status announcement.
- Use a semantic heading for the selected passport inside the results card.
- Keep selector labels, keyboard behavior, focus restoration, and 44px touch targets unchanged.
- The visual result card itself must not receive an unnecessary live region because the separate status text already announces changes.

## Testing and Verification

- Add regression tests for the separate selectors/results structure and the new result-card header hierarchy.
- Confirm every passport name and representative filtered counts render correctly.
- Run the full Node test suite and whitespace checks.
- Verify the empty and selected states at mobile and desktop widths, including United States title wrapping and the absence of horizontal overflow.
