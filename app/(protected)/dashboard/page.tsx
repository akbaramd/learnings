// app/(protected)/dashboard/page.tsx
'use client';

import { useAuth } from '@/src/hooks/useAuth';
import Button from '@/src/components/ui/Button';
import Card from '@/src/components/ui/Card';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <Card variant="elevated" padding="lg" radius="md" className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, {user?.userName || 'User'}!
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => logout()}
            >
              Logout
            </Button>
          </div>
        </Card>

        <Card variant="elevated" padding="lg" radius="md">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <div className="space-y-2">
            <p><strong>ID:</strong> {user?.id}</p>
            <p><strong>Username:</strong> {user?.userName}</p>
            <p><strong>Roles:</strong> {user?.roles?.join(', ') || 'None'}</p>
            <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
            <p><strong>National ID:</strong> {user?.nationalId}</p>
            <p><strong>Phone:</strong> {user?.phone}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
