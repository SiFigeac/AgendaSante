import { create } from "zustand";
import { persist } from "zustand/middleware";

// Définition des permissions disponibles
export const PERMISSION_LABELS = {
  users: "Gestion des utilisateurs",
  roles: "Gestion des rôles",
  appointments: "Gestion des rendez-vous",
  reports: "Accès aux rapports",
} as const;

export type Permission = keyof typeof PERMISSION_LABELS;

// Permissions par défaut pour chaque rôle
const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: ["users", "roles", "appointments", "reports"],
  staff: ["appointments"],
  doctor: ["appointments", "reports"]
};

type PermissionStore = {
  rolePermissions: Record<string, Permission[]>;
  setRolePermissions: (roleName: string, permissions: Permission[]) => void;
  hasPermission: (roleName: string, permission: Permission) => boolean;
};

export const usePermissionStore = create<PermissionStore>()(
  persist(
    (set, get) => ({
      rolePermissions: DEFAULT_ROLE_PERMISSIONS,

      setRolePermissions: (roleName: string, permissions: Permission[]) =>
        set((state) => ({
          rolePermissions: {
            ...state.rolePermissions,
            [roleName]: permissions
          }
        })),

      hasPermission: (roleName: string, permission: Permission) => {
        const permissions = get().rolePermissions[roleName];
        return permissions?.includes(permission) || false;
      }
    }),
    {
      name: "permission-storage",
      version: 1
    }
  )
);