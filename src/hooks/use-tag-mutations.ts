"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { deleteTag, updateTag } from "@/lib/tags/mutations";
import type { DeleteTagInput, UpdateTagInput } from "@/lib/tags/schema";

function invalidateTagData(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["tags"], exact: false });
  queryClient.invalidateQueries({ queryKey: ["links"], exact: false });
}

export function useUpdateTagMutation() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateTagInput) => updateTag(supabase, input),
    onSuccess: () => {
      invalidateTagData(queryClient);
    },
  });
}

export function useDeleteTagMutation() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteTagInput) => deleteTag(supabase, input),
    onSuccess: () => {
      invalidateTagData(queryClient);
    },
  });
}
