# Known Bugs & Issues

## Mobile UI Issues

### Legend Panel - Excessive Line Spacing (Mobile)
**Priority:** P2  
**Status:** Open  
**Reported:** 2026-03-08

**Description:**
On mobile, the Legend panel still has too much vertical spacing between items in the Transport Modes and Junctions sections, despite multiple attempts to reduce it.

**Expected Behavior:**
- Zero spacing between legend items (e.g., between "Walking" and "Battery Car")
- Items should be tightly packed with no gaps
- No paragraph-mode spacing

**Current Behavior:**
- Visible gaps remain between items
- More vertical space than desired
- Takes up too much screen real estate

**Attempted Fixes:**
- Set `gap: 0` on `.legend-items`
- Set `padding: 0` on `.legend-item`
- Set `line-height: 1`
- Added `margin: 0`
- Added explicit `<p>` tag reset

**Next Steps:**
- Investigate if there's inherited spacing from parent elements
- Check if icons/emojis are adding extra height
- Consider using negative margins if needed
- May need to inspect actual rendered HTML in browser DevTools

**Files Involved:**
- `public/css/app.css` (lines ~1700-1750, ~1998-2040)
- `index.html` (Legend panel section, lines ~246-292)

---

## Future Bugs
(Add new bugs below)

