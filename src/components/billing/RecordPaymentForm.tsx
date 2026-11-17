'use client'

import { useState } from 'react'
import { recordPayment } from '@/server/billing'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus } from 'lucide-react'

export function RecordPaymentForm({ 
  schoolId, 
  students,
  monthlyTuition
}: { 
  schoolId: string
  students: { id: string, user: { name: string | null, email: string } }[] 
  monthlyTuition: number
}) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [months, setMonths] = useState(1)
  const [customAmount, setCustomAmount] = useState<string>('')
  const [customNote, setCustomNote] = useState<string>('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const studentId = formData.get('studentId') as string
    const paymentMethod = formData.get('paymentMethod') as string
    const amountStr = formData.get('amount') as string

    if (!studentId || !paymentMethod || !amountStr) {
      toast.error('Please fill all fields')
      setIsLoading(false)
      return
    }

    const amount = parseFloat(amountStr)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid payment amount greater than 0')
      setIsLoading(false)
      return
    }

    const description = customNote.trim()
      ? `${customNote.trim()} (${months} ${months === 1 ? 'month' : 'months'})`
      : `Tuition for ${months} ${months === 1 ? 'month' : 'months'}`

    const result = await recordPayment({
      studentId,
      schoolId,
      amount,
      monthsPaid: months,
      description,
      paymentMethod
    })

    if (result.success) {
      toast.success(`Recorded payment & extended access by ${months} month(s)`)
      setOpen(false)
      setCustomAmount('')
      setCustomNote('')
    } else {
      toast.error(result.error || 'Failed to record payment')
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Record Manual Payment
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Manual Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="studentId">Student</Label>
            <Select name="studentId" required>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map(s => {
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
            <Label>Subscription Extension (Months)</Label>
            <div className="flex gap-2">
              {[1, 3, 6, 12].map(m => (
                <Button
                  key={m}
                  type="button"
                  variant={months === m ? 'default' : 'outline'}
                  onClick={() => {
                    setMonths(m)
                    setCustomAmount('')
                  }}
                  className="flex-1"
                >
                  {m}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="amount">Amount Paid (₱)</Label>
              <span className="text-xs text-muted-foreground">Editable for partial/scholarship rates</span>
            </div>
            <Input 
              id="amount"
              name="amount" 
              type="number" 
              step="0.01" 
              min="0.01"
              value={customAmount !== '' ? customAmount : ((monthlyTuition || 2500) * months)}
              onChange={(e) => setCustomAmount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method</Label>
            <Select name="paymentMethod" required defaultValue="Cash">
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Physical Cash</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Cheque">Cheque</SelectItem>
                <SelectItem value="GCash">GCash (Manual/In-Person)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customNote">Note / Reference (Optional)</Label>
            <Input
              id="customNote"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="e.g. OR #1042 or Scholarship Discount"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Recording...' : 'Record Payment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
