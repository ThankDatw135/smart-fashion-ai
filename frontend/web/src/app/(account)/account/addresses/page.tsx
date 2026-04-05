"use client";

import { useState, useEffect } from "react";
import { Plus, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddressCard } from "@/components/account/AddressCard";
import { AddressFormDialog, AddressFormValues } from "@/components/account/AddressFormDialog";
import { useAuthStore } from "@/stores/auth.store";
import { UserAPI } from "@/services/user.api";
import { toast } from "sonner";

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddressData, setEditingAddressData] = useState<AddressFormValues | null>(null);
  const { user } = useAuthStore();

  const loadAddresses = async () => {
    try {
      setIsLoading(true);
      const res = await UserAPI.getAddresses();
      const mapped = (res.data || []).map((apiAddr: any) => ({
        id: apiAddr.id,
        name: apiAddr.fullName,
        phone: apiAddr.phone,
        street: apiAddr.addressDetail,
        ward: apiAddr.ward,
        district: apiAddr.district,
        province: apiAddr.province,
        isDefault: apiAddr.isDefault
      }));
      setAddresses(mapped);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách địa chỉ");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const handleSetDefault = async (id: string) => {
    try {
      await UserAPI.setDefaultAddress(id);
      toast.success("Đã đặt làm địa chỉ mặc định");
      loadAddresses();
    } catch (e) {
      toast.error("Lỗi khi đặt địa chỉ mặc định");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (!confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) return;
      await UserAPI.deleteAddress(id);
      toast.success("Đã xóa địa chỉ");
      loadAddresses();
    } catch (e) {
      toast.error("Lỗi khi xóa địa chỉ");
    }
  };

  const handleEdit = (id: string) => {
    const addr = addresses.find(a => a.id === id);
    if (addr) {
      setEditingAddressData({
        id: addr.id,
        name: addr.name,
        phone: addr.phone,
        street: addr.street,
        ward: addr.ward,
        district: addr.district,
        province: addr.province,
        isDefault: addr.isDefault,
      });
      setIsDialogOpen(true);
    }
  };
  
  const handleAdd = () => {
    setEditingAddressData({
      id: undefined, // undefined ID means Add mode
      name: user?.name || "",
      phone: user?.phone || "",
      street: "",
      ward: "",
      district: "",
      province: "",
      isDefault: false,
    });
    setIsDialogOpen(true);
  };

  const handleSaveAddress = async (data: AddressFormValues) => {
    try {
      const payload = {
        fullName: data.name,
        phone: data.phone,
        province: data.province,
        district: data.district,
        ward: data.ward,
        addressDetail: data.street,
        isDefault: data.isDefault,
      };

      if (data.id) {
        await UserAPI.updateAddress(data.id, payload);
        toast.success("Đã cập nhật địa chỉ");
      } else {
        await UserAPI.addAddress(payload);
        toast.success("Thêm địa chỉ mới thành công");
      }
      setIsDialogOpen(false);
      loadAddresses();
    } catch (e) {
      console.error(e);
      toast.error("Đã xảy ra lỗi khi lưu địa chỉ");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold mb-1">Sổ địa chỉ</h1>
          <p className="text-sm text-muted-foreground">Quản lý địa chỉ nhận hàng của bạn để thanh toán nhanh hơn.</p>
        </div>
        <Button className="shrink-0 rounded-full shadow-sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm địa chỉ mới
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading ? (
          <div className="col-span-full py-16 flex justify-center items-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground opacity-50" />
          </div>
        ) : addresses.length > 0 ? (
          addresses.map((address) => (
            <AddressCard 
              key={address.id} 
              address={address} 
              onSetDefault={handleSetDefault}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center bg-muted/30 rounded-2xl border border-dashed">
            <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <MapPin className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-lg font-medium font-heading mb-2">Chưa có địa chỉ</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">Bạn chưa lưu địa chỉ nào. Hãy thêm địa chỉ để thanh toán đơn hàng dễ dàng và nhanh chóng hơn.</p>
            <Button onClick={handleAdd} variant="outline" className="rounded-full">
              <Plus className="w-4 h-4 mr-2" />
              Thêm địa chỉ mới
            </Button>
          </div>
        )}
      </div>

      <AddressFormDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveAddress}
        initialData={editingAddressData}
      />
    </div>
  );
}
