# Integrated Destination Dropdown Design

## Goal

Keep the existing destination typing experience while adding an integrated dropdown that can select any of the 199 destinations.

## Interface

The destination search remains one bordered control. It contains:

- the existing search input for free typing and partial matching;
- a compact chevron button on the right;
- one accessible listbox anchored directly below the full control;
- a minimum 44-pixel interactive target for the button.

Typing and browsing use the same visible list so suggestions always appear in one place.

## Behavior

- The initial destination remains Viet Nam.
- Typing continues to update the four-passport result through the existing partial-match lookup.
- Typing filters the shared listbox in place.
- Opening the chevron shows all 199 destinations in the same listbox.
- Clicking a destination fills the field with its exact name and immediately updates the result.
- Arrow keys move through listbox options; Enter selects and Escape closes.

## Layout

The search input and chevron share one visual shell. The input fills the available width and the chevron occupies a compact right-hand area separated by a vertical rule. The listbox matches the shell width, stays scrollable within the viewport, and uses the existing paper, ink, serif, and focus treatment on mobile and desktop.

## Testing and Verification

- Add pure filtering and options-markup helpers.
- Verify partial typing remains supported.
- Verify the listbox contains all 199 destinations when browsing.
- Verify selecting a destination updates the search value and result through Safari interaction testing.
- Run the complete Node test suite and check desktop and 440-pixel Safari layouts before committing and pushing.

## Constraints

- Keep the page self-contained with no new dependencies or external resources.
- Preserve all current data, comparison behavior, source labels, and passport browser behavior.
- Do not alter the published Passport Index values or access classification.
