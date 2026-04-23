import { TeamClient } from "./team-client";

export const dynamic = "force-dynamic";

export default function TeamPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Team</h1>
      </div>
      <TeamClient />
    </div>
  );
}
