# Flux Profiling Checklist

## Performance Tab
1. Record 5 seconds of active simulation.
2. Confirm frame time remains below `16ms`.
3. Check long tasks; they should be minimal and infrequent.
4. Confirm no sustained main-thread blocking.

## Memory Tab
1. Capture baseline heap snapshot.
2. Run simulation for 2 minutes.
3. Capture second snapshot.
4. Compare retained size and detached nodes for leaks.

## Network and Bundle
1. Confirm production bundle remains compact.
2. Check there is no request waterfall on startup.
3. Ensure manifest and static assets are cacheable.

## Lighthouse
- Performance target: `90+`
- Accessibility target: `90+`
- PWA checks pass with HTTPS deployment
