declare module "next-themes" {
  import type { ReactNode } from "react";

  export type Theme = "light" | "dark" | string;

  export interface ThemeProviderProps {
    attribute?: string;
    defaultTheme?: Theme;
    enableSystem?: boolean;
    disableTransitionOnChange?: boolean;
    themes?: Theme[];
    children: ReactNode;
  }

  export const ThemeProvider: (props: ThemeProviderProps) => JSX.Element;

  export function useTheme(): {
    theme?: Theme;
    resolvedTheme?: Theme;
    setTheme: (theme: Theme) => void;
    themes: Theme[];
  };
}

declare module "@supabase/supabase-js" {
  export interface SupabaseQueryResponse<Row = unknown> {
    data: Row[] | null;
    error: Error | null;
  }

  export interface SupabaseSingleResponse<Row = unknown> {
    data: Row | null;
    error: Error | null;
  }

  export interface SupabaseQueryBuilder<Row = unknown> {
    select(columns?: string, options?: Record<string, unknown>): SupabaseQueryBuilder<Row>;
    insert(
      values: Partial<Row> | Partial<Row>[],
      options?: Record<string, unknown>,
    ): SupabaseQueryBuilder<Row>;
    upsert(
      values: Partial<Row> | Partial<Row>[],
      options?: Record<string, unknown>,
    ): SupabaseQueryBuilder<Row>;
    update(values: Partial<Row>, options?: Record<string, unknown>): SupabaseQueryBuilder<Row>;
    delete(options?: Record<string, unknown>): SupabaseQueryBuilder<Row>;
    order(
      column: string,
      options?: { ascending?: boolean; nullsFirst?: boolean; foreignTable?: string },
    ): SupabaseQueryBuilder<Row>;
    eq(column: string, value: unknown): SupabaseQueryBuilder<Row>;
    in(column: string, values: unknown[]): SupabaseQueryBuilder<Row>;
    limit(count: number): SupabaseQueryBuilder<Row>;
    maybeSingle(): Promise<SupabaseSingleResponse<Row>>;
    single(): Promise<SupabaseSingleResponse<Row>>;
    then<TResult1 = SupabaseQueryResponse<Row>, TResult2 = never>(
      onfulfilled?:
        | ((value: SupabaseQueryResponse<Row>) => TResult1 | PromiseLike<TResult1>)
        | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ): Promise<TResult1 | TResult2>;
    catch<TResult = never>(
      onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
    ): Promise<SupabaseQueryResponse<Row> | TResult>;
    finally(onfinally?: (() => void) | null): Promise<SupabaseQueryResponse<Row>>;
  }

  export interface SupabaseAuthSession {
    user: { id: string };
  }

  export interface SupabaseAuthClient {
    getSession(): Promise<{ data: { session: SupabaseAuthSession | null }; error: Error | null }>;
    getUser(): Promise<{ data: { user: SupabaseAuthSession["user"] | null }; error: Error | null }>;
    signInWithOtp(
      options: Record<string, unknown>,
    ): Promise<{ data: unknown; error: Error | null }>;
    signInWithOAuth(
      options: Record<string, unknown>,
    ): Promise<{ data: { url?: string } | null; error: Error | null }>;
    signOut(): Promise<{ error: Error | null }>;
    exchangeCodeForSession(code: string): Promise<{ data: unknown; error: Error | null }>;
  }

  type TablesMap<Database> = Database extends { public: { Tables: infer T } } ? T : never;
  type FunctionsMap<Database> = Database extends { public: { Functions: infer F } } ? F : never;
  type TableRow<Database, TableName extends string> = TableName extends keyof TablesMap<Database>
    ? TablesMap<Database>[TableName] extends { Row: infer Row }
      ? Row
      : never
    : never;
  type FunctionArgs<Database, FnName extends string> = FnName extends keyof FunctionsMap<Database>
    ? FunctionsMap<Database>[FnName] extends { Args: infer Args }
      ? Args
      : Record<string, unknown>
    : Record<string, unknown>;
  type FunctionReturns<
    Database,
    FnName extends string,
  > = FnName extends keyof FunctionsMap<Database>
    ? FunctionsMap<Database>[FnName] extends { Returns: infer Returns }
      ? Returns
      : unknown
    : unknown;

  export interface SupabaseClient<Database = unknown> {
    from<TableName extends keyof TablesMap<Database> & string>(
      table: TableName,
    ): SupabaseQueryBuilder<TableRow<Database, TableName>>;
    rpc<FnName extends keyof FunctionsMap<Database> & string>(
      fn: FnName,
      params?: FunctionArgs<Database, FnName>,
    ): Promise<{ data: FunctionReturns<Database, FnName>; error: Error | null }>;
    auth: SupabaseAuthClient;
  }

  export function createClient<Database = unknown>(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>,
  ): SupabaseClient<Database>;
}

declare module "@supabase/ssr" {
  import type { SupabaseClient } from "@supabase/supabase-js";

  export interface CookieOptions {
    name?: string;
    value?: string;
    domain?: string;
    path?: string;
    expires?: Date;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: boolean | "lax" | "strict" | "none";
    maxAge?: number;
  }

  export function createServerClient<Database = unknown>(
    supabaseUrl: string,
    supabaseKey: string,
    options: {
      cookies: {
        getAll(): { name: string; value: string }[];
        setAll?(cookiesToSet: { name: string; value: string; options: CookieOptions }[]): void;
      };
    },
  ): SupabaseClient<Database>;
}
