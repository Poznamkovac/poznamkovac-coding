import { computed, type ComputedRef } from "vue";
import type { RouteLocationNormalizedLoaded } from "vue-router";
import { getPathSegments } from "../utils/route";
import { titleCase } from "../utils";

interface Breadcrumb {
  text: string;
  path: string;
}

export function useBreadcrumbs(
  route: RouteLocationNormalizedLoaded,
  homeLabel: string,
  includeLast = false,
): ComputedRef<Breadcrumb[]> {
  return computed(() => {
    const crumbs: Breadcrumb[] = [{ text: homeLabel, path: "/" }];
    const segments = getPathSegments(route);
    const lang = route.params.lang as string;
    const limit = includeLast ? segments.length : segments.length - 1;

    let currentPath = "";
    for (let i = 0; i < limit; i++) {
      currentPath += `/${segments[i]}`;
      crumbs.push({
        text: titleCase(segments[i]),
        path: lang ? `/${lang}/challenges${currentPath}` : `/challenges${currentPath}`,
      });
    }

    return crumbs;
  });
}
