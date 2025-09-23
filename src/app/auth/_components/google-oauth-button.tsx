import { Button } from "@/components/ui/button";

import { signInWithGoogle } from "@/app/auth/actions";
import { DEFAULT_AUTH_REDIRECT_PATH } from "@/app/auth/shared";

interface GoogleOAuthButtonProps {
  redirectPath?: string;
  label?: string;
}

export function GoogleOAuthButton({
  redirectPath = DEFAULT_AUTH_REDIRECT_PATH,
  label = "Войти через Google",
}: GoogleOAuthButtonProps) {
  return (
    <form action={signInWithGoogle} className="w-full">
      <input type="hidden" name="redirect_to" value={redirectPath} />
      <Button type="submit" variant="outline" className="w-full">
        {label}
      </Button>
    </form>
  );
}
