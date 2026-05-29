# Design Scale Guide
This project uses a single source of truth for scale and responsiveness: the original Figma frame size, scaled uniformly to the viewport.

## 1) Canonical design dimensions
- Base Figma width: `1920px`
- Base Figma height: use the source frame height for the page/section being implemented
- All component measurements from Figma (`x`, `y`, `width`, `height`, font size, radius, spacing) should be kept in design pixels

## 2) Scaling model (global)
- Keep a fixed-size design canvas in design pixels
- Scale the entire canvas with one transform:
  - `scale = viewportWidth / 1920`
- Apply:
  - `transform-origin: top left`
  - `transform: scale(var(--scale))`
- Wrap in a viewport container and set wrapper height to:
  - `scaledHeight = designHeight * scale`

This preserves pixel-perfect ratios and makes all components responsive automatically (both downscale and upscale).

## 3) Component implementation rules
When creating any new component from Figma:

1. Place it inside the same fixed design canvas coordinate system.
2. Use exact Figma px values for position and dimensions.
3. Keep typography values in px from Figma unless intentionally changed.
4. Use absolute positioning only when the Figma section is absolute in the source design.
5. Do not introduce per-component responsive breakpoints to “resize” component internals.
   - Responsiveness is handled by global canvas scaling.
6. Use `whitespace-nowrap` for nav/label text that must never wrap.
7. For hover/focus interactions, only add visual state changes (color, underline, subtle motion) that do not alter layout dimensions.

## 4) Asset handling
- Use the Figma-exported asset dimensions directly.
- Keep asset containers at exact Figma width/height.
- Prefer `bg-contain` for icon-like assets and `object-cover` for masked/photo assets as needed by design intent.

## 5) Do / Don’t
### Do
- Do keep all sections aligned to the same 1920px coordinate system.
- Do let one global scale drive responsiveness.
- Do verify no horizontal overflow at common widths.

### Don’t
- Don’t mix local `vw`/`%` font sizing with the fixed design pixel model.
- Don’t resize individual components independently at breakpoints unless a separate Figma variant exists.
- Don’t change component widths/heights on hover/focus.

## 6) QA checklist for every new component
- [ ] Matches Figma position and size at base width (1920)
- [ ] Scales proportionally at small viewport (375/390)
- [ ] Scales proportionally at tablet (768/1024)
- [ ] Scales proportionally at desktop/larger (1440/1920/2560+)
- [ ] No horizontal scrollbars introduced
- [ ] Required text does not wrap unexpectedly
- [ ] Hover/focus states render without layout shift

## 7) Quick implementation pattern
- Add component at design coordinates inside `.design-canvas`
- Reuse existing global scaling script and wrapper
- Validate at multiple viewport widths before moving to next section

