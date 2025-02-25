import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserEditForm } from "./user-edit-form";

export function UserList() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const formatRole = (role: string) => {
    switch (role) {
      case "doctor":
        return "Médecin";
      case "staff":
        return "Personnel";
      case "admin":
        return "Administrateur";
      default:
        return role;
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom d'utilisateur</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Prénom</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Admin</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users?.map((user) => (
            <TableRow
              key={user.id}
              className="cursor-pointer hover:bg-muted"
              onClick={() => setSelectedUser(user)}
            >
              <TableCell>{user.username}</TableCell>
              <TableCell>{user.lastName}</TableCell>
              <TableCell>{user.firstName}</TableCell>
              <TableCell>{formatRole(user.role)}</TableCell>
              <TableCell>
                <Badge variant={user.isAdmin ? "default" : "secondary"}>
                  {user.isAdmin ? "Oui" : "Non"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selectedUser && (
        <UserEditForm
          open={!!selectedUser}
          onOpenChange={(open) => !open && setSelectedUser(null)}
          user={selectedUser}
        />
      )}
    </div>
  );
}
