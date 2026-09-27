import { getSettings } from "@/lib/data";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsForm } from "@/components/admin/settings-form";

export const metadata = { title: "Platform settings" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader title="Platform settings" description="Fees, limits, withdrawal lock period and funding instructions." />
      <SettingsForm settings={settings} />
    </>
  );
}
