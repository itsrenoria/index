# Clearable Browse Filter and Hamburger Navigation Design

## Goal

Align the Browse access selector with the destination-search control, make the Passport Index brand return to the default page state, and place all section navigation behind one accessible hamburger menu.

## Browse Access Status

- Keep the existing three access groups: `Visa free`, `On arrival`, and `Visa needed`.
- Place the native select inside a bordered control shell matching the Destination selector's background, border, height, focus outline, clear affordance, and separated arrow area.
- Add an explicit clear button with accessible name `Clear access status`.
- The default state remains Albania + Visa free.
- Clearing sets the selected group to an empty string, keeps the selected passport, clears the rendered destination list, and shows `Choose an access status to view destinations.`
- The live region announces `Choose an access status for <passport>.` after clearing.
- Selecting a status after clearing restores the existing grouped list and count.
- Switching passports preserves either the selected group or the cleared state.

## Clickable Brand

- Convert the logo and `Passport Index` text into one anchor.
- Use `href="./"` so activation reloads the page without a section hash and restores the default state.
- Give the anchor the accessible name `Passport Index home` and preserve the current typography and logo treatment.
- Provide visible hover and keyboard-focus styling without changing header height.

## Hamburger Navigation

- Replace the always-visible Check / Reach / Compare / Browse row with one hamburger button at every viewport width.
- The button has `aria-expanded="false"`, `aria-controls="site-menu"`, and accessible name `Open page menu`.
- The menu is hidden by default and opens as a compact bordered editorial popover below the sticky header.
- On wide screens it aligns to the right edge of the content shell; on mobile it spans the available header width.
- Opening updates `aria-expanded` and the accessible name to `Close page menu`.
- Clicking the button toggles the menu.
- Clicking any section link closes the menu while allowing normal hash navigation.
- Escape closes the menu and returns focus to the toggle.
- Clicking or tapping outside the header closes the menu.
- Navigation links retain at least 44px touch height and visible focus styling.

## Technical Approach

- Keep all markup, CSS, data, and JavaScript in `index.html`.
- Reuse the existing `destination-control-shell` visual language rather than creating a second design system.
- Keep the native select for reliable keyboard and screen-reader behavior; do not build a custom combobox.
- Add small pure helpers where useful for testable empty-state markup, but avoid new abstractions beyond these interactions.

## Verification

- Add failing tests before each behavior change.
- Verify clear, reselection, passport persistence, brand URL, menu semantics, toggle behavior, link close, outside close, and Escape focus return.
- Run the complete Node test suite and `git diff --check`.
- Inspect the closed/open menu and Browse selector in Safari at 320px, 440px, and desktop width.
- Push to `origin/main`, verify the exact GitHub Pages workflow SHA, and confirm the public page contains the new controls.
