# Project N1 Airsoft

Redesign of [n1airsoft.com](https://www.n1airsoft.com/) for Project N1, an indoor CQB airsoft arena at 12440 Exline St, El Monte, CA.

## Structure

- `index.html` is a single-scroll site with these sections: hero with radar scope, admission & hours, rentals, game modes (IDMS / Jungle Ball / Nerf tabs), memberships, private parties, rules & waiver, facility (pro shop, Sweatshop gym, Anchor Point Archery), origin story, contact + map, and footer.
- `assets/css/style.css` holds the design system: phosphor-green HUD tokens, night-vision photo treatment, topo-contour overlays, HUD corner-bracket panels, laser dividers, and responsive breakpoints.
- `assets/js/main.js` covers the boot sequence, canvas radar (sweep, contacts, bearing readout), hero laser crosshair, live open/closed status and today's-price highlight (Pacific time), text scramble, scroll reveals, tabs, mobile nav, and the contact form.
- `assets/img/` contains facility photos pulled from the current site, the N1 logo with its background removed, and `topo.png`, a generated seamless contour texture that is tinted in CSS through `mask-image`.
- `assets/docs/N1-Online-Waiver.doc` is the waiver from the current site.

All motion respects `prefers-reduced-motion`. The boot intro plays once per browser session.

## Notes

- Hours in `main.js` (`HOURS`) drive the nav status pill and the "Today" price tag. Update them there if hours change.
- The contact form has no backend. It opens the visitor's email app with a pre-filled message to ProjectN1.COI@Gmail.com.

## Running locally

No build step. Open `index.html` in a browser, or serve the folder:

```
python -m http.server 8080
```
