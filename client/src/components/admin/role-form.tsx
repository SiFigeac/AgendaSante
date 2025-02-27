import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useRoleStore, type Role } from "@/lib/roles";
import { useToast } from "@/hooks/use-toast";

// Schéma pour la création (nom obligatoire)
const createRoleSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string(),
  canManageUsers: z.boolean(),
  canManageRoles: z.boolean(),
  canManageAppointments: z.boolean(),
  canViewReports: z.boolean(),
});

// Schéma pour la modification (nom optionnel)
const updateRoleSchema = createRoleSchema.extend({
  name: z.string().optional(),
});

type RoleFormData = z.infer<typeof createRoleSchema>;

interface RoleFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: Role | null;
}

export function RoleForm({ open, onOpenChange, role }: RoleFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addRole, updateRole } = useRoleStore();
  const { toast } = useToast();

  const form = useForm<RoleFormData>({
    resolver: zodResolver(role ? updateRoleSchema : createRoleSchema),
    defaultValues: {
      name: role?.name || "",
      description: role?.description || "",
      canManageUsers: role?.canManageUsers || false,
      canManageRoles: role?.canManageRoles || false,
      canManageAppointments: role?.canManageAppointments || false,
      canViewReports: role?.canViewReports || false,
    },
  });

  const onSubmit = async (data: RoleFormData) => {
    setIsSubmitting(true);
    try {
      if (role) {
        // Pour la modification, on ne met à jour que les champs fournis
        const updatedData = {
          description: data.description,
          canManageUsers: data.canManageUsers,
          canManageRoles: data.canManageRoles,
          canManageAppointments: data.canManageAppointments,
          canViewReports: data.canViewReports,
        };
        // Ajouter le nom seulement s'il est fourni
        if (data.name) {
          Object.assign(updatedData, { 
            name: data.name,
            displayName: data.name 
          });
        }
        updateRole(role.name, updatedData);
        toast({
          title: "Succès",
          description: "Le rôle a été mis à jour avec succès.",
        });
      } else {
        // Pour la création, tous les champs sont requis
        addRole({
          ...data,
          displayName: data.name,
        });
        toast({
          title: "Succès",
          description: "Le rôle a été créé avec succès.",
        });
      }
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde du rôle.",
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
                name="canManageUsers"
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
                name="canManageRoles"
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
                name="canManageAppointments"
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
                name="canViewReports"
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