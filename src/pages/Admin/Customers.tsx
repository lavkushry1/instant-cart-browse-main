// src/pages/Admin/Customers.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react'; // Added useMemo
import { toast } from 'react-hot-toast';
import { ShieldCheck, Loader2, Search, UserX, UserCheck, KeyRound, ChevronLeft, ChevronRight } from 'lucide-react'; // Added icons
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input'; // Added Input
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'; // Added Select
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label'; // Added Label
import AdminLayout from '@/components/layout/AdminLayout';
import { UserProfile, UserRole, GetAllUserProfilesOptionsBE } from '@/services/userService'; 

import { functionsClient } from '@/lib/firebaseClient';
import { httpsCallable, HttpsCallable, HttpsCallableResult } from 'firebase/functions';

// Define direct response types for Cloud Functions
interface GetAllUserProfilesAdminResponse { success: boolean; profiles?: UserProfile[]; totalCount?: number; error?: string; }
interface UpdateUserRolesAdminResponse { success: boolean; message?: string; error?: string; }
// Placeholder for new functions - not actually calling them in this UI task
// interface UpdateUserStatusAdminResponse { success: boolean; message?: string; error?: string; }
// interface TriggerPasswordResetAdminResponse { success: boolean; message?: string; error?: string; }


let getAllUserProfilesAdminCF: HttpsCallable<GetAllUserProfilesOptionsBE | undefined, GetAllUserProfilesAdminResponse> | undefined;
let updateUserRolesAdminCF: HttpsCallable<{ targetUserId: string; roles: UserRole[] }, UpdateUserRolesAdminResponse> | undefined;
// let updateUserStatusAdminCF: HttpsCallable<{ targetUserId: string; isActive: boolean }, UpdateUserStatusAdminResponse> | undefined;
// let triggerPasswordResetAdminCF: HttpsCallable<{ targetUserId: string }, TriggerPasswordResetAdminResponse> | undefined;


if (functionsClient && Object.keys(functionsClient).length > 0) {
  try {
    getAllUserProfilesAdminCF = httpsCallable(functionsClient, 'users-getAllUserProfilesCF');
    updateUserRolesAdminCF = httpsCallable(functionsClient, 'users-updateUserRolesCF');
    // updateUserStatusAdminCF = httpsCallable(functionsClient, 'users-updateUserStatusCF'); // For future
    // triggerPasswordResetAdminCF = httpsCallable(functionsClient, 'users-triggerPasswordResetCF'); // For future
    console.log("AdminCustomers: Live httpsCallable references created.");
  } catch (error) { 
    console.error("AdminCustomers: Error preparing httpsCallable functions:", error);
    toast.error("Error initializing connection to user service.");
  }
} else {
    console.warn("AdminCustomers: Firebase functions client not available. Operations will use mocks or fail.");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const fallbackUserCall = async (name: string, payload?: any): Promise<any> => {
    console.warn(`MOCKING User CF call: ${name}`, payload);
    await new Promise(r => setTimeout(r, 300));
    if (name === 'users-getAllUserProfilesCF') {
        return { data: { success: true, profiles: [
            { id: 'uid1', displayName: 'Alice Admin (Mock)', email: 'alice@example.com', roles: ['admin', 'customer'], createdAt: new Date().toISOString(), isActive: true, totalOrders: 10 },
            { id: 'uid2', displayName: 'Bob Customer (Mock)', email: 'bob@example.com', roles: ['customer'], createdAt: new Date(Date.now()-86400000).toISOString(), isActive: true, totalOrders: 2 },
            { id: 'uid3', displayName: 'Charlie Editor (Mock)', email: 'charlie@example.com', roles: ['editor'], createdAt: new Date(Date.now()-172800000).toISOString(), isActive: false, totalOrders: 5 },
            { id: 'uid4', displayName: 'Diana User (Mock)', email: 'diana@example.com', roles: ['customer'], createdAt: new Date(Date.now()-259200000).toISOString(), isActive: true, totalOrders: 0 },
            { id: 'uid5', displayName: 'Edward Test (Mock)', email: 'edward@example.com', roles: ['customer'], createdAt: new Date(Date.now()-345600000).toISOString(), isActive: true, totalOrders: 7 },
        ], totalCount: 5 } };
    }
    if (name === 'users-updateUserRolesCF') return { data: { success: true, message: 'Roles updated (mock)' } };
    // Mocks for new actions (not actually called, but for completeness if they were)
    // if (name === 'users-updateUserStatusCF') return { data: { success: true, message: `User status updated (mock)` } };
    // if (name === 'users-triggerPasswordResetCF') return { data: { success: true, message: `Password reset triggered (mock)` } };
    return { data: { success: false, error: 'Unknown mock user function' } };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatDate = (dateInput: any): string => new Date(dateInput?.toDate ? dateInput.toDate() : dateInput).toLocaleDateString();
const ALL_ROLES_FILTER: UserRole[] = ['customer', 'editor', 'admin']; // Define available roles for filter

// Augment UserProfile for client-side mock status and total orders
interface ClientUserProfile extends UserProfile {
  isActive?: boolean; // Mock status
  totalOrders?: number; // Mock total orders
}

const ITEMS_PER_PAGE = 10;

const AdminCustomers = () => {
  const [users, setUsers] = useState<ClientUserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<ClientUserProfile | null>(null);
  const [newRoles, setNewRoles] = useState<UserRole[]>([]);
  const [isRolesDialogOpen, setIsRolesDialogOpen] = useState(false);
  const [isSavingRoles, setIsSavingRoles] = useState(false);

  // State for search, filter, and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchUsers = useCallback(async (options: GetAllUserProfilesOptionsBE = {}) => {
    setIsLoading(true);
    try {
      const fn = getAllUserProfilesAdminCF || ((opts?: GetAllUserProfilesOptionsBE) => fallbackUserCall('users-getAllUserProfilesCF', opts));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: HttpsCallableResult<any> = await fn(options);
      const responseData = result.data as GetAllUserProfilesAdminResponse;

      if (responseData.success && responseData.profiles) {
        // Add mock isActive and totalOrders for UI demo
        const profilesWithMockData = responseData.profiles.map((p, index) => ({
            ...p,
            isActive: p.isActive === undefined ? (index % 2 === 0) : p.isActive, // Alternate for demo if not present
            totalOrders: p.totalOrders === undefined ? Math.floor(Math.random() * 10) : p.totalOrders, // Random for demo
        }));
        setUsers(profilesWithMockData);
      } else { 
        toast.error(responseData.error || 'Failed to load users'); 
        setUsers([]); 
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e:any) { toast.error('Failed to load users: ' + e.message); setUsers([]); }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchUsers({ sortBy: 'createdAt', sortOrder: 'desc' }); }, [fetchUsers]);
  
  // Client-side filtering and pagination
  const filteredUsers = useMemo(() => {
    return users
      .filter(user => {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = user.displayName?.toLowerCase().includes(searchLower) || user.email?.toLowerCase().includes(searchLower);
        const roleMatch = roleFilter === 'all' || user.roles.includes(roleFilter);
        return nameMatch && roleMatch;
      });
  }, [users, searchQuery, roleFilter]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const totalPages = useMemo(() => Math.ceil(filteredUsers.length / ITEMS_PER_PAGE), [filteredUsers]);


  const openRolesDialog = (user: ClientUserProfile) => {
    setEditingUser(user);
    setNewRoles([...user.roles]); // Assuming roles is always an array
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: HttpsCallableResult<any> = await fn({ targetUserId: editingUser.id, roles: newRoles });
      const responseData = result.data as UpdateUserRolesAdminResponse;

      if (responseData.success) {
        toast.success("User roles updated!");
        fetchUsers(); 
        setIsRolesDialogOpen(false);
      } else { toast.error(responseData.error || "Failed to update roles."); }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e:any) { toast.error('Failed to update roles: ' + e.message); }
    setIsSavingRoles(false);
  };

  const handleToggleUserStatus = (userId: string, currentStatus: boolean | undefined) => {
    // Mock toggling status client-side
    setUsers(prevUsers => prevUsers.map(u => u.id === userId ? { ...u, isActive: !currentStatus } : u));
    toast.info(`User ${!currentStatus ? 'activated' : 'deactivated'} (demo).`);
    // In real app: Call updateUserStatusAdminCF({ targetUserId: userId, isActive: !currentStatus })
  };

  const handleSendPasswordReset = (email: string | undefined) => {
    if (!email) {
      toast.error("User email not available.");
      return;
    }
    toast.success(`Password reset email sent to ${email} (demo).`);
    // In real app: Call triggerPasswordResetAdminCF({ targetUserId: userId }) or by email
  };


  if (isLoading) return <AdminLayout><div className="p-6 text-center"><Loader2 className="h-8 w-8 animate-spin"/> Loading customers...</div></AdminLayout>;

  return (
    <AdminLayout><div className="p-6">
      <Card>
        <CardHeader><CardTitle>Customers</CardTitle><CardDescription>View and manage user accounts and roles.</CardDescription></CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search by name or email..." 
                className="pl-8 w-full" 
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <Select value={roleFilter} onValueChange={(value) => { setRoleFilter(value as UserRole | 'all'); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ALL_ROLES_FILTER.map(role => (
                  <SelectItem key={role} value={role} className="capitalize">{role}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {paginatedUsers.length === 0 ? <p className="text-center py-4">No users found matching your criteria.</p> : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Roles</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total Orders</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>{paginatedUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.displayName || user.firstName || user.id.substring(0,10)+'...'}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.roles.map(role => <Badge key={role} variant={role === 'admin' ? "default" : "secondary"} className="mr-1 capitalize">{role}</Badge>)}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? 'outline' : 'destructive'} className={user.isActive ? 'border-green-500 text-green-600' : ''}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{user.totalOrders ?? 'N/A'}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="outline" size="sm" onClick={() => openRolesDialog(user)} title="Manage Roles"><ShieldCheck size={16}/></Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                      title={user.isActive ? 'Deactivate User' : 'Activate User'}
                    >
                      {user.isActive ? <UserX size={16}/> : <UserCheck size={16}/>}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleSendPasswordReset(user.email)} title="Send Password Reset"><KeyRound size={16}/></Button>
                  </TableCell>
                </TableRow>))}
              </TableBody></Table>)}
          
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      {editingUser && <Dialog open={isRolesDialogOpen} onOpenChange={setIsRolesDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage Roles for {editingUser.displayName || editingUser.email}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-4">
            {ALL_ROLES_FILTER.map(role => ( // Use ALL_ROLES_FILTER here
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
