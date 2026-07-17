# Integrated Destination Dropdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an integrated destination browser inside the existing search control while preserving free typing and partial matching.

**Architecture:** Keep the page self-contained in `index.html`. Add pure filtering and listbox-markup helpers, then connect one accessible listbox to both free typing and the chevron button. Extend the Node VM suite and verify the interaction in Safari.

**Tech Stack:** Semantic HTML, embedded CSS, vanilla JavaScript, Node.js `node:test`, Safari Computer Use.

## Constraints

- Preserve all 199 destinations, passport data, comparisons, and access classifications.
- Keep typed filtering and full-list browsing in one panel directly beneath the field.
- Keep the chevron target at least 44 pixels tall.
- Support pointer selection, Arrow Up/Down, Enter, Escape, and screen-reader state.
- Add no dependencies or external resources.

## Task 1: Build the shared search listbox

**Files:** `index.html`, `tests/passport-dashboard.test.cjs`

- [x] Add failing tests for partial filtering, 199-option browsing, semantic combobox/listbox markup, and a 44-pixel trigger.
- [x] Add `filterDestinationOptions(data, query)` and `destinationOptionsMarkup(data)` as pure exported helpers.
- [x] Replace the native datalist/select experiment with one search field, chevron button, and anchored listbox.
- [x] Connect typing to filtered options and the chevron to all destinations.
- [x] Add pointer selection, click-away closing, and keyboard navigation.
- [x] Verify typing `azer` and selecting Azerbaijan in Safari at a 440-pixel viewport.

## Task 2: Apply the requested interface polish

**Files:** `index.html`, `tests/passport-dashboard.test.cjs`

- [x] Rename the document and masthead to Passport Index.
- [x] Remove the hero comparison-count kicker.
- [x] Move the free-entry/on-arrival notes below the destination results as an access legend.
- [x] Add a sticky, horizontally scrollable navigation bar for the four primary sections.
- [x] Add circular Unicode flag marks to Passport Reach cards without external assets.

## Task 3: Verify and publish

- [x] Run the complete Node test suite and `git diff --check`.
- [x] Verify the combined mobile layout and shared listbox in Safari.
- [ ] Request final read-only review and fix any Critical or Important findings test-first.
- [ ] Commit the source, tests, and aligned documentation.
- [ ] Fast-forward the feature branch into local `master`.
- [ ] Push local `master` to `origin/main` without force.
- [ ] Confirm GitHub Pages serves `<title>Passport Index</title>` from the pushed SHA.
