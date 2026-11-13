/** Smaller height differences come from URL-bar or orientation changes, not from a keyboard. */
const KEYBOARD_MIN_HEIGHT_PX = 100

type ViewportMetrics = {
  innerHeight: number
  viewportHeight: number
}

/** Height difference only, so iOS rubber-band overscroll (which moves `offsetTop`) never counts. */
export function isKeyboardOpen({
  innerHeight,
  viewportHeight,
}: ViewportMetrics): boolean {
  return innerHeight - viewportHeight > KEYBOARD_MIN_HEIGHT_PX
}
