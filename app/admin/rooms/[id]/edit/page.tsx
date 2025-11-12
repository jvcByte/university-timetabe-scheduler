import { requireAdmin } from "@/lib/auth-utils";
import { getRoomById } from "@/lib/rooms";
import { RoomForm } from "@/components/room-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditRoomPage({ params }: PageProps) {
  await requireAdmin();

  const { id } = await params;
  const room = await getRoomById(Number(id));

  if (!room) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href={`/admin/rooms/${room.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Room Details
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Room</h1>
          <RoomForm room={room} />
        </div>
      </div>
    </div>
  );
}
