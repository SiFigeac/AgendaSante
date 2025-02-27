import { create } from "zustand";

export const PREDEFINED_ROLES = [
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
  roles: typeof PREDEFINED_ROLES;
  deleteRole: (roleName: string) => void;
};

export const useRoleStore = create<RoleStore>((set) => ({
  roles: PREDEFINED_ROLES,
  deleteRole: (roleName) =>
    set((state) => ({
      roles: state.roles.filter((role) => role.name !== roleName),
    })),
}));