'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  createInvoice,
  updateBillingSettings,
  liftStudentSuspension,
  suspendStudentAccess,
} from '@/server/billing'
import { FileText, Settings2, ShieldCheck, ShieldAlert, Search } from 'lucide-react'

interface StudentBillingRow {
  id: string
  name: string
  email: string
  sectionName: string | null
  paidUntil: string | null
  status: 'Active' | 'Grace Period' | 'Suspended'
  pendingAmount: number | null
}

export function CreateInvoiceDialog({
  schoolId,
  students,
  monthlyTuition,
}: {
  schoolId: string
  students: { id: string; user: { name: string | null; email: string } }[]
  monthlyTuition: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [studentId, setStudentId] = useState<string>('ALL')
  const [monthsPaid, setMonthsPaid] = useState<number>(1)
  const [amount, setAmount] = useState<string>(String(monthlyTuition || 2500))
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toISOString().split('T')[0]
  })
  const [description, setDescription] = useState<string>('Monthly Tuition Statement')

  function handleMonthsChange(m: number) {
    setMonthsPaid(m)
    setAmount(String((monthlyTuition || 2500) * m))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid invoice amount')
      return
    }

    startTransition(async () => {
      const res = await createInvoice({
        schoolId,
        studentId,
        amount: numAmount,
        monthsPaid,
        dueDate: dueDate || undefined,
        description: description.trim() || `Tuition for ${monthsPaid} month(s)`,
      })
      if (res.success) {
        toast.success(
          studentId === 'ALL'
            ? `Generated invoices for ${res.data.count} students`
            : 'Invoice generated successfully'
        )
        setOpen(false)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to generate invoice')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileText className="w-4 h-4" />
          Generate Invoice
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Tuition Invoice</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-3">
          <div className="space-y-2">
            <Label>Target Student(s)</Label>
            <Select value={studentId} onValueChange={(v) => v && setStudentId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select recipient" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" label="All Enrolled Students (Bulk)">
                  All Enrolled Students (Bulk)
                </SelectItem>
                {students.map((s) => {
                  const label = s.user.name || s.user.email
                  return (
                    <SelectItem key={s.id} value={s.id} label={label}>
                      {label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Billing Duration (Months)</Label>
            <div className="flex gap-2">
              {[1, 3, 6, 12].map((m) => (
                <Button
                  key={m}
                  type="button"
                  variant={monthsPaid === m ? 'default' : 'outline'}
                  onClick={() => handleMonthsChange(m)}
                  className="flex-1"
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Amount Due (₱)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. First Trimester Tuition"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Generating...' : 'Issue Invoice'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function BillingSettingsDialog({
  schoolId,
  initialTuition,
  initialGraceDays,
}: {
  schoolId: string
  initialTuition: number
  initialGraceDays: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [tuition, setTuition] = useState(String(initialTuition))
  const [graceDays, setGraceDays] = useState(String(initialGraceDays))

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await updateBillingSettings({
        schoolId,
        monthlyTuition: Math.max(0, parseFloat(tuition) || 0),
        gracePeriodDays: Math.max(0, parseInt(graceDays, 10) || 0),
      })
      if (res.success) {
        toast.success('Billing parameters updated')
        setOpen(false)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to update billing settings')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings2 className="w-4 h-4" />
          Tuition Settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tuition & Grace Period Settings</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="space-y-4 pt-3">
          <div className="space-y-2">
            <Label>Standard Monthly Tuition (₱)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={tuition}
              onChange={(e) => setTuition(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Used to calculate 1, 3, and 12-month payment options for students and parents.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Grace Period Before Suspension (Days)</Label>
            <Input
              type="number"
              min="0"
              max="90"
              value={graceDays}
              onChange={(e) => setGraceDays(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Number of days after a student's Paid Until date before access is restricted.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function AdminStudentBillingTable({ rows }: { rows: StudentBillingRow[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Grace Period' | 'Suspended'>('ALL')
  const [pending, startTransition] = useTransition()

  const filtered = rows.filter((r) => {
    const matchesQuery =
      !query.trim() ||
      r.name.toLowerCase().includes(query.toLowerCase()) ||
      r.email.toLowerCase().includes(query.toLowerCase()) ||
      (r.sectionName && r.sectionName.toLowerCase().includes(query.toLowerCase()))
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter
    return matchesQuery && matchesStatus
  })

  function handleLiftSuspension(studentId: string, name: string) {
    startTransition(async () => {
      const res = await liftStudentSuspension(studentId, 14)
      if (res.success) {
        toast.success(`Lifted suspension for ${name} (14-day extension granted)`)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to lift suspension')
      }
    })
  }

  function handleSuspend(studentId: string, name: string) {
    startTransition(async () => {
      const res = await suspendStudentAccess(studentId)
      if (res.success) {
        toast.success(`Suspended access for ${name}`)
        router.refresh()
      } else {
        toast.error(res.error || 'Failed to suspend student')
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            placeholder="Search student, email, or section..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {(['ALL', 'Active', 'Grace Period', 'Suspended'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                statusFilter === status
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {status === 'ALL' ? 'All Students' : status}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted">
                {['Student', 'Section', 'Paid Until', 'Status', 'Pending Bill', 'Access Governance'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{s.name}</p>
                    <p className="text-xs text-muted-foreground">{s.email}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.sectionName || '—'}</td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {s.paidUntil
                      ? new Date(s.paidUntil).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Not paid yet'}
                  </td>
                  <td className="px-4 py-3">
                    {s.status === 'Active' && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-full font-medium">
                        Active
                      </span>
                    )}
                    {s.status === 'Grace Period' && (
                      <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs px-2 py-0.5 rounded-full font-medium">
                        Grace Period
                      </span>
                    )}
                    {s.status === 'Suspended' && (
                      <span className="bg-red-50 text-red-700 border border-red-200 text-xs px-2 py-0.5 rounded-full font-medium">
                        Suspended
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {s.pendingAmount
                      ? '₱' + s.pendingAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.status === 'Suspended' || s.status === 'Grace Period' ? (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleLiftSuspension(s.id, s.name)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Lift Suspension
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleSuspend(s.id, s.name)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        Suspend Access
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted-foreground">
                    No students match the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
