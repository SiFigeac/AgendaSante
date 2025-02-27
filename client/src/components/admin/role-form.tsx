import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRoleStore, type Role } from "@/lib/roles";
import { useToast } from "@/hooks/use-toast";

interface RoleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
}

interface FormData {
  name: string;
  description: string;
  permissions: {
    users: boolean;
    roles: boolean;
    appointments: boolean;
    reports: boolean;
  };
}

export function RoleForm({ open, onOpenChange, role }: RoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addRole, updateRole } = useRoleStore();
  const { toast } = useToast();

  const form = useForm<FormData>({
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      permissions: {
        users: Array.isArray(role?.permissions) ? role.permissions.includes("users") : false,
        roles: Array.isArray(role?.permissions) ? role.permissions.includes("roles") : false,
        appointments: Array.isArray(role?.permissions) ? role.permissions.includes("appointments") : false,
        reports: Array.isArray(role?.permissions) ? role.permissions.includes("reports") : false,
      }
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Convertir les switches en tableau de permissions
      const permissions = Object.entries(data.permissions)
        .filter(([_, enabled]) => enabled)
        .map(([permission]) => permission);

      if (role) {
        // Mise à jour
        updateRole(role.name, {
          description: data.description,
          permissions,
          ...(data.name && { name: data.name, displayName: data.name }),
        });
      } else {
        // Création
        if (!data.name) {
          throw new Error("Le nom est requis pour créer un rôle");
        }
        addRole({
          name: data.name,
          displayName: data.name,
          description: data.description,
          permissions,
        });
      }

      toast({
        title: "Succès",
        description: role ? "Rôle mis à jour avec succès" : "Rôle créé avec succès",
      });

      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {role ? `Modifier le rôle : ${role.displayName}` : 'Nouveau rôle'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {(!role || role.name !== 'admin') && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Nom du rôle
                      {role && <span className="text-sm text-muted-foreground ml-2">(optionnel)</span>}
                    </FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: responsable" />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Description du rôle" />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <h4 className="font-medium">Permissions</h4>

              <FormField
                control={form.control}
                name="permissions.users"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0 py-2">
                    <FormLabel className="font-normal">Gestion des utilisateurs</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permissions.roles"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0 py-2">
                    <FormLabel className="font-normal">Gestion des rôles</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permissions.appointments"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0 py-2">
                    <FormLabel className="font-normal">Gestion des rendez-vous</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="permissions.reports"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between space-y-0 py-2">
                    <FormLabel className="font-normal">Accès aux rapports</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {role ? 'Mettre à jour le rôle' : 'Créer le rôle'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}