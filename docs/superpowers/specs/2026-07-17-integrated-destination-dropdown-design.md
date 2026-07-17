# Integrated Destination Dropdown Design

## Goal

Keep the existing destination typing experience while adding an integrated dropdown that can select any of the 199 destinations.

## Interface

The destination search remains one bordered control. It contains:

- the existing search input for free typing and partial matching;
- a native select control on the right with a compact chevron presentation;
- an accessible label for each control;
- a minimum 44-pixel interactive target for the dropdown.

The native select keeps keyboard, touch, and screen-reader behavior reliable in Safari without adding a custom popup component.

## Behavior

- The initial destination remains Viet Nam in both controls.
- Typing continues to update the four-passport result through the existing partial-match lookup.
- Typing an exact destination synchronizes the dropdown to that destination.
- Typing a partial query or unmatched text leaves the dropdown at its neutral “Choose” option.
- Selecting a destination fills the typing field with the exact destination name and immediately updates the four-passport result.
- The existing datalist suggestions remain available while typing.

## Layout

The search input and dropdown share one visual shell. The input fills the available width and the dropdown occupies a compact right-hand area separated by a vertical rule. The control uses the existing paper, ink, serif, and focus treatment on mobile and desktop.

## Testing and Verification

- Add a pure synchronization helper that returns an exact destination name or an empty selection.
- Verify partial typing remains supported.
- Verify the select contains one neutral option plus all 199 destinations.
- Verify selecting a destination updates the search value and result through Safari interaction testing.
- Run the complete Node test suite and check desktop and 440-pixel Safari layouts before committing and pushing.

## Constraints

- Keep the page self-contained with no new dependencies or external resources.
- Preserve all current data, comparison behavior, source labels, and passport browser behavior.
- Do not alter the published Passport Index values or access classification.
