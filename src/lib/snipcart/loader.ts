/**
 * Snipcart v3.4+ loader script builder.
 *
 * Generates the `window.SnipcartSettings` config and the official
 * IIFE loader script that Snipcart documents at:
 *   https://docs.snipcart.com/v3/setup/installation
 *
 * The IIFE must be copied verbatim — all customization goes through
 * `window.SnipcartSettings`. This helper builds that config and
 * injects it into a single `<script>` tag string that the
 * Snipcart.astro component drops into `<head>`.
 */

export interface SnipcartLoaderConfig {
  publicApiKey: string;
  /** Pin a Snipcart version (recommended when using CSS overrides). */
  version?: string;
  /** Default currency. Defaults to "usd". */
  currency?: string;
  /** Cart modal style: "side" (drawer) or full-page (omit). */
  modalStyle?: "side";
  /** "none" = don't auto-open cart when product is added. */
  addProductBehavior?: "none";
  /** "on-user-interaction" (deferred), "manual", or immediate (omit). */
  loadStrategy?: "on-user-interaction" | "manual";
}

/**
 * Returns the complete inline `<script>` tag content (everything
 * between the tags) for the Snipcart v3.4+ loader.
 *
 * Usage in Snipcart.astro:
 *   const scriptContent = buildLoaderScript({ publicApiKey, ... });
 *   // then: <script is:inline set:html={scriptContent} />
 */
export function buildLoaderScript(config: SnipcartLoaderConfig): string {
  const settings: Record<string, unknown> = {
    publicApiKey: config.publicApiKey,
    version: config.version ?? "3.7.2",
    currency: config.currency ?? "usd",
    loadStrategy: config.loadStrategy ?? "on-user-interaction",
  };

  if (config.modalStyle) settings.modalStyle = config.modalStyle;
  if (config.addProductBehavior) settings.addProductBehavior = config.addProductBehavior;

  // The IIFE below is copied verbatim from Snipcart's official installation
  // docs (docs.snipcart.com/v3/setup/installation). One known fix applied:
  // the original uses `src[src^=...]` (matches any element with a `src`
  // attr) instead of `script[src^=...]` — corrected per community reports.
  const iife = `(()=>{var a,d;(d=(a=window.SnipcartSettings).version)!=null||(a.version="3.0");var s,S;(S=(s=window.SnipcartSettings).currency)!=null||(s.currency="usd");var l,p;(p=(l=window.SnipcartSettings).timeoutDuration)!=null||(l.timeoutDuration=2750);var w,u;(u=(w=window.SnipcartSettings).domain)!=null||(w.domain="cdn.snipcart.com");var m,g;(g=(m=window.SnipcartSettings).protocol)!=null||(m.protocol="https\");var y=window.SnipcartSettings.version.includes("v3.0.0-ci")||window.SnipcartSettings.version!="3.0"&&window.SnipcartSettings.version.localeCompare("3.4.0",void 0,{numeric:!0,sensitivity:"base"})===-1,f=["focus","mouseover","touchmove","scroll","keydown"];window.LoadSnipcart=o;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",r):r();function r(){window.SnipcartSettings.loadStrategy?window.SnipcartSettings.loadStrategy==="on-user-interaction"&&(f.forEach(t=>document.addEventListener(t,o)),setTimeout(o,window.SnipcartSettings.timeoutDuration)):o()}var c=!1;function o(){if(c)return;c=!0;let t=document.getElementsByTagName("head")[0],e=document.querySelector("#snipcart"),i=document.querySelector('script[src^="'+window.SnipcartSettings.protocol+"://"+window.SnipcartSettings.domain+'"][src$="snipcart.js"]'),n=document.querySelector('link[href^="'+window.SnipcartSettings.protocol+"://"+window.SnipcartSettings.domain+'"][href$="snipcart.css"]');e||(e=document.createElement("div"),e.id="snipcart",e.setAttribute("hidden","true"),document.body.appendChild(e)),h(e),i||(i=document.createElement("script"),i.src=window.SnipcartSettings.protocol+"://"+window.SnipcartSettings.domain+"/themes/v"+window.SnipcartSettings.version+"/default/snipcart.js",i.async=!0,t.appendChild(i)),n||(n=document.createElement("link"),n.rel="stylesheet",n.type="text/css",n.href=window.SnipcartSettings.protocol+"://"+window.SnipcartSettings.domain+"/themes/v"+window.SnipcartSettings.version+"/default/snipcart.css",t.prepend(n)),f.forEach(v=>document.removeEventListener(v,o))}function h(t){!y||(t.dataset.apiKey=window.SnipcartSettings.publicApiKey,window.SnipcartSettings.addProductBehavior&&(t.dataset.configAddProductBehavior=window.SnipcartSettings.addProductBehavior),window.SnipcartSettings.modalStyle&&(t.dataset.configModalStyle=window.SnipcartSettings.modalStyle),window.SnipcartSettings.currency&&(t.dataset.currency=window.SnipcartSettings.currency),window.SnipcartSettings.templatesUrl&&(t.dataset.templatesUrl=window.SnipcartSettings.templatesUrl))}})();`;

  return `window.SnipcartSettings=${JSON.stringify(settings)};${iife}`;
}