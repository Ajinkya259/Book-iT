import { requireVendor } from '@/lib/auth';
import { VendorDashboardClient } from './VendorDashboardClient';

export default async function VendorDashboardPage() {
  const { dbUser } = await requireVendor();
  const vendor = dbUser!.vendor!;

  return <VendorDashboardClient vendor={vendor} />;
}
