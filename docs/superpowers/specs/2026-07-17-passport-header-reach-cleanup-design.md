# Passport Header and Reach Cleanup Design

## Goal

Refine the Passport Index header, destination search, reach cards, and passport browser while preserving the page's compact editorial style and self-contained delivery.

## Header and Hero

- Replace the letter `P` mark with a minimalist passport logo generated through the image-generation workflow.
- Use a dark-ink passport silhouette with a restrained red accent, no text, no shadow, and a transparent background.
- Save the final transparent PNG in the project and embed it as a data URI in `index.html` so the page remains self-contained.
- Combine the brand and primary navigation into one sticky header row.
- Keep the logo, `PASSPORT INDEX`, and all four navigation labels visible on mobile without wrapping or horizontal scrolling.
- Keep the existing data stamp on wider screens only; it is secondary to brand and navigation on narrow screens.
- Restore the red hero descriptor as `PASSPORT ACCESS · COUNTRY BY COUNTRY` above the main heading.

## Destination Search

- Remove the access legend and its unused styles completely.
- When the selected destination is one of the four passport home countries, omit that matching passport from the result cards.
- Examples: Albania shows Greece, Germany, and United States; Greece shows Albania, Germany, and United States.
- Non-home destinations continue showing all four passports.
- Search result status and positive/negative ranking badges otherwise remain unchanged.

## Passport Reach

- Rename the primary card total to `Accessible abroad`.
- Exclude the passport's own home-country row from that total.
- In this compact summary only, `Visa free` combines entries whose source types are `visa-free`, `eta`, or `registration`.
- `On arrival` continues counting only `visa-on-arrival` entries.
- The displayed identity must hold for every passport:

  `Accessible abroad = Visa free + On arrival`

- Expected totals:

  | Passport | Visa free | On arrival | Accessible abroad |
  | --- | ---: | ---: | ---: |
  | Albania | 80 | 27 | 107 |
  | Greece | 131 | 29 | 160 |
  | Germany | 132 | 29 | 161 |
  | United States | 121 | 34 | 155 |

- Negative totals and the published Passport Index score remain visible as separate reference metrics.

## Passport Browser

- Remove the `Positive` and `Negative` ranking badges from Browse rows only.
- Keep the direct entry-status badge such as `Visa free`, `ETA`, `eVisitor`, `Entry form`, `On arrival`, `eVisa`, `Visa needed`, `Home country`, or `Not admitted`.
- Preserve the raw source label and full destination list.

## Responsive and Accessibility Requirements

- The unified header must fit at 320px and 440px viewport widths without horizontal page or navigation scrolling.
- Navigation links retain at least 44px touch height and visible keyboard focus.
- The generated logo is decorative because the adjacent `PASSPORT INDEX` text names the brand; use empty alternative text or `aria-hidden="true"`.
- Removing one home-passport result must not leave an unexplained blank grid cell.

## Verification

- Add failing tests before implementation for the restored descriptor, removed legend, home-passport omission, reconciled reach totals, and Browse badge simplification.
- Verify the complete automated suite and `git diff --check`.
- Inspect mobile and desktop layouts in Safari, including the 320px and 440px unified header.
- Confirm the deployed GitHub Pages build matches the pushed commit and contains the revised copy and behavior.
