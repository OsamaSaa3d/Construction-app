import {
  Package,
  Gavel,
  ShoppingCart,
  Star,
  FileSpreadsheet,
  BarChart3,
  Zap,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  labelKey: string;
  href: string;
  icon: LucideIcon;
};

export const supplierNavItems: NavItem[] = [
  { labelKey: "supplier.inventory", href: "/supplier/inventory", icon: Package },
  { labelKey: "supplier.myBids", href: "/supplier/bids", icon: Gavel },
  { labelKey: "supplier.orders", href: "/supplier/orders", icon: ShoppingCart },
  { labelKey: "supplier.urgent", href: "/supplier/urgent", icon: Zap },
  { labelKey: "supplier.ratings", href: "/supplier/ratings", icon: Star },
];

export const contractorNavItems: NavItem[] = [
  { labelKey: "contractor.myBoqs", href: "/contractor/boq", icon: FileSpreadsheet },
  { labelKey: "contractor.bids", href: "/contractor/bids", icon: Gavel },
  { labelKey: "contractor.orders", href: "/contractor/orders", icon: ShoppingCart },
  { labelKey: "contractor.urgent", href: "/contractor/urgent", icon: Zap },
];

export const consultantNavItems: NavItem[] = [
  { labelKey: "consultant.myBoqs", href: "/consultant/boq", icon: FileSpreadsheet },
  { labelKey: "consultant.analysis", href: "/consultant/analysis", icon: BarChart3 },
];

export const customerNavItems: NavItem[] = [
  { labelKey: "customer.browse", href: "/customer/browse", icon: ShoppingBag },
  { labelKey: "customer.myOrders", href: "/customer/orders", icon: ShoppingCart },
];

export const roleNavMap: Record<string, NavItem[]> = {
  SUPPLIER: supplierNavItems,
  CONTRACTOR: contractorNavItems,
  CONSULTANT: consultantNavItems,
  CUSTOMER: customerNavItems,
};
