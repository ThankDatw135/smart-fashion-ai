"use client";

import { useFormContext } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddressFormData } from "@/lib/validators";

// Dữ liệu mock hành chính (Sau này thay bằng DB/API)
const PROVINCES = [
  { id: "1", name: "Hà Nội" },
  { id: "79", name: "Hồ Chí Minh" },
];

const DISTRICTS: Record<string, { id: string; name: string }[]> = {
  "1": [
    { id: "1", name: "Quận Ba Đình" },
    { id: "2", name: "Quận Hoàn Kiếm" },
    { id: "3", name: "Quận Tây Hồ" },
  ],
  "79": [
    { id: "760", name: "Quận 1" },
    { id: "761", name: "Quận 12" },
    { id: "764", name: "Quận Gò Vấp" },
  ],
};

const WARDS: Record<string, { id: string; name: string }[]> = {
  "1": [{ id: "1", name: "Phường Phúc Xá" }],
  "2": [{ id: "5", name: "Phường Trúc Bạch" }],
  "760": [{ id: "111", name: "Phường Bến Nghé" }],
  "764": [{ id: "222", name: "Phường 5" }],
};

export function AddressForm() {
  const form = useFormContext<AddressFormData>();

  // Watch selected Province and District to cascade updates
  const selectedProvinceId = form.watch("provinceId");
  const selectedDistrictId = form.watch("districtId");

  const availableDistricts = selectedProvinceId ? DISTRICTS[selectedProvinceId] || [] : [];
  const availableWards = selectedDistrictId ? WARDS[selectedDistrictId] || [] : [];

  return (
    <div className="space-y-6 bg-background rounded-xl p-6 border ring-1 ring-border/50">
      <h3 className="text-lg font-heading font-semibold border-b pb-4">Địa chỉ giao hàng</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Người nhận */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Họ và tên người nhận</FormLabel>
              <FormControl>
                <Input placeholder="VD: Nguyễn Văn A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* SDT */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Số điện thoại</FormLabel>
              <FormControl>
                <Input placeholder="VD: 0912345678" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Tỉnh / Thành */}
        <FormField
          control={form.control}
          name="provinceId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tỉnh / Thành phố</FormLabel>
              <Select
                onValueChange={(val) => {
                  field.onChange(val);
                  form.setValue("districtId", ""); // Reset quận
                  form.setValue("wardCode", ""); // Reset phường
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn Tỉnh/Thành" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Quận Huyện */}
        <FormField
          control={form.control}
          name="districtId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quận / Huyện</FormLabel>
              <Select
                disabled={!selectedProvinceId}
                onValueChange={(val) => {
                  field.onChange(val);
                  form.setValue("wardCode", ""); // Reset phường
                }}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn Quận/Huyện" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableDistricts.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Phường xã */}
        <FormField
          control={form.control}
          name="wardCode"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Phường / Xã</FormLabel>
              <Select disabled={!selectedDistrictId} onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn Phường/Xã" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {availableWards.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Địa chỉ chi tiết */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Địa chỉ cụ thể (Số nhà, đường...)</FormLabel>
              <FormControl>
                <Input placeholder="Số nhà, Tên đường..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
