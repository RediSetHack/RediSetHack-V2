import { AdminDashboard } from "@/components/admin/dashboard";
import { getTodayEvent } from "@/lib/api-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default async function AdminDashboardPage() {
  // Today's Event is auto-generated and public; the catalog counts come from
  // the dashboard's own catalog load so the tiles match their listings.
  const event = await getTodayEvent(API_URL).catch(() => null);

  return <AdminDashboard event={event} eventError={event === null} />;
}
