import Link from "next/link";
import type { Metadata } from "next";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { MagicLinkForm } from "@/app/auth/_components/magic-link-form";
import { GoogleOAuthButton } from "@/app/auth/_components/google-oauth-button";
import { signUpWithEmail } from "@/app/auth/actions";

export const metadata: Metadata = {
  title: "Регистрация — Link Vault",
};

export default function SignUpPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold">Создать аккаунт Link Vault</h1>
        <p className="text-sm text-muted-foreground">
          После подтверждения ссылки мы настроим ваш профиль и перенаправим в рабочее пространство.
        </p>
      </header>

      <MagicLinkForm
        action={signUpWithEmail}
        submitLabel="Получить ссылку для регистрации"
        pendingLabel="Отправляем..."
        description="Используйте рабочий или личный e-mail. Magic link активен в течение 5 минут."
      />

      <div className="flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-muted-foreground">
        <span className="h-px flex-1 bg-border" aria-hidden />
        или
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>

      <GoogleOAuthButton label="Продолжить с Google" />

      <p className="text-center text-sm text-muted-foreground">
        Уже зарегистрированы?{" "}
        <Link href="/auth/sign-in" className={cn(buttonVariants({ variant: "link" }))}>
          Войти
        </Link>
      </p>
    </div>
  );
}
