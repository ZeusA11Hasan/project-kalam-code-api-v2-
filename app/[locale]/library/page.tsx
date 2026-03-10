import { redirect } from "next/navigation"

export default function LibraryPage({
  params: { locale }
}: {
  params: { locale: string }
}) {
  redirect(`/${locale}#library`)
}
