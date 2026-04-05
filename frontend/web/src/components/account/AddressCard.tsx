import { MapPin, Phone, Star, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  ward: string;
  district: string;
  province: string;
  isDefault: boolean;
}

interface AddressCardProps {
  address: Address;
  onSetDefault?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export function AddressCard({ address, onSetDefault, onDelete, onEdit }: AddressCardProps) {
  return (
    <div className={`p-5 rounded-2xl border transition-all ${address.isDefault ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'border-border bg-background'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-base">{address.name}</h3>
          {address.isDefault && (
            <Badge variant="default" className="rounded-full px-2 py-0 h-5 text-[10px]">
              Mặc định
            </Badge>
          )}
        </div>
        <div className="flex gap-1 md:gap-2">
          {!address.isDefault && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => onSetDefault?.(address.id)}>
              <Star className="w-4 h-4" />
              <span className="sr-only">Đặt mặc định</span>
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50" onClick={() => onEdit?.(address.id)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => onDelete?.(address.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Phone className="w-4 h-4 shrink-0" />
          <span>{address.phone}</span>
        </div>
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{`${address.street}, ${address.ward}, ${address.district}, ${address.province}`}</span>
        </div>
      </div>
    </div>
  );
}
