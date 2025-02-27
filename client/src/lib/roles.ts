import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = {
  name: string;
  displayName: string;
  description: string;
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageAppointments: boolean;
  canViewReports: boolean;
};

const defaultRoles: Role[] = [
  {
    name: 'doctor',
    displayName: 'Médecin',
    description: 'Médecin pouvant gérer ses rendez-vous et patients',
    canManageUsers: false,
    canManageRoles: false,
    canManageAppointments: true,
    canViewReports: true,
  },
  {
    name: 'staff',
    displayName: 'Personnel',
    description: 'Personnel administratif avec accès limité',
    canManageUsers: false,
    canManageRoles: false,
    canManageAppointments: true,
    canViewReports: false,
  },
  {
    name: 'admin',
    displayName: 'Administrateur',
    description: 'Accès complet à toutes les fonctionnalités du système',
    canManageUsers: true,
    canManageRoles: true,
    canManageAppointments: true,
    canViewReports: true,
  }
];

type RoleStore = {
  roles: Role[];
  addRole: (role: Role) => void;
  deleteRole: (roleName: string) => void;
  updateRole: (oldName: string, updatedRole: Partial<Role>) => void;
  resetRoles: () => void;
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
              ? { ...role, ...updatedRole }
              : role
          ),
        })),
      resetRoles: () => set({ roles: defaultRoles }),
    }),
    {
      name: 'role-storage',
      version: 1,
    }
  )
);