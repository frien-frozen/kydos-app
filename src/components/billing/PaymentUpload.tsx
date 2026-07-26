'use client'

import { UploadButton } from '@/utils/uploadthing'
import { uploadPaymentProof } from '@/server/billing'
import { toast } from 'sonner'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function PaymentUpload({ invoiceId }: { invoiceId: string }) {
  const [isUpdating, setIsUpdating] = useState(false)

  return (
    <div className="flex flex-col items-end gap-2">
      {isUpdating ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Processing...
        </div>
      ) : (
        <UploadButton
          endpoint="paymentProof"
          onClientUploadComplete={async (res) => {
            if (res?.[0]) {
              setIsUpdating(true)
              const result = await uploadPaymentProof(invoiceId, res[0].url)
              if (result.success) {
                toast.success('Payment proof uploaded successfully')
              } else {
                toast.error(result.error || 'Failed to update invoice')
              }
              setIsUpdating(false)
            }
          }}
          onUploadError={(error) => {
            toast.error(error.message)
          }}
          appearance={{
            button: 'ut-button:!bg-[#10a37f] ut-button:!text-primary-foreground text-xs px-3 py-1 rounded-full hover:!bg-emerald-600 transition-colors w-auto h-auto',
            allowedContent: 'hidden',
          }}
          content={{ button: 'Upload Receipt' }}
        />
      )}
    </div>
  )
}
