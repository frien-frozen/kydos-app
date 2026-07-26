'use server'

export async function sendWhatsAppNotification(phoneNumber: string, message: string) {
  // Mock WhatsApp Integration (Twilio / Meta Graph API)
  // In production, we would POST to the WhatsApp Business API endpoint here.
  console.log(`[WhatsApp Mock] Sending to ${phoneNumber}: ${message}`)
  
  return { success: true, messageId: `msg_${Math.random().toString(36).substring(7)}` }
}
