# Device Testing Checklist

## Phones
- [ ] iPhone 12/13/14 (Safari)
- [ ] iPhone SE (small screen)
- [ ] iPhone 14 Pro Max
- [ ] Android flagship (Chrome)
- [ ] Android mid-range (Chrome)
- [ ] Android low-end (Chrome)

## Tablets
- [ ] iPad Mini
- [ ] iPad 10 inch
- [ ] iPad Pro 12.9 inch

## Browser Matrix
- [ ] Safari (iOS)
- [ ] Chrome (iOS)
- [ ] Chrome (Android)
- [ ] Firefox (Android)

## On Each Device
1. Motion permission request works.
2. Canvas remains square and fills available area.
3. FPS is stable around `55-60` on default settings.
4. Bottom sheet open/close animation is smooth.
5. Settings apply immediately without restart.
6. No console/runtime errors.
7. Memory remains stable after 5 minutes.
8. Accelerometer response is smooth.
9. `32x32` does not severely stutter on capable devices.
10. Orientation changes resize canvas correctly.
