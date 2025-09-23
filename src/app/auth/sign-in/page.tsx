import Link from "next/link";
import type { Metadata } from "next";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MagicLinkForm } from "@/app/auth/_components/magic-link-form";
import { GoogleOAuthButton } from "@/app/auth/_components/google-oauth-button";
import { signInWithEmail } from "@/app/auth/actions";

const ERROR_MESSAGES: Record<string, string> = {
  google: "Не удалось начать авторизацию через Google. Попробуйте снова.",
};

export const metadata: Metadata = {
  title: "Вход — Link Vault",
};

export default function SignInPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const errorKey = typeof searchParams?.error === "string" ? searchParams.error : undefined;
  const errorMessage = errorKey ? ERROR_MESSAGES[errorKey] ?? "Не удалось выполнить авторизацию." : undefined;

  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Добро пожаловать в Link Vault</h1>
        <p className="text-sm text-muted-foreground">
          Войдите по magic link или через Google, чтобы продолжить работу с вашими ссылками.
        </p>
      </header>

      {errorMessage ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}

      <MagicLinkForm
        action={signInWithEmail}
        submitLabel="Получить magic link"
        pendingLabel="Отправляем..."
        description="Мы отправим письмо со ссылкой для входа. Сессия сохранится на этом устройстве."
      />

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" aria-hidden />
        или
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>

      <GoogleOAuthButton label="Войти через Google" />

      <p className="text-center text-sm text-muted-foreground">
        Нет аккаунта?{" "}
        <Link href="/auth/sign-up" className={cn(buttonVariants({ variant: "link" }))}>
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
