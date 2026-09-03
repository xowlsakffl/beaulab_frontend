export function replaceCurrentPageUrl(url: string) {
  window.history.replaceState(null, "", url);
}
