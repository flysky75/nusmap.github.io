# LT37 supplied-plan trace

This updates only the separate `lt37-demo` path; the main map under `dist/` is unchanged.

Published demo: https://flysky75.github.io/nusmap.github.io/lt37-demo/?indoor=1&room=trace-0

Wall comparison: https://flysky75.github.io/nusmap.github.io/lt37-demo/compare.html

Walls are manually traced in the source image's pixel coordinates in dist/traced-plan.json. The outer stepped boundary, major partitions, door gaps, stair cores, lifts and escalator linework follow the user-supplied floorplan.png. trace-overlay.svg overlays the wall trace in red on the original image for comparison.

No dimensions or georeferencing were supplied: physical scale, alignment on the map, room labels and temperatures are illustrative. The single supplied drawing is reused for the demo floor levels and does not establish their actual layouts. Generic furniture is omitted to keep the traced partitions clear.

The edited renderer source is included in `engine-patches/NUSIndoor.ts`.
