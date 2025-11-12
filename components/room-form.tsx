"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRoom, updateRoom, type RoomInput } from "@/actions/rooms";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, X } from "lucide-react";

const roomFormSchema = z.object({
  name: z
    .string()
    .min(1, "Room name is required")
    .max(50, "Room name must be at most 50 characters"),
  building: z
    .string()
    .min(1, "Building is required")
    .max(100, "Building must be at most 100 characters"),
  capacity: z.coerce
    .number()
    .int("Capacity must be an integer")
    .min(1, "Capacity must be at least 1")
    .max(1000, "Capacity must be at most 1000"),
  type: z
    .string()
    .min(1, "Room type is required")
    .max(50, "Room type must be at most 50 characters"),
});

type RoomFormData = z.infer<typeof roomFormSchema>;

interface RoomFormProps {
  room?: {
    id: number;
    name: string;
    building: string;
    capacity: number;
    type: string;
    equipment: any;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ROOM_TYPES = [
  "LECTURE_HALL",
  "LAB",
  "SEMINAR",
  "AUDITORIUM",
  "CLASSROOM",
  "COMPUTER_LAB",
  "WORKSHOP",
];

const EQUIPMENT_OPTIONS = [
  "PROJECTOR",
  "WHITEBOARD",
  "COMPUTERS",
  "SMARTBOARD",
  "AUDIO_SYSTEM",
  "VIDEO_CONFERENCING",
  "LAB_EQUIPMENT",
  "DRAWING_TABLES",
];

export function RoomForm({ room, onSuccess, onCancel }: RoomFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [equipment, setEquipment] = useState<string[]>(
    room?.equipment ? (Array.isArray(room.equipment) ? room.equipment : []) : []
  );
  const [customEquipment, setCustomEquipment] = useState("");
  const { toast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoomFormData>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: room
      ? {
          name: room.name,
          building: room.building,
          capacity: room.capacity,
          type: room.type,
        }
      : {
          capacity: 30,
          type: "CLASSROOM",
        },
  });

  const roomType = watch("type");

  const toggleEquipment = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item]
    );
  };

  const addCustomEquipment = () => {
    if (customEquipment.trim() && !equipment.includes(customEquipment.trim())) {
      setEquipment((prev) => [...prev, customEquipment.trim()]);
      setCustomEquipment("");
    }
  };

  const removeEquipment = (item: string) => {
    setEquipment((prev) => prev.filter((e) => e !== item));
  };

  const onSubmit = async (data: RoomFormData) => {
    setIsSubmitting(true);

    try {
      const input: RoomInput = {
        name: data.name,
        building: data.building,
        capacity: data.capacity,
        type: data.type,
        equipment,
      };

      const result = room
        ? await updateRoom({ id: room.id, ...input })
        : await createRoom(input);

      if (result.success) {
        toast({
          title: "Success",
          description: room
            ? "Room updated successfully"
            : "Room created successfully",
        });
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/admin/rooms");
        }
      } else {
        toast({
          title: "Error",
          description: result.error || "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Room Name *</Label>
        <Input
          id="name"
          {...register("name")}
          placeholder="A101"
          disabled={isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="building">Building *</Label>
        <Input
          id="building"
          {...register("building")}
          placeholder="Engineering Building"
          disabled={isSubmitting}
        />
        {errors.building && (
          <p className="text-sm text-red-600">{errors.building.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity">Capacity *</Label>
          <Input
            id="capacity"
            type="number"
            {...register("capacity")}
            placeholder="30"
            disabled={isSubmitting}
          />
          {errors.capacity && (
            <p className="text-sm text-red-600">{errors.capacity.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Room Type *</Label>
          <Select
            value={roomType}
            onValueChange={(value) => setValue("type", value)}
            disabled={isSubmitting}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select room type" />
            </SelectTrigger>
            <SelectContent>
              {ROOM_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Equipment</Label>
        <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-2">
            {EQUIPMENT_OPTIONS.map((item) => (
              <label
                key={item}
                className="flex items-center space-x-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={equipment.includes(item)}
                  onChange={() => toggleEquipment(item)}
                  disabled={isSubmitting}
                  className="rounded border-gray-300"
                />
                <span className="text-sm">{item.replace(/_/g, " ")}</span>
              </label>
            ))}
          </div>

          <div className="pt-2 border-t">
            <Label className="text-sm">Add Custom Equipment</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={customEquipment}
                onChange={(e) => setCustomEquipment(e.target.value)}
                placeholder="Enter custom equipment"
                disabled={isSubmitting}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomEquipment();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCustomEquipment}
                disabled={isSubmitting || !customEquipment.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {equipment.length > 0 && (
            <div className="pt-2">
              <Label className="text-sm">Selected Equipment:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {equipment.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-1 bg-white px-2 py-1 rounded border text-sm"
                  >
                    <span>{item.replace(/_/g, " ")}</span>
                    <button
                      type="button"
                      onClick={() => removeEquipment(item)}
                      disabled={isSubmitting}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {room ? "Update Room" : "Create Room"}
        </Button>
      </div>
    </form>
  );
}
