import { TeamClient } from "./team-client";

export const dynamic = "force-dynamic";

export default function TeamPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Team</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Admins can add, remove, and rotate portfolio managers. Invites come
          out as copy-paste sign-in links — no email delivery required.
        </p>
      </div>
      <TeamClient />
    </div>
  );
}
