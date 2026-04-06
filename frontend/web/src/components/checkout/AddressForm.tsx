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

import { useEffect, useState } from "react";

// Types for Location API
interface Ward {
  name: string;
  code: number;
}

interface District {
  name: string;
  code: number;
  wards: Ward[];
}

interface Province {
  name: string;
  code: number;
  districts: District[];
}

export function AddressForm() {
  const form = useFormContext<AddressFormData>();
  const [locations, setLocations] = useState<Province[]>([]);

  useEffect(() => {
    fetch("/locations.json")
      .then((res) => res.json())
      .then((data) => setLocations(data))
      .catch((err) => console.error("Failed to fetch locations", err));
  }, []);

  // Watch selected Province and District to cascade updates
  const selectedProvinceId = form.watch("provinceId");
  const selectedDistrictId = form.watch("districtId");

  const provincesList = locations.map((p) => ({ id: String(p.code), name: p.name }));
  
  const selectedProvince = locations.find((p) => String(p.code) === selectedProvinceId);
  const availableDistricts = selectedProvince
    ? selectedProvince.districts.map((d) => ({ id: String(d.code), name: d.name }))
    : [];

  const selectedDistrict = selectedProvince?.districts.find(
    (d) => String(d.code) === selectedDistrictId
  );
  const availableWards = selectedDistrict
    ? selectedDistrict.wards.map((w) => ({ id: String(w.code), name: w.name }))
    : [];

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
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn Tỉnh/Thành" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {provincesList.map((p) => (
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
