import { notFound, redirect } from "next/navigation";

import MissionDetailView from "@/components/mission-detail-view";
import { getCurrentUser } from "@/lib/auth";
import { getMissionById } from "@/server/services/mission-service";

type MissionDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MissionDetailsPage({ params }: MissionDetailsPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;
  const result = await getMissionById(user.id, id);

  if (result.error || !result.data) {
    notFound();
  }

  const mission = result.data;

  return <MissionDetailView mission={mission} userEmail={user.email} />;
}
