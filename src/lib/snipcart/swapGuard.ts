/**
 * Root cause (found by isolated live testing, not inferred — see
 * specs/001-snipcart-double-add/research.md): touching Snipcart's own
 * injected `<script src="snipcart.js">` tag during an Astro ClientRouter
 * swap — removing and re-appending it, or even relocating it with the
 * non-disconnecting `moveBefore()` API — makes Snipcart's vendor bundle
 * construct a second internal SDK instance and bind a second document-level
 * add-to-cart click listener. This reproduces regardless of whether
 * `#snipcart` itself is protected from the swap; the console warning
 * "The #snipcart div was removed from the document" fires in both the
 * broken and the fixed configurations, so it is not a reliable signal of
 * the actual cause.
 *
 * The old version of this file speculated the opposite (that protecting
 * `#snipcart` from removal/reparenting was the fix, and that native
 * `transition:persist` "wasn't enough"). That was disproven: reading
 * Astro's own swap-functions.js source shows `transition:persist` moves a
 * marked element with `moveBefore()` when the browser supports it (a
 * genuinely non-disconnecting move) — and the isolated tests below prove
 * `#snipcart`'s own handling was never the problem.
 *
 * The fix: let Astro's *native* `swapBodyElement` handle `#snipcart` via
 * the real `transition:persist` directive (set directly in Layout.astro's
 * markup) instead of hand-rolling a body diff. The only thing this file
 * still needs to do by hand is keep Snipcart's runtime-injected
 * `<link rel="stylesheet" href="snipcart.css">` alive across the swap —
 * unlike the `<script>` tag, removing that `<link>` immediately unloads
 * the styles (a real visual regression), and unlike the `<script>` tag,
 * protecting it does not trigger the double-SDK-construction bug (isolated
 * and confirmed empirically). The `<script>` tag itself is deliberately
 * left unprotected: letting Astro's native head diff delete it after the
 * first navigation is harmless, since its work (constructing
 * `window.Snipcart`, binding `document`'s click listener) already
 * happened and JS side effects don't undo when their originating `<script>`
 * node is later removed from the DOM, and `window.LoadSnipcart`'s own
 * re-entrancy guard (plus this project's `window.__snipcartLoadTriggered`
 * guard in Layout.astro) prevents it from ever being recreated.
 */
import { swapFunctions } from 'astro:transitions/client';

const SNIPCART_CSS_SELECTOR = 'link[href*="snipcart.css"]';

export function installSnipcartSwapGuard(): void {
  document.addEventListener('astro:before-swap', (event) => {
    event.swap = () => {
      const snipcartCssLink = document.head.querySelector(SNIPCART_CSS_SELECTOR);
      if (snipcartCssLink) snipcartCssLink.remove();

      swapFunctions.deselectScripts(event.newDocument);
      swapFunctions.swapRootAttributes(event.newDocument);
      swapFunctions.swapHeadElements(event.newDocument);
      const restoreFocus = swapFunctions.saveFocus();

      if (snipcartCssLink) document.head.appendChild(snipcartCssLink);

      swapFunctions.swapBodyElement(event.newDocument.body, document.body);

      restoreFocus();
    };
  });
}
