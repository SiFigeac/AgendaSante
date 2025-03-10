import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = {
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
  color?: string | null;
};

const defaultRoles: Role[] = [
  {
    name: 'admin',
    displayName: 'Administrateur',
    description: 'Accès complet à toutes les fonctionnalités du système',
    permissions: ['users', 'roles', 'appointments', 'reports']
  },
  {
    name: 'doctor',
    displayName: 'Médecin',
    description: 'Médecin pouvant gérer ses rendez-vous et patients',
    permissions: ['appointments', 'reports'],
    color: '#4B5563'
  },
  {
    name: 'staff',
    displayName: 'Personnel',
    description: 'Personnel administratif avec accès limité',
    permissions: ['appointments']
  }
];

type RoleStore = {
  roles: Role[];
  addRole: (role: Role) => void;
  deleteRole: (roleName: string) => void;
  updateRole: (oldName: string, updatedRole: Partial<Role>) => void;
};

export const useRoleStore = create<RoleStore>()(
  persist(
    (set) => ({
      roles: defaultRoles,
      addRole: (role) =>
        set((state) => ({
          roles: [...state.roles, role],
        })),
      deleteRole: (roleName) =>
        set((state) => ({
          roles: state.roles.filter((role) => role.name !== roleName),
        })),
      updateRole: (oldName, updatedRole) =>
        set((state) => ({
          roles: state.roles.map((role) =>
            role.name === oldName
              ? {
                  ...role,
                  ...updatedRole,
                  // Assurer que les permissions restent un tableau
                  permissions: Array.isArray(updatedRole.permissions) 
                    ? updatedRole.permissions 
                    : role.permissions,
                  // Mettre à jour le displayName si le nom change
                  displayName: updatedRole.name || role.displayName,
                }
              : role
          ),
        })),
    }),
    {
      name: 'role-storage',
      version: 1,
    }
  )
);