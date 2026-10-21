import LoginForm from "@/components/auth/login-form";

const ERROR_MESSAGES: Record<string, string> = {
  no_access: "Your account doesn't have a role yet. Ask an admin to set one up for you.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { error } = await searchParams;
  const errorMessage = typeof error === "string" ? ERROR_MESSAGES[error] : undefined;

  return <LoginForm errorMessage={errorMessage} />;
}
