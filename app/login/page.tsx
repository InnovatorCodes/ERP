import LoginForm from "@/components/auth/login-form";

const ERROR_MESSAGES: Record<string, string> = {
  no_access: "Your account doesn't have a role yet. Ask an admin to set one up for you.",
  profile_unavailable: "You're signed in, but your profile couldn't be loaded. Please try again, or ask an admin to check the server logs.",
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
