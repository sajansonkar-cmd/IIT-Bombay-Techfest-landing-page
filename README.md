# IIT Bombay Techfest Landing Page

A premium static landing page concept for IIT Bombay Techfest themed around Cybernetic Human Evolution.

## Structure

```text
.
├── assets
│   └── models
│       └── README.md
├── index.html
├── README.md
└── src
    ├── css
    │   └── styles.css
    └── js
        ├── main.js
        ├── pageMotion.js
        ├── scanner.js
        └── hero
            ├── HolographicHero.js
            ├── config.js
            ├── cyborgModel.js
            ├── holograms.js
            ├── particles.js
            └── rings.js
```

## Run

Serve the folder with any static server, then open the local URL. Native ES modules are used, so direct `file://` loading may be blocked by some browsers.

The page uses CDN builds of Three.js, GLTFLoader, and GSAP. The Three.js hero is split into local ES modules for scene orchestration, the GLB cyborg model, particles, scanner rings, and holographic circles.

Place the production cyborg model at `assets/models/cyborg.glb`.

## Sections

- Hero
- About
- Features
- Timeline
- Products
- Compatibility Scanner
- Footer
