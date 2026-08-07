import { getExternalDataStatus } from "@/lib/travel-data";

export async function GET() {
  return Response.json(getExternalDataStatus());
}
