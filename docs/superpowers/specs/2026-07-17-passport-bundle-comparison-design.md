# Passport Bundle Comparison Design

## Purpose

Refocus the passport dashboard around an Albanian passport baseline and a small set of practical passport-bundle scenarios. The primary question is no longer which individual passport has the strongest fine-grained entry rule; it is what positive access each added passport contributes, what the existing passport or bundle covers without it, and what gaps remain after combining passports.

## Simplified Access Model

Classify every source entry into one of two comparison weights.

### Positive access

- Home country
- Visa-free
- Visa on arrival
- ETA or eVisitor
- Lightweight pre-arrival or arrival registration, including arrival cards, tourist cards, tourist registration, e-tickets, and equivalent pre-enrollment labels

All positive labels have equal comparison weight. Permitted stay length is displayed but never changes an outcome.

### Negative access

- eVisa
- Visa required
- Not admitted
- Unknown or unrecognized source labels

All negative labels have equal comparison weight. The original Passport Index label remains visible so users can distinguish eVisa from a traditional visa requirement even though both are negative in this dashboard's decision model.

## Passport and Bundle Metrics

Each individual passport card shows:

- **Positive access:** the number of destinations classified positive by this dashboard.
- **Passport Index score:** the source's published mobility score, shown as a smaller reference metric.
- **Negative access:** the number of destinations classified negative by this dashboard.

Each passport bundle uses the best available passport per destination. A bundle is positive when at least one passport in it is positive and negative only when every passport in it is negative. Bundle metrics are calculated from that union.

## Comparison Semantics

Every scenario compares a left-hand passport or bundle with a right-hand passport or bundle and divides all destinations into four exhaustive groups:

1. **Right adds:** right is positive and left is negative.
2. **Left keeps:** left is positive and right is negative.
3. **Both cover:** both are positive.
4. **Neither covers:** both are negative.

For an upgrade scenario, the combined portfolio is also shown. Adding a passport cannot reduce the portfolio's access. “Right adds” is therefore the upgrade gain, while “Left keeps” explains what the original passport or bundle contributes that the newly added passport does not provide on its own.

Every destination retains its exact Passport Index labels and stay lengths in the detailed lists.

## Scenarios

Present these scenarios in a deliberate order:

### Upgrade paths

1. Albania → Albania + Greece
2. Albania + Greece → Albania + Greece + United States
3. Albania → Albania + United States

### Bundle comparisons

4. Albania + Greece vs Albania + United States
5. Albania + Greece + United States vs Albania + United States
6. Albania + United States vs Albania + Germany
7. Albania + Greece vs Albania + Germany
8. Albania + Greece + United States vs Albania + Germany

The interface must describe bundles and scenarios generically and must not mention family relationships, future citizenship plans, or other personal context.

## Mobile-First Information Architecture

### Header and passport cards

Use a compact header with a short explanation of the binary access model. Follow it with four horizontally scrollable passport cards on narrow screens and a four-column grid on wide screens. Cards prioritize positive access and retain the published Passport Index score as secondary context.

### Scenario navigation

Place a native select control near the top for direct scenario selection. Below it, show one featured scenario at a time on mobile to keep the page focused. On wider screens, retain the same single-scenario structure rather than expanding into a dense dashboard.

### Featured scenario card

The card contains:

- Clear left and right bundle names.
- Positive-access counts for each side.
- Combined positive-access count for upgrade scenarios.
- Four compact outcome counts: right adds, left keeps, both cover, neither covers.
- Separate right-adds and left-keeps destination previews.
- Expandable full lists for all four outcome groups.
- Source labels and stay lengths within destination details.

### Secondary destination explorer

Replace the large always-visible matrix with a collapsed “Inspect any destination” section. When expanded, it offers destination search and a compact per-passport result for one destination. It is supporting evidence rather than the primary workflow.

## Visual Direction

Keep the archival travel-document character but simplify the composition:

- Fewer simultaneous panels and decorative elements.
- Strong typographic hierarchy and generous spacing.
- Warm paper, dark ink, and one red accent.
- Compact monochrome passport seals rather than four competing accent systems.
- Native-feeling controls with large mobile touch targets.
- No large data table in the default view.

The design starts at a 360-pixel viewport and progressively enhances for tablets and desktop. Respect reduced motion and never use color alone for access status or outcome groups.

## Technical Architecture

- Continue delivering one self-contained `index.html` with embedded CSS, JavaScript, and the retrieved 199-destination dataset.
- Keep pure functions for entry weighting, bundle access, scenario comparison, summary calculation, and destination lookup.
- Generate passport cards and all scenario counts from the same normalized dataset.
- Preserve the existing offline and no-dependency requirements.
- Keep functions available through `globalThis.PassportDashboard` for Node VM tests.

## Verification

- Prove every positive label compares equally regardless of stay length.
- Prove eVisa, visa required, and not admitted compare equally as negative.
- Prove bundle access is the union of its passports and adding a passport never reduces positive access.
- Prove each scenario partitions all 199 destinations exactly once across the four outcome groups.
- Prove passport-card positive and negative counts reconcile to 199.
- Test all eight scenario definitions and selector behavior.
- Test destination lookup and exact source-label display.
- Verify mobile layout, keyboard operation, focus visibility, reduced motion, offline loading, and source attribution in Safari.

