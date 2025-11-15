"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { register } from "@/actions/auth";
import { registerSchema, type RegisterInput } from "@/lib/validation";
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

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      role: "STUDENT",
    },
  });

  const role = watch("role");

  const onSubmit = async (data: RegisterInput) => {
    setError("");
    setIsLoading(true);

    try {
      const result = await register(data);

      if (result.success) {
        router.push("/login?registered=true");
      } else {
        setError(result.error || "Registration failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          {...registerField("name")}
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...registerField("email")}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...registerField("password")}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-red-600">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          value={role}
          onValueChange={(value) =>
            setValue("role", value as "ADMIN" | "FACULTY" | "STUDENT")
          }
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="STUDENT">Student</SelectItem>
            <SelectItem value="FACULTY">Faculty</SelectItem>
            <SelectItem value="ADMIN">Administrator</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-red-600">{errors.role.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
