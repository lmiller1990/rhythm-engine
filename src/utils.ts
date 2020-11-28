export function prettyTimeElapsed(ms: number) {
  if (ms < 100) {
    return `0.0s`
  }

  return `${(ms / 1000).toFixed(1)}s`
}