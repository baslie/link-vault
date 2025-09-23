import { Search } from "lucide-react";
import type { HTMLAttributes } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type GlobalSearchProps = HTMLAttributes<HTMLDivElement>;

export function GlobalSearch({ className, ...props }: GlobalSearchProps) {
  return (
    <div className={cn("w-full sm:max-w-xl", className)} {...props}>
      <label className="sr-only" htmlFor="global-search">
        Глобальный поиск по ссылкам
      </label>
      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          id="global-search"
          type="search"
          placeholder="Поиск по ссылкам (в разработке)"
          readOnly
          aria-disabled="true"
          title="Поиск появится после реализации API."
          className="cursor-not-allowed border-dashed pl-10 pr-4 text-muted-foreground"
          aria-describedby="global-search-helper"
        />
      </div>
      <p id="global-search-helper" className="mt-1 text-xs text-muted-foreground">
        Возможность искать появится после запуска API и индексов.
      </p>
    </div>
  );
}
