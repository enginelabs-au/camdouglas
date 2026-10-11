# Studio splat assets

Place the production capture here as `studio.spz`, or a streamed LoD file such as `studio.rad`.

Then set `sceneAsset.url` in `config/scene.ts` to `/scenes/studio.spz`.

Recommended workflow:

1. Capture the studio with overlapping stills or a supported Gaussian splat app.
2. Train or process the capture to a splat (Postshot, Brush, or an equivalent pipeline).
3. Open the result in [SuperSplat](https://superspl.at/editor).
4. Crop, remove floaters, and keep enough spatial information around each planned camera destination.
5. Export `.spz` for a compact local file, or a streamed `.rad` / SOG package for large environments.
6. Drop the file in this folder and retune `cameraDestinations` while viewing with `?debug=1`.
