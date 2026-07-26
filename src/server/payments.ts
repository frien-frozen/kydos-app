'use server'

import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth-utils'
import type { ServerActionResponse } from '@/types'

export async function createPaymongoCheckoutSession(
  invoiceId: string
): Promise<ServerActionResponse<{ checkoutUrl: string }>> {
  await requireAuth()

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
  })

  if (!invoice) return { success: false, error: 'Invoice not found' }
  if (invoice.status === 'PAID') return { success: false, error: 'Invoice is already paid' }

  // Mock implementation for PayMongo checkout session creation
  // In a real implementation, we would call: https://api.paymongo.com/v1/checkout_sessions
  const mockCheckoutUrl = `/billing?mock_paymongo_success=${invoiceId}`

  return { success: true, data: { checkoutUrl: mockCheckoutUrl } }
}
