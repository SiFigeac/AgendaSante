import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Role = {
  name: string;
  displayName: string;
  description: string;
};

const defaultRoles = [
  {
    name: 'doctor',
    displayName: 'Médecin',
    description: 'Médecin pouvant gérer ses rendez-vous et patients'
  },
  {
    name: 'staff',
    displayName: 'Personnel',
    description: 'Personnel administratif avec accès limité'
  },
  {
    name: 'admin',
    displayName: 'Administrateur',
    description: 'Accès complet à toutes les fonctionnalités du système'
  },
  {
    name: 'secretary',
    displayName: 'Secrétaire',
    description: 'Gestion des rendez-vous et de l\'accueil des patients'
  },
  {
    name: 'assistant',
    displayName: 'Assistant',
    description: 'Assistant médical avec accès aux dossiers patients'
  }
];

type RoleStore = {
  roles: Role[];
  deleteRole: (roleName: string) => void;
  updateRole: (oldName: string, updatedRole: Partial<Role>) => void;
  resetRoles: () => void;
};

export const useRoleStore = create<RoleStore>()(
  persist(
    (set) => ({
      roles: defaultRoles,
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
    }
  )
);