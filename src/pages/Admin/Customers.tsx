// src/pages/Admin/Customers.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label'; // Added Label
import AdminLayout from '@/components/layout/AdminLayout';
import { UserProfile, UserRole, GetAllUserProfilesOptionsBE } from '@/services/userService'; 

import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions';

let getAllUserProfilesAdminCF: HttpsCallable<GetAllUserProfilesOptionsBE | undefined, HttpsCallableResult<{ success: boolean; profiles?: UserProfile[]; totalCount?: number; error?: string }>> | undefined;
let updateUserRolesAdminCF: HttpsCallable<{ targetUserId: string; roles: UserRole[] }, HttpsCallableResult<{ success: boolean; message?: string; error?: string }>> | undefined;

if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    getAllUserProfilesAdminCF = httpsCallable(functionsClient, 'users-getAllUserProfilesCF');
    updateUserRolesAdminCF = httpsCallable(functionsClient, 'users-updateUserRolesCF');
    console.log("AdminCustomers: Live httpsCallable references created.");
  } catch (error) { 
    console.error("AdminCustomers: Error preparing httpsCallable functions:", error);
    toast.error("Error initializing connection to user service.");
  }
} else {
    console.warn("AdminCustomers: Firebase functions client not available. Operations will use mocks or fail.");
}

const fallbackUserCall = async (name: string, payload?: any): Promise<any> => {
    console.warn(`MOCKING User CF call: ${name}`, payload);
    await new Promise(r => setTimeout(r, 300));
    if (name === 'users-getAllUserProfilesCF') {
        return { data: { success: true, profiles: [
            { id: 'uid1', displayName: 'Alice Admin (Mock)', email: 'alice@example.com', roles: ['admin', 'customer'], createdAt: new Date().toISOString() },
            { id: 'uid2', displayName: 'Bob Customer (Mock)', email: 'bob@example.com', roles: ['customer'], createdAt: new Date(Date.now()-86400000).toISOString() }
        ], totalCount: 2 } };
    }
    if (name === 'users-updateUserRolesCF') return { data: { success: true, message: 'Roles updated (mock)' } };
    return { data: { success: false, error: 'Unknown mock user function' } };
};

const formatDate = (dateInput: any): string => new Date(dateInput?.toDate ? dateInput.toDate() : dateInput).toLocaleDateString();
const ALL_ROLES: UserRole[] = ['customer', 'editor', 'admin']; // Define available roles

const AdminCustomers = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [newRoles, setNewRoles] = useState<UserRole[]>([]);
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);
  const [isSavingRoles, setIsSavingRoles] = useState(false);

  const fetchUsers = useCallback(async (options: GetAllUserProfilesOptionsBE = {}) => {
    setIsLoading(true);
    try {
      const fn = getAllUserProfilesAdminCF || ((opts?: GetAllUserProfilesOptionsBE) => fallbackUserCall('users-getAllUserProfilesCF', opts));
      const result = await fn(options);
      if (result.data.success && result.data.profiles) setUsers(result.data.profiles);
      else { toast.error(result.data.error || 'Failed to load users'); setUsers([]); }
    } catch (e:any) { toast.error('Failed to load users: ' + e.message); setUsers([]); }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchUsers({ sortBy: 'createdAt', sortOrder: 'desc' }); }, [fetchUsers]);

  const openRolesDialog = (user: UserProfile) => {
    setEditingUser(user);
    setNewRoles([...user.roles]);
    setIsRolesDialogOpen(true);
  };

  const handleRoleChange = (role: UserRole, checked: boolean) => {
    setNewRoles(prev => checked ? [...new Set([...prev, role])] : prev.filter(r => r !== role));
  };

  const handleSaveRoles = async () => {
    if (!editingUser) return;
    const fn = updateUserRolesAdminCF || (() => fallbackUserCall('users-updateUserRolesCF', { targetUserId: editingUser.id, roles: newRoles }));
    setIsSavingRoles(true);
    try {
      const result = await fn({ targetUserId: editingUser.id, roles: newRoles });
      if (result.data.success) {
        toast.success("User roles updated!");
        fetchUsers(); 
        setIsRolesDialogOpen(false);
      } else { toast.error(result.data.error || "Failed to update roles."); }
    } catch (e:any) { toast.error('Failed to update roles: ' + e.message); }
    setIsSavingRoles(false);
  };

  if (isLoading) return <AdminLayout><div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin"/> Loading customers...</div></AdminLayout>;

  return (
    <AdminLayout><div className="p-6">
      <Card>
        <CardHeader><CardTitle>Customers</CardTitle><CardDescription>View and manage user accounts and roles.</CardDescription></CardHeader>
        <CardContent>
          {users.length === 0 ? <p>No users found.</p> : (
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Roles</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>{users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.displayName || user.firstName || user.id.substring(0,10)+'...'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.roles.map(role => <Badge key={role} variant={role === 'admin' ? "default" : "secondary"} className="mr-1 capitalize">{role}</Badge>)}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className="text-right"><Button variant="outline" size="sm" onClick={() => openRolesDialog(user)}><ShieldCheck size={16} className="mr-1"/> Manage Roles</Button></TableCell>
                </TableRow>))}
              </TableBody></Table>)}
        </CardContent>
      </Card>
      {editingUser && <Dialog open={isRolesDialogOpen} onOpenChange={setIsRolesDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage Roles for {editingUser.displayName || editingUser.email}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-4">
            {ALL_ROLES.map(role => (
              <div key={role} className="flex items-center space-x-3">
                <input type="checkbox" id={`role-${editingUser.id}-${role}`} checked={newRoles.includes(role)} onChange={(e) => handleRoleChange(role, e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"/>
                <Label htmlFor={`role-${editingUser.id}-${role}`} className="capitalize text-sm font-medium text-gray-700">{role}</Label>
              </div>))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRolesDialogOpen(false)} disabled={isSavingRoles}>Cancel</Button>
            <Button onClick={handleSaveRoles} disabled={isSavingRoles}>{isSavingRoles? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : null}Save Roles</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>}</div>
    </AdminLayout>
  );
};
export default AdminCustomers;
