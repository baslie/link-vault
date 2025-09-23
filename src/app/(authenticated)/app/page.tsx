import { LinksWorkspace } from "@/components/links/links-workspace";
import { DEFAULT_LINKS_FILTERS, searchLinks } from "@/lib/links/query";
import { getSupabaseServerComponentClient } from "@/lib/supabase/server";
import { fetchTagsForUser } from "@/lib/tags/server";

export default async function WorkspacePage() {
  const supabase = getSupabaseServerComponentClient();
  const initialFilters = { ...DEFAULT_LINKS_FILTERS };

  const [initialLinks, initialTags] = await Promise.all([
    searchLinks(supabase, initialFilters),
    fetchTagsForUser(supabase),
  ]);

  return (
    <LinksWorkspace
      initialFilters={initialFilters}
      initialLinks={initialLinks}
      initialTags={initialTags}
    />
  );
}
