"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth.store";
import { UserAPI } from "@/services/user.api";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const profileSchema = z.object({
  fullName: z.string().min(2, "Họ và tên ít nhất 2 ký tự"),
  phone: z.string().regex(/^0\d{9}$/, "Số điện thoại không hợp lệ").or(z.literal("")),
  email: z.string().email(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export function ProfileForm() {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);

  // Initialize with empty or default values
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
    },
  });

  const resetForm = useCallback(() => {
    form.reset({
      fullName: user?.name || "User",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  }, [user, form]);

  useEffect(() => {
    if (user) {
      resetForm();
    }
  }, [user, resetForm]);

  const handleCancel = () => {
    resetForm();
    setIsEditing(false);
  };

  async function onSubmit(data: ProfileFormValues) {
    setIsUpdating(true);
    try {
      await UserAPI.updateProfile({
        fullName: data.fullName,
        phone: data.phone || undefined,
      });

      // Update global store
      updateUser({
        name: data.fullName,
        phone: data.phone || undefined,
      });
      
      toast.success("Cập nhật thông tin thành công!");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi khi cập nhật!");
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="bg-background rounded-2xl border p-6 ring-1 ring-border/50">
      <h2 className="text-xl font-heading font-semibold mb-6">Thông tin cá nhân</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Họ và tên</FormLabel>
                <FormControl>
                  <Input {...field} disabled={!isEditing} placeholder="Ví dụ: Nguyễn Văn A" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} disabled className="bg-muted/50" />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-2">Email không thể thay đổi sau khi đăng ký.</p>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={!isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            {!isEditing ? (
              <Button type="button" onClick={() => setIsEditing(true)}>
                Chỉnh sửa
              </Button>
            ) : (
              <>
                <Button variant="outline" type="button" onClick={handleCancel} disabled={isUpdating}>
                  Hủy
                </Button>
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? "Đang lưu..." : "Lưu thay đổi"}
                </Button>
              </>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
