import type { ReactNode } from "react";

import { signOut } from "@/app/auth/actions";
import { Button, type ButtonProps } from "@/components/ui/button";

interface SignOutButtonProps extends ButtonProps {
  icon?: ReactNode;
}

export function SignOutButton({ icon, children = "Выйти", ...buttonProps }: SignOutButtonProps) {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" size="sm" {...buttonProps}>
        {icon ? <span className="mr-1 flex items-center">{icon}</span> : null}
        <span>{children}</span>
      </Button>
    </form>
  );
}
