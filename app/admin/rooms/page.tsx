import { requireAdmin } from "@/lib/auth-utils";
import { getRooms, getRoomTypes } from "@/lib/rooms";
import { RoomsTable } from "@/components/rooms-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    type?: string;
  }>;
}

export default async function RoomsPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const type = params.type;

  const [{ rooms, pagination }, roomTypes] = await Promise.all([
    getRooms({ page, search, type }),
    getRoomTypes(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rooms</h1>
          <p className="text-gray-600 mt-1">
            Manage classrooms, labs, and other facilities
          </p>
        </div>
        <Link href="/admin/rooms/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Room
          </Button>
        </Link>
      </div>

      <RoomsTable
        rooms={rooms}
        pagination={pagination}
        roomTypes={roomTypes}
        currentSearch={search}
        currentType={type}
      />
    </div>
  );
}
