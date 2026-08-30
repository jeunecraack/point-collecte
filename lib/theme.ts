/**
 * Thème : clair par défaut, sombre sur demande, mémorisé dans localStorage.
 * Un script inline de quelques octets, exécuté avant le premier rendu (pas de flash),
 * puis un second qui branche les boutons — aucun bundle, les pages wilaya restent sans JavaScript.
 */
export const SCRIPT_THEME_TETE =
  '(function(){try{if(localStorage.getItem("theme")==="dark")document.documentElement.setAttribute("data-theme","dark")}catch(e){}})();';

export const SCRIPT_THEME_BOUTON =
  '(function(){var b=document.querySelectorAll("[data-theme-toggle]");function maj(){var d=document.documentElement.getAttribute("data-theme")==="dark";b.forEach(function(x){x.textContent=d?x.getAttribute("data-clair"):x.getAttribute("data-sombre");x.setAttribute("aria-pressed",d)})}b.forEach(function(x){x.addEventListener("click",function(){var d=document.documentElement.getAttribute("data-theme")==="dark";if(d)document.documentElement.removeAttribute("data-theme");else document.documentElement.setAttribute("data-theme","dark");try{localStorage.setItem("theme",d?"light":"dark")}catch(e){}maj()})});maj()})();';
