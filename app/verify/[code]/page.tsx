import { redirect } from "next/navigation";

export default async function VerificationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/verify?id=${code.toUpperCase()}`);
}
