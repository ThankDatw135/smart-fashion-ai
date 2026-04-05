export type Role = "admin" | "user" | "super_admin";

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: Role;
  status: "ACTIVE" | "BANNED";
  isVIP: boolean;
  createdAt: string;
}

// Extended profile with additional fields for account/profile page
export interface UserAddress {
  id: string;
  isDefault: boolean;
  name: string;
  phone: string;
  address: string;
  wardName: string;
  wardCode: string;
  districtName: string;
  districtId: string;
  provinceName: string;
  provinceId: string;
}

export interface UserProfile extends Omit<User, "isVIP" | "status"> {
  firstName?: string;
  lastName?: string;
  gender?: string;
  vipTier?: string;
  totalSpent?: number;
  points?: number;
  dateOfBirth?: string;
  addresses?: UserAddress[];
  updatedAt?: string;
}
