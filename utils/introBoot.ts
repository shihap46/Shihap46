// No "use client": the root layout (a server component) inlines the script below.

export const INTRO_KEY = "shihap_intro_v1";
export const INTRO_PENDING_CLASS = "intro-pending";

/* Runs before the first paint. The cinematic itself only mounts after hydration and a
   chunk download, so without this the home page is visible first and the intro lands on
   top of it a moment later. Same rule as introPending(): home page, first time this
   session, motion allowed — then the page stays behind a black cover until the intro
   takes over. */
export const INTRO_BOOT_SCRIPT = `(function(){try{
if(location.pathname!=="/")return;
if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;
var seen=false;
try{seen=sessionStorage.getItem("${INTRO_KEY}")==="1"}catch(e){}
if(!seen)document.documentElement.classList.add("${INTRO_PENDING_CLASS}");
}catch(e){}})();`;
