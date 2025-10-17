import type { RouteLocationNormalizedLoaded } from "vue-router";

export function getPathSegments(route: RouteLocationNormalizedLoaded): string[] {
  const match = route.params.pathMatch;
  return (Array.isArray(match) ? match.join("/") : match || "").split("/").filter(Boolean);
}

export function getChallengeId(route: RouteLocationNormalizedLoaded): string {
  const segments = getPathSegments(route);
  return segments[segments.length - 1] || "";
}

export function getCoursePath(route: RouteLocationNormalizedLoaded): string {
  const segments = getPathSegments(route);
  return segments.slice(0, -1).join("/");
}
