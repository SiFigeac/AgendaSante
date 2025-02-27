import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Permission = {
  name: string;
  enabled: boolean;
  displayName: string;
  description: string;
};

const defaultPermissions: Permission[] = [
  {
    name: 'users',
    displayName: 'Gestion des utilisateurs',
    description: 'Permet de gérer les utilisateurs du système',
    enabled: false
  },
  {
    name: 'roles',
    displayName: 'Gestion des rôles',
    description: 'Permet de gérer les rôles et leurs accès',
    enabled: false
  },
  {
    name: 'appointments',
    displayName: 'Gestion des rendez-vous',
    description: 'Permet de gérer les rendez-vous',
    enabled: false
  },
  {
    name: 'reports',
    displayName: 'Accès aux rapports',
    description: 'Permet d\'accéder aux rapports et statistiques',
    enabled: false
  }
];

type PermissionStore = {
  permissions: Permission[];
  togglePermission: (name: string) => void;
  resetPermissions: () => void;
};

export const usePermissionStore = create<PermissionStore>()(
  persist(
    (set) => ({
      permissions: defaultPermissions,
      togglePermission: (name) =>
        set((state) => ({
          permissions: state.permissions.map((permission) =>
            permission.name === name
              ? { ...permission, enabled: !permission.enabled }
              : permission
          ),
        })),
      resetPermissions: () => set({ permissions: defaultPermissions }),
    }),
    {
      name: 'permission-storage',
      version: 1,
    }
  )
);
