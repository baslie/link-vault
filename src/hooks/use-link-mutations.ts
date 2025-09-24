"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  createLink,
  deleteLink,
  updateLink,
  type CreateLinkInput,
  type DeleteLinkInput,
  type UpdateLinkInput,
} from "@/lib/links/mutations";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function invalidateLinkData(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["links"], exact: false });
}

function invalidateTags(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["tags"], exact: false });
}

export function useCreateLinkMutation() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLinkInput) => createLink(supabase, input),
    onSuccess: () => {
      invalidateLinkData(queryClient);
      invalidateTags(queryClient);
    },
  });
}

export function useUpdateLinkMutation() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateLinkInput) => updateLink(supabase, input),
    onSuccess: () => {
      invalidateLinkData(queryClient);
      invalidateTags(queryClient);
    },
  });
}

export function useDeleteLinkMutation() {
  const supabase = getSupabaseBrowserClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: DeleteLinkInput) => deleteLink(supabase, input),
    onSuccess: () => {
      invalidateLinkData(queryClient);
      invalidateTags(queryClient);
    },
  });
}
