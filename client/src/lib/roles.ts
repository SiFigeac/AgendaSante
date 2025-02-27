import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = {
  name: string;
  displayName: string;
  description: string;
};

const defaultRoles: Role[] = [
  {
    name: 'admin',
    displayName: 'Administrateur',
    description: 'Accès complet à toutes les fonctionnalités du système',
  },
  {
    name: 'staff',
    displayName: 'Personnel',
    description: 'Personnel administratif avec accès limité',
  },
  {
    name: 'doctor',
    displayName: 'Médecin',
    description: 'Médecin pouvant gérer ses rendez-vous et patients',
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
