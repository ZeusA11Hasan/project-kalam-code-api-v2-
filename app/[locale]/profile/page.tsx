import { redirect } from "next/navigation"

export default function ProfilePage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  redirect(`/${locale}#profile`)
}
