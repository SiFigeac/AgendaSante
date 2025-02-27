import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useEffect } from "react";
import { useRoleStore } from "@/lib/roles";

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function generatePastelColor(existingColors: string[]): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70;
  const lightness = 80;

  // Générer une nouvelle couleur
  const newColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  // Si la couleur existe déjà, en générer une nouvelle
  if (existingColors.includes(newColor)) {
    return generatePastelColor(existingColors);
  }

  return newColor;
}

const DEFAULT_PERMISSIONS = {
  doctor: ["view_appointments", "manage_own_appointments"],
  staff: ["view_appointments", "manage_all_appointments", "manage_patients"],
  admin: ["view_appointments", "manage_all_appointments", "manage_patients", "manage_users", "manage_system"],
};


export function UserForm({ open, onOpenChange }: UserFormProps) {
  const { toast } = useToast();
  const { roles } = useRoleStore();

  // Récupérer les couleurs existantes
  const { data: existingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      isAdmin: false,
      permissions: DEFAULT_PERMISSIONS.staff,
      role: "staff" as const,
    },
  });

  // Mettre à jour les permissions en fonction du rôle sélectionné
  const role = form.watch("role");
  const lastName = form.watch("lastName");

  useEffect(() => {
    if (role) {
      form.setValue("permissions", DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS] || []);

      // Ajouter "Dr" au nom si c'est un médecin
      if (role === "doctor" && lastName) {
        form.setValue("lastName", lastName.startsWith("Dr ") ? lastName : `Dr ${lastName}`);
      }
    }
  }, [role, lastName, form]);

  const createUser = useMutation({
    mutationFn: async (data: any) => {
      const existingColors = existingUsers?.filter(u => u.role === "doctor").map(u => u.color) || [];
      const userData = {
        ...data,
        color: data.role === "doctor" ? generatePastelColor(existingColors) : null,
      };

      console.log("Creating user with data:", userData);
      const res = await apiRequest("POST", "/api/admin/users", userData);
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Succès",
        description: "Utilisateur créé avec succès",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouvel utilisateur</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => createUser.mutate(data))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom d'utilisateur</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          // Convertir en majuscules
                          const value = e.target.value.toUpperCase();
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un rôle" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.name} value={role.name}>
                          {role.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isAdmin"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel>Administrateur</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={createUser.isPending}>
              {createUser.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Créer l'utilisateur
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}