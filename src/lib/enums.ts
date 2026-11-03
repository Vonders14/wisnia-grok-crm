/** Faithful ports of enum lists from wisnia-crm.html (~9431–9450). */

export const INVESTOR_STATUSES = [
  'New - Need to Send',
  'Added to Sequence',
  'Sent Email',
  'Replied',
  'Clicked NDA',
  'Sent NDA',
  'Sent OM',
  'Executed NDA',
  'Sent Data Room',
  'Viewed Data Room',
  'Engaged - Press',
  'Pricing Sent - Awaiting LOI',
  'LOI Submitted',
  'Under Contract',
  'EN - Set Up Call',
  'EN - Call Scheduled',
  'EN - Call Completed',
  'EN - Sent Fee Agreement',
  'EN - Fee Signed - Create New Deal',
] as const

export const DEAL_INTERESTS = [
  'Interested',
  'Asked a Question',
  'Provided Investment Criteria',
  'Not Interested/Dead',
] as const

export const CONTACT_STAGES = [
  '4. Interested',
  '3. Replied',
  '2. Approaching',
  '1. Cold',
  '0. Closed - left company',
  '0. Closed - Bounced',
  '0. Closed - wrong person',
  '0. Closed - not interested',
  '0. Closed - No Response',
] as const

/** Consumer mailbox domains ignored by paste-list / domain matching (PG_CONSUMER). */
export const PG_CONSUMER = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'outlook.com',
  'yahoo.com',
  'icloud.com',
  'aol.com',
  'me.com',
  'live.com',
  'msn.com',
  'protonmail.com',
  'proton.me',
  'mail.com',
])

export const HEALTH_RULES: Record<string, string> = {
  Hot: 'investor replied in the last 7 days',
  'Waiting on Us': 'they emailed last and it has been 8+ days — you owe the reply',
  'Going Quiet': 'you emailed last · 8–21 days silent · 1–2 unanswered follow-ups',
  Cold: '3+ unanswered follow-ups, OR you emailed last and 22+ days silent',
  Dead: 'deal_interest = Not Interested/Dead',
}

export const HEALTH_COLOR: Record<string, string> = {
  Hot: '#dc2626',
  'Waiting on Us': '#2563eb',
  'Going Quiet': '#d97706',
  Cold: '#64748b',
  Dead: '#9ca3af',
}

/** Columns that must never be edited (PG_NOEDIT subset + investor_criteria sacred). */
export const PG_NOEDIT = new Set([
  'd365_account_id',
  'd365_contact_id',
  'created_at',
  'updated_at',
  'apollo_id',
  'reply_id',
  'investor_criteria',
  'sent',
  'campaigns',
])
