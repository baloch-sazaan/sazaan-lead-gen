export function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Human-like reading delay
export function readingDelay() {
  return randomDelay(2500, 5500);
}

// Between page navigations
export function navigationDelay() {
  return randomDelay(3000, 7000);
}

// Inside a search results page (scrolling, etc.)
export function interactionDelay() {
  return randomDelay(800, 2200);
}
