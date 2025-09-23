import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" size="sm">
        Выйти
      </Button>
    </form>
  );
}
