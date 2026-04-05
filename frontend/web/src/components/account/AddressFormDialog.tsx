import { useState, useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

import provincesData from "@/data/provinces.json";

const addressSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, "Họ tên người nhận phải có ít nhất 2 ký tự"),
  phone: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, "Số điện thoại không hợp lệ"),
  street: z.string().min(5, "Vui lòng nhập chi tiết số nhà, tên đường"),
  ward: z.string().min(2, "Vui lòng chọn Phường/Xã"),
  district: z.string().min(2, "Vui lòng chọn Quận/Huyện"),
  province: z.string().min(2, "Vui lòng chọn Tỉnh/Thành phố"),
  isDefault: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressSchema>;

interface AddressFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AddressFormValues) => void;
  initialData?: AddressFormValues | null;
}

export function AddressFormDialog({
  isOpen,
  onClose,
  onSave,
  initialData,
}: AddressFormDialogProps) {
  const [openProvince, setOpenProvince] = useState(false);
  const [openDistrict, setOpenDistrict] = useState(false);
  const [openWard, setOpenWard] = useState(false);

  const form = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      name: "",
      phone: "",
      street: "",
      ward: "",
      district: "",
      province: "",
      isDefault: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        form.reset(initialData);
      } else {
        form.reset({
          name: form.getValues("name") || "", // Keep the auto-filled values if no initialData
          phone: form.getValues("phone") || "",
          street: "",
          ward: "",
          district: "",
          province: "",
          isDefault: false,
        });
      }
    }
  }, [isOpen, initialData, form]);

  const onSubmit = (values: AddressFormValues) => {
    onSave(values);
  };

  // Derived location data based on current selections
  const currentProvinceName = useWatch({
    control: form.control,
    name: "province",
  });
  const currentDistrictName = useWatch({
    control: form.control,
    name: "district",
  });

  const selectedProvince = (provincesData as any[]).find(
    (p) => p.name === currentProvinceName
  );
  
  const availableDistricts = selectedProvince?.districts || [];
  
  const selectedDistrict = availableDistricts.find(
    (d: any) => d.name === currentDistrictName
  );
  
  const availableWards = selectedDistrict?.wards || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData?.id ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 px-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Họ tên người nhận <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Vd: Nguyễn Văn A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số điện thoại <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Vd: 0912345678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="province"
                render={({ field }) => (
                  <FormItem className="flex flex-col mt-2">
                    <FormLabel>Tỉnh/Thành phố <span className="text-destructive">*</span></FormLabel>
                    <Popover open={openProvince} onOpenChange={setOpenProvince} modal={true}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value || "Chọn Tỉnh/Thành phố"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Tìm Tỉnh/Thành phố..." />
                          <CommandList>
                            <CommandEmpty>Không tìm thấy.</CommandEmpty>
                            <CommandGroup>
                              {(provincesData as any[]).map((province) => (
                                <CommandItem
                                  value={province.name}
                                  key={province.code}
                                  onSelect={(value) => {
                                    // cmdk passes back lowecased value, so we find the original name
                                    const originalName = (provincesData as any[]).find(p => p.name.toLowerCase() === value)?.name || province.name;
                                    form.setValue("province", originalName, { shouldValidate: true });
                                    // Reset dependent fields
                                    form.setValue("district", "");
                                    form.setValue("ward", "");
                                    setOpenProvince(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      province.name === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {province.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="district"
                render={({ field }) => (
                  <FormItem className="flex flex-col mt-2">
                    <FormLabel>Quận/Huyện <span className="text-destructive">*</span></FormLabel>
                    <Popover open={openDistrict} onOpenChange={setOpenDistrict} modal={true}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={!currentProvinceName}
                            className={cn(
                              "w-full justify-between font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value || "Chọn Quận/Huyện"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Tìm Quận/Huyện..." />
                          <CommandList>
                            <CommandEmpty>Không tìm thấy.</CommandEmpty>
                            <CommandGroup>
                              {availableDistricts.map((district: any) => (
                                <CommandItem
                                  value={district.name}
                                  key={district.code}
                                  onSelect={(value) => {
                                    const originalName = availableDistricts.find((d: any) => d.name.toLowerCase() === value)?.name || district.name;
                                    form.setValue("district", originalName, { shouldValidate: true });
                                    // Reset dependent field
                                    form.setValue("ward", "");
                                    setOpenDistrict(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      district.name === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {district.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ward"
              render={({ field }) => (
                <FormItem className="flex flex-col mt-2">
                  <FormLabel>Phường/Xã <span className="text-destructive">*</span></FormLabel>
                  <Popover open={openWard} onOpenChange={setOpenWard} modal={true}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          disabled={!currentDistrictName}
                          className={cn(
                            "w-full justify-between font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value || "Chọn Phường/Xã"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Tìm Phường/Xã..." />
                        <CommandList>
                          <CommandEmpty>Không tìm thấy.</CommandEmpty>
                          <CommandGroup>
                            {availableWards.map((ward: any) => (
                              <CommandItem
                                value={ward.name}
                                key={ward.code}
                                onSelect={(value) => {
                                  const originalName = availableWards.find((w: any) => w.name.toLowerCase() === value)?.name || ward.name;
                                  form.setValue("ward", originalName, { shouldValidate: true });
                                  setOpenWard(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    ward.name === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {ward.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ cụ thể <span className="text-destructive">*</span></FormLabel>
                  <FormControl>
                    <Input placeholder="Vd: Số 12, Ngõ 34, Phố X" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isDefault"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Đặt làm địa chỉ mặc định
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button type="submit">
                Hoàn thành
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
