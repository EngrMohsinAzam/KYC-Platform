'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getSuperAdminToken,
  superAdminCreateAdmin,
  superAdminDeleteAdmin,
  superAdminListAdmins,
  superAdminUpdateAdmin,
} from '@/lib/api/super-admin-api'
import { LoadingDots } from '@/components/ui/LoadingDots'
import { ShimmerTable } from '@/components/ui/Shimmer'
import { Modal } from '@/components/ui/Modal'

type PermissionKey =
  | 'canApproveRejectKYC'
  | 'canViewAllUsers'
  | 'canViewFinancialGraph'
  | 'canViewSupportIssues'
  | 'canViewWallets'
  | 'canSendEmails'

const PERMISSIONS: { key: PermissionKey; label: string }[] = [
  { key: 'canApproveRejectKYC', label: 'Approve / Reject KYC' },
  { key: 'canViewAllUsers', label: 'View all users' },
  { key: 'canViewFinancialGraph', label: 'View financial graph' },
  { key: 'canViewSupportIssues', label: 'View support issues' },
  { key: 'canViewWallets', label: 'View wallets' },
  { key: 'canSendEmails', label: 'Send emails' },
]

export default function SuperAdminAdminsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [admins, setAdmins] = useState<any[]>([])
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [permissions, setPermissions] = useState<Record<PermissionKey, boolean>>({
    canApproveRejectKYC: true,
    canViewAllUsers: true,
    canViewFinancialGraph: false,
    canViewSupportIssues: true,
    canViewWallets: false,
    canSendEmails: false,
  })

  // Create modal state
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Edit modal state
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null)
  const [editEmail, setEditEmail] = useState('')
  const [editUsername, setEditUsername] = useState('')
  const [editPassword, setEditPassword] = useState('')
  const [editPermissions, setEditPermissions] = useState<Record<PermissionKey, boolean>>({
    canApproveRejectKYC: false,
    canViewAllUsers: false,
    canViewFinancialGraph: false,
    canViewSupportIssues: false,
    canViewWallets: false,
    canSendEmails: false,
  })
  const [editIsActive, setEditIsActive] = useState(true)
  const [savingEdit, setSavingEdit] = useState(false)

  useEffect(() => {
    const token = getSuperAdminToken()
    if (!token) router.replace('/super-admin')
  }, [router])

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await superAdminListAdmins({ page: 1, limit: 50 })
      if (result.success) {
        const list = result.data?.admins || result.data?.data?.admins || result.data?.items || result.data?.results || []
        setAdmins(Array.isArray(list) ? list : [])
      } else {
        setError(result.message || 'Failed to load admins')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load admins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const canCreate = useMemo(() => {
    return email.trim().length > 3 && password.trim().length >= 6
  }, [email, password])

  const closeCreateModal = () => {
    setShowCreateModal(false)
    setEmail('')
    setPassword('')
    setUsername('')
    setError('')
    // Reset permissions to all unchecked
    setPermissions({
      canApproveRejectKYC: false,
      canViewAllUsers: false,
      canViewFinancialGraph: false,
      canViewSupportIssues: false,
      canViewWallets: false,
      canSendEmails: false,
    })
  }

  const onCreate = async () => {
    if (!canCreate) return
    try {
      setSaving(true)
      setError('')
      const result = await superAdminCreateAdmin({ 
        email, 
        password,
        username: username.trim() || undefined,
        permissions 
      })
      if (!result.success) {
        setError(result.message || 'Failed to create admin')
        return
      }
      // Close modal and reset form
      closeCreateModal()
      await load()
    } catch (e: any) {
      setError(e.message || 'Failed to create admin')
    } finally {
      setSaving(false)
    }
  }

  const onDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const ok = confirm('Remove this admin?')
    if (!ok) return
    try {
      const result = await superAdminDeleteAdmin(id)
      if (!result.success) {
        alert(result.message || 'Failed to remove admin')
        return
      }
      await load()
    } catch (e: any) {
      alert(e.message || 'Failed to remove admin')
    }
  }

  const openEditModal = (admin: any) => {
    setEditingAdmin(admin)
    setEditEmail(admin.email || '')
    setEditUsername(admin.username || '')
    setEditPassword('')
    setEditIsActive(admin.isActive !== false)
    setEditPermissions({
      canApproveRejectKYC: admin.permissions?.canApproveRejectKYC || false,
      canViewAllUsers: admin.permissions?.canViewAllUsers || false,
      canViewFinancialGraph: admin.permissions?.canViewFinancialGraph || false,
      canViewSupportIssues: admin.permissions?.canViewSupportIssues || false,
      canViewWallets: admin.permissions?.canViewWallets || false,
      canSendEmails: admin.permissions?.canSendEmails || false,
    })
  }

  const closeEditModal = () => {
    setEditingAdmin(null)
    setEditEmail('')
    setEditUsername('')
    setEditPassword('')
    setEditIsActive(true)
    setEditPermissions({
      canApproveRejectKYC: false,
      canViewAllUsers: false,
      canViewFinancialGraph: false,
      canViewSupportIssues: false,
      canViewWallets: false,
      canSendEmails: false,
    })
  }

  const onSaveEdit = async () => {
    if (!editingAdmin) return
    try {
      setSavingEdit(true)
      setError('')
      const updateBody: any = {
        email: editEmail.trim(),
        username: editUsername.trim() || undefined,
        permissions: editPermissions,
        isActive: editIsActive,
      }
      // Only include password if it's provided (min 6 chars)
      if (editPassword.trim().length >= 6) {
        updateBody.password = editPassword.trim()
      }
      
      const result = await superAdminUpdateAdmin(String(editingAdmin.id || editingAdmin._id), updateBody)
      if (!result.success) {
        setError(result.message || 'Failed to update admin')
        return
      }
      closeEditModal()
      await load()
    } catch (e: any) {
      setError(e.message || 'Failed to update admin')
    } finally {
      setSavingEdit(false)
    }
  }

  return (
    <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Admin record</h1>
          <p className="text-sm text-gray-600 mt-1">Create admins with permission-based access.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-black hover:bg-black/80 text-white text-sm font-medium"
          >
            Create Admin
          </button>
          <button
            onClick={load}
            className="px-4 py-2 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && !showCreateModal && !editingAdmin && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-900">Admins</h2>
            {loading && <LoadingDots size="sm" />}
          </div>

          {loading ? (
            <ShimmerTable />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Username</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Permissions</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {admins.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-sm text-gray-500">
                        No admins found
                      </td>
                    </tr>
                  ) : (
                    admins.map((a) => (
                      <tr 
                        key={a.id || a._id || a.email} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => openEditModal(a)}
                      >
                        <td className="px-3 py-3 text-sm text-gray-900">{a.email || '—'}</td>
                        <td className="px-3 py-3 text-sm text-gray-700">{a.username || '—'}</td>
                        <td className="px-3 py-3 text-xs text-gray-700">
                          {(a.permissions ? Object.entries(a.permissions) : [])
                            .filter(([, v]) => !!v)
                            .map(([k]) => k)
                            .join(', ') || '—'}
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button
                            onClick={(e) => onDelete(String(a.id || a._id), e)}
                            className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-50 text-xs font-medium"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Create Admin Modal */}
      <Modal isOpen={showCreateModal} onClose={closeCreateModal} className="max-w-4xl">
        <div className="p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Create Admin</h2>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  placeholder="admin2@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                  placeholder="Min 6 characters"
                  minLength={6}
                  required
                />
                <p className="mt-1.5 text-xs text-gray-500">Minimum 6 characters required</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Username (optional)
              </label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black focus:border-black outline-none text-sm"
                placeholder="admin2 (auto-generated if empty)"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-3">
                Permissions
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PERMISSIONS.map((p) => (
                  <label key={p.key} className="flex items-center gap-2.5 text-sm text-gray-800 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                    <input
                      type="checkbox"
                      checked={permissions[p.key]}
                      onChange={(e) => setPermissions((prev) => ({ ...prev, [p.key]: e.target.checked }))}
                      className="h-4 w-4 text-black focus:ring-2 focus:ring-black border-gray-300 rounded"
                    />
                    <span>{p.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={closeCreateModal}
                disabled={saving}
                className="flex-1 px-5 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onCreate}
                disabled={!canCreate || saving}
                className="flex-1 bg-black hover:bg-black/80 text-white rounded-xl py-2.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {saving ? (
                  <>
                    <LoadingDots size="sm" color="#ffffff" />
                    Creating...
                  </>
                ) : (
                  'Create'
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Admin Modal */}
      <Modal isOpen={!!editingAdmin} onClose={closeEditModal} className="max-w-2xl">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Admin</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black outline-none text-sm"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black outline-none text-sm"
                placeholder="admin (optional)"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={editPassword}
                onChange={(e) => setEditPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-black outline-none text-sm"
                placeholder="Leave empty to keep current password"
              />
              <p className="mt-1 text-xs text-gray-500">Leave empty to keep current password. Minimum 6 characters if changing.</p>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Status</label>
              <div className="mt-2">
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    className="h-4 w-4"
                  />
                  Active
                </label>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700">Permissions</label>
              <div className="mt-2 space-y-2">
                {PERMISSIONS.map((p) => (
                  <label key={p.key} className="flex items-center gap-2 text-sm text-gray-800">
                    <input
                      type="checkbox"
                      checked={editPermissions[p.key]}
                      onChange={(e) => setEditPermissions((prev) => ({ ...prev, [p.key]: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={closeEditModal}
                disabled={savingEdit}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={onSaveEdit}
                disabled={savingEdit || !editEmail.trim()}
                className="flex-1 bg-black hover:bg-black/80 text-white rounded-xl py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {savingEdit ? (
                  <>
                    <LoadingDots size="sm" color="#ffffff" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </main>
  )
}



