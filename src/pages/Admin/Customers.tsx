// src/pages/Admin/Customers.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Edit, Trash2, Eye, ArrowUpDown, UserPlus, ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AdminLayout from '@/components/layout/AdminLayout';
import { UserProfile, UserRole, GetAllUserProfilesOptionsBE } from '@/services/userService'; // Backend types

// Firebase Client SDK imports for Cloud Functions
import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallableResult } from 'firebase/functions';

let getAllUserProfilesAdminCF: any;
let updateUserRolesAdminCF: any;
// let deleteUserAdminCF: any; // If we want to delete user (auth + firestore) from admin

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    getAllUserProfilesAdminCF = httpsCallable(functionsClient, 'users-getAllUserProfilesCF');
    updateUserRolesAdminCF = httpsCallable(functionsClient, 'users-updateUserRolesCF');
  } catch (error) { console.error("AdminCustomers: Error preparing httpsCallable:", error); }
}

const callUserFunctionMock = async (name: string, payload?: any): Promise<any> => {
    console.warn(`MOCKING User CF call: ${name}`, payload);
    await new Promise(r => setTimeout(r, 300));
    if (name === 'users-getAllUserProfilesCF') {
        return { data: { success: true, profiles: [
            { id: 'uid1', displayName: 'Alice Admin', email: 'alice@example.com', roles: ['admin', 'customer'], createdAt: new Date().toISOString() },
            { id: 'uid2', displayName: 'Bob Customer', email: 'bob@example.com', roles: ['customer'], createdAt: new Date(Date.now()- 86400000).toISOString() }
        ], totalCount: 2 } };
    }
    if (name === 'users-updateUserRolesCF') return { data: { success: true, message: 'Roles updated (mock)' } };
    return { data: { success: false, error: 'Unknown mock user function' } };
};

const formatDate = (dateInput: any) => { /* ... */ return new Date(dateInput?.toDate ? dateInput.toDate() : dateInput).toLocaleDateString(); };

const AdminCustomers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newRoles, setNewRoles] = useState<UserRole[]>([]);
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);

  const fetchUsers = useCallback(async (options: GetAllUserProfilesOptionsBE = {}) => {
    setIsLoading(true);
    try {
      const result = getAllUserProfilesAdminCF 
        ? await getAllUserProfilesAdminCF(options) 
        : await callUserFunctionMock('users-getAllUserProfilesCF', options);
      if (result.data.success && result.data.profiles) {
        setUsers(result.data.profiles);
      } else { toast.error(result.data.error || 'Failed to load users'); }
    } catch (e:any) { toast.error(\`Failed to load users: ${e.message}\`); }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchUsers({ sortBy: 'createdAt', sortOrder: 'desc' }); }, [fetchUsers]);

  const openRolesDialog = (user: UserProfile) => {
    setEditingUser(user);
    setNewRoles([...user.roles]);
    setIsRolesDialogOpen(true);
  };

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    setNewRoles(prev => checked ? [...prev, role].filter((v,i,a)=>a.indexOf(v)===i) : prev.filter(r => r !== role));
  };

  const handleSaveRoles = async () => {
    if (!editingUser || !updateUserRolesAdminCF) return;
    try {
      const result = await updateUserRolesAdminCF({ targetUserId: editingUser.id, roles: newRoles });
      if (result.data.success) {
        toast.success("User roles updated!");
        fetchUsers(); // Refresh list
        setIsRolesDialogOpen(false);
      } else { toast.error(result.data.error || "Failed to update roles."); }
    } catch (e:any) { toast.error(\`Failed to update roles: ${e.message}\`); }
  };

  if (isLoading) return <AdminLayout><div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin"/> Loading customers...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="p-6">
        <Card>
          <CardHeader><CardTitle>Customers</CardTitle><CardDescription>View and manage user accounts.</CardDescription></CardHeader>
          <CardContent>
            {users.length === 0 ? <p>No users found.</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Roles</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id}>
                      <TableCell>{user.displayName || user.firstName || 'N/A'}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.roles.map(role => <Badge key={role} variant={role === 'admin' ? "default" : "secondary"} className="mr-1">{role}</Badge>)}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openRolesDialog(user)}><ShieldCheck size={16} className="mr-1"/> Manage Roles</Button>
                        {/* <Button variant="ghost" size="icon" title="View Details"><Eye size={16}/></Button> */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isRolesDialogOpen} onOpenChange={setIsRolesDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Manage Roles for {editingUser?.displayName || editingUser?.email}</DialogTitle></DialogHeader>
            <div className="space-y-2 py-4">
              {(['customer', 'admin', 'editor'] as UserRole[]).map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <input type="checkbox" id={`role-${role}`} checked={newRoles.includes(role)} onChange={(e) => handleRoleChange(role, e.target.checked)} />
                  <Label htmlFor={`role-${role}`} className="capitalize">{role}</Label>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRolesDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveRoles}>Save Roles</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminCustomers;
