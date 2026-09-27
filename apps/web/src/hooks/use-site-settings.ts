import { queryOptions, useQuery } from "@tanstack/react-query";
import { api, call } from "@/lib/api";

export const siteSettingsQuery = queryOptions({
  queryKey: ["public", "site-settings"] as const,
  queryFn: () => call(api.public["site-settings"].get()),
  staleTime: 5 * 60 * 1000,
});

export const useSiteSettings = () => useQuery(siteSettingsQuery);

export type SiteSettings = NonNullable<
  ReturnType<typeof useSiteSettings>["data"]
>;
