/* eslint-disable no-console */
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useUserManagement, useUpdateUserRole, useUpdateUserStatus } from '@/hooks/useDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Search, MoreHorizontal, UserCheck, UserX, Lock, Unlock, Shield } from 'lucide-react';
import { formatBytes } from '@/lib/utils';
import { UserFilters } from '@/types/dashboard.types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export const Route = createFileRoute('/dashboard/super-admin/users')({
  component: UserManagement,
});

function UserManagement() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const filters: UserFilters = {
    searchQuery: searchQuery || undefined,
    role: roleFilter,
    isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
  };

  const { data, isLoading, refetch } = useUserManagement(filters, page, pageSize);
  const updateRole = useUpdateUserRole();
  const updateStatus = useUpdateUserStatus();
  // const bulkAction = useBulkUserAction();

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateRole.mutateAsync({ userId, role: newRole });
      refetch();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleStatusToggle = async (userId: string, currentStatus: boolean) => {
    try {
      await updateStatus.mutateAsync({ userId, isActive: !currentStatus });
      refetch();
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  const handleLockToggle = async (userId: string, currentLockStatus: boolean) => {
    try {
      await updateStatus.mutateAsync({ userId, isLocked: !currentLockStatus });
      refetch();
    } catch (error) {
      console.error('Failed to update lock status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <DashboardLayout>
        <div className="flex-1 space-y-6 p-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">User Management</h2>
            <p className="text-muted-foreground">
              Manage user accounts, roles, and permissions
            </p>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Search and filter users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="guest">Guest</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({data?.pagination.totalItems || 0})</CardTitle>
              <CardDescription>
                Showing {data?.users.length || 0} of {data?.pagination.totalItems || 0} users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Storage</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.fullName}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {user.role.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {user.isActive ? (
                              <Badge variant="default" className="w-fit">Active</Badge>
                            ) : (
                              <Badge variant="secondary" className="w-fit">Inactive</Badge>
                            )}
                            {user.isLocked && (
                              <Badge variant="destructive" className="w-fit">Locked</Badge>
                            )}
                            {!user.isEmailVerified && (
                              <Badge variant="outline" className="w-fit">Unverified</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatBytes(user.storageUsed)} / {formatBytes(user.storageLimit)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {((user.storageUsed / user.storageLimit) * 100).toFixed(1)}% used
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                                Copy User ID
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />

                              <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'super_admin')}>
                                <Shield className="mr-2 h-4 w-4" />
                                Super Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}>
                                <Shield className="mr-2 h-4 w-4" />
                                Admin
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'manager')}>
                                Manager
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'user')}>
                                User
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleStatusToggle(user.id, user.isActive)}>
                                {user.isActive ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleLockToggle(user.id, user.isLocked)}>
                                {user.isLocked ? (
                                  <>
                                    <Unlock className="mr-2 h-4 w-4" />
                                    Unlock Account
                                  </>
                                ) : (
                                  <>
                                    <Lock className="mr-2 h-4 w-4" />
                                    Lock Account
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {data?.pagination.page || 1} of {data?.pagination.totalPages || 1}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={!data?.pagination.hasPreviousPage}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => p + 1)}
                    disabled={!data?.pagination.hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </>
  );
}
