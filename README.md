# owenchlee.me

My personal website, built as a small top-down pixel-art town. Tap anywhere to walk, and step into a house to see my projects, experience, hobbies or contact info. There's also a plain Quick View for anyone who just wants the facts, and phones land on it by default.

Built with React and Vite, deployed on Vercel.

## Running it

```sh
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm run lint     # oxlint
npm test         # vitest: world layout, content and badge checks
```

## Where things live

- `src/content.js` has all the text: intro, projects, experience, hobbies, contact. Edit this to change what the site says.
- `src/tileMap.js` builds the world: the path, houses, NPCs, ponds and trees.
- `src/App.jsx` runs the camera, walking and house transitions in one requestAnimationFrame loop.
- `src/GroundCanvas.jsx` paints the static ground in chunks around the camera.
- `src/achievements.js` and `src/Badges.jsx` handle the badges and the Trainer Card.
- `public/projects/` holds the demo clips, each with a `-poster.webp` still.

Sprite credits are in `ASSET_CREDITS.md`.
