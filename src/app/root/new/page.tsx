import Link from "next/link";
import { ArrowLeftIcon } from "@phosphor-icons/react/ssr";
import { requireSuperuser } from "@/lib/tenancy";
import { SchoolForm } from "../school-form";

export const metadata = { title: "Add a school" };

export default async function NewSchoolPage() {
  await requireSuperuser();

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Link
        href="/root"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fg-muted hover:text-fg"
      >
        <ArrowLeftIcon weight="bold" className="size-4" />
        All schools
      </Link>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">Add a school</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Creating a school does not give it anybody to run it. Invite an administrator afterwards — that
          is the next screen.
        </p>
      </div>

      <SchoolForm />
    </div>
  );
}
