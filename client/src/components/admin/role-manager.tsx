import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RoleForm } from "./role-form";

const PREDEFINED_ROLES = [
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

export function RoleManager() {
  const [showAddRole, setShowAddRole] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestion des rôles</h2>
          <p className="text-muted-foreground">
            Créez et gérez les rôles pour les utilisateurs
          </p>
        </div>
        <Button onClick={() => setShowAddRole(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nouveau rôle
        </Button>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Rôles existants</CardTitle>
            <CardDescription>
              Liste des rôles disponibles dans le système
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {PREDEFINED_ROLES.map((role) => (
                <div 
                  key={role.name}
                  className="flex items-start justify-between p-4 rounded-lg border"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">
                        {role.displayName}
                      </h3>
                      <Badge variant="secondary" className="capitalize">
                        {role.name}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {role.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <RoleForm 
        open={showAddRole}
        onOpenChange={setShowAddRole}
      />
    </div>
  );
}