// Email notification system using Resend
// Environment variables required: RESEND_API_KEY, EMAIL_FROM

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || "onboarding@resend.dev"

interface SendEmailParams {
  to: string
  subject: string
  html: string
}

interface EmailResult {
  success: boolean
  id?: string
  error?: string
}

// Send email via Resend API
export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not configured, skipping email")
    return { success: false, error: "Email not configured" }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to,
        subject,
        html,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("[Email] Send failed:", data.message || data)
      return { success: false, error: data.message || "Failed to send email" }
    }

    console.log("[Email] Sent successfully to:", to)
    return { success: true, id: data.id }
  } catch (error: any) {
    console.error("[Email] Error:", error.message)
    return { success: false, error: error.message }
  }
}

// Base email template wrapper
function emailTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
        .header { background: #000000; color: #ffffff; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
        .content { padding: 32px 24px; }
        .footer { background: #f9f9f9; padding: 24px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; }
        .btn { display: inline-block; background: #000; color: #fff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; margin: 16px 0; }
        .order-table { width: 100%; border-collapse: collapse; margin: 16px 0; }
        .order-table th, .order-table td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
        .order-table th { background: #f9f9f9; font-weight: 600; }
        .total-row td { font-weight: 600; font-size: 16px; border-top: 2px solid #000; }
        .highlight { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .warning { background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 16px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        ${content}
        <div class="footer">
          <p>Powered by Blaqora</p>
          <p>If you have questions, please contact the seller directly.</p>
        </div>
      </div>
    </body>
    </html>
  `
}

// Format currency
function formatCurrency(amount: number): string {
  return `NGN ${amount.toLocaleString()}`
}

interface OrderItem {
  product_title: string
  quantity: number
  price: number
  subtotal: number
}

interface VendorOrderEmailParams {
  vendorName: string
  orderId: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: OrderItem[]
  totalAmount: number
  shippingAddress?: string | null
}

// Email for vendors when they receive a new order
export function getNewOrderEmailForVendor(params: VendorOrderEmailParams): { subject: string; html: string } {
  const { vendorName, orderId, customerName, customerEmail, customerPhone, items, totalAmount, shippingAddress } =
    params

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td>${item.product_title}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `,
    )
    .join("")

  const content = `
    <div class="header">
      <h1>New Order Received!</h1>
    </div>
    <div class="content">
      <p>Hi ${vendorName},</p>
      <p>Great news! You've received a new order.</p>
      
      <div class="highlight">
        <strong>Order ID:</strong> ${orderId.substring(0, 8)}...<br>
        <strong>Total Amount:</strong> ${formatCurrency(totalAmount)}
      </div>
      
      <h3>Customer Details</h3>
      <p>
        <strong>Name:</strong> ${customerName}<br>
        <strong>Email:</strong> ${customerEmail}<br>
        <strong>Phone:</strong> ${customerPhone}
        ${shippingAddress ? `<br><strong>Address:</strong> ${shippingAddress}` : ""}
      </p>
      
      <h3>Order Items</h3>
      <table class="order-table">
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr class="total-row">
            <td colspan="2">Total</td>
            <td style="text-align: right;">${formatCurrency(totalAmount)}</td>
          </tr>
        </tbody>
      </table>
      
      <p>Log in to your dashboard to manage this order.</p>
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://blaqora.store"}/orders" class="btn">View Order</a>
    </div>
  `

  return {
    subject: `New Order Received - ${formatCurrency(totalAmount)}`,
    html: emailTemplate(content),
  }
}

interface CustomerOrderEmailParams {
  customerName: string
  orderId: string
  items: OrderItem[]
  totalAmount: number
  vendorName: string
  vendorEmail?: string | null
  paymentReference: string
  shippingAddress?: string | null
}

// Email for customers when they place an order
export function getOrderConfirmationEmailForCustomer(params: CustomerOrderEmailParams): {
  subject: string
  html: string
} {
  const { customerName, orderId, items, totalAmount, vendorName, paymentReference, shippingAddress } = params

  const itemsHtml = items
    .map(
      (item) => `
    <tr>
      <td>${item.product_title}</td>
      <td style="text-align: center;">${item.quantity}</td>
      <td style="text-align: right;">${formatCurrency(item.subtotal)}</td>
    </tr>
  `,
    )
    .join("")

  const content = `
    <div class="header">
      <h1>Order Confirmed!</h1>
    </div>
    <div class="content">
      <p>Hi ${customerName},</p>
      <p>Thank you for your order! Your payment has been confirmed.</p>
      
      <div class="highlight">
        <strong>Order ID:</strong> ${orderId.substring(0, 8)}...<br>
        <strong>Payment Reference:</strong> ${paymentReference}<br>
        <strong>Seller:</strong> ${vendorName}
      </div>
      
      <h3>Order Summary</h3>
      <table class="order-table">
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          <tr class="total-row">
            <td colspan="2">Total Paid</td>
            <td style="text-align: right;">${formatCurrency(totalAmount)}</td>
          </tr>
        </tbody>
      </table>
      
      ${shippingAddress ? `<p><strong>Delivery Address:</strong> ${shippingAddress}</p>` : ""}
      
      <p>The seller will process your order shortly. For digital products, you'll receive download links once ready.</p>
      
      <p>If you have any questions about your order, please contact the seller directly.</p>
    </div>
  `

  return {
    subject: `Order Confirmed - ${formatCurrency(totalAmount)}`,
    html: emailTemplate(content),
  }
}

interface WithdrawalEmailParams {
  vendorName: string
  amount: number
  status: "approved" | "rejected"
  withdrawalId: string
  bankName?: string
  accountNumber?: string
  adminNote?: string
}

// Email for vendors when withdrawal is updated
export function getWithdrawalUpdateEmailForVendor(params: WithdrawalEmailParams): { subject: string; html: string } {
  const { vendorName, amount, status, withdrawalId, bankName, accountNumber, adminNote } = params

  const isApproved = status === "approved"
  const statusText = isApproved ? "Approved" : "Rejected"
  const statusColor = isApproved ? "#16a34a" : "#dc2626"

  const content = `
    <div class="header">
      <h1>Withdrawal ${statusText}</h1>
    </div>
    <div class="content">
      <p>Hi ${vendorName},</p>
      <p>Your withdrawal request has been <strong style="color: ${statusColor};">${statusText.toLowerCase()}</strong>.</p>
      
      <div class="${isApproved ? "highlight" : "warning"}">
        <strong>Withdrawal ID:</strong> ${withdrawalId.substring(0, 8)}...<br>
        <strong>Amount:</strong> ${formatCurrency(amount)}<br>
        <strong>Status:</strong> <span style="color: ${statusColor};">${statusText}</span>
        ${bankName ? `<br><strong>Bank:</strong> ${bankName}` : ""}
        ${accountNumber ? `<br><strong>Account:</strong> ****${accountNumber.slice(-4)}` : ""}
      </div>
      
      ${isApproved ? `<p>The funds will be transferred to your bank account within 1-3 business days.</p>` : ""}
      
      ${adminNote ? `<p><strong>Note from Admin:</strong> ${adminNote}</p>` : ""}
      
      <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://blaqora.store"}/payouts" class="btn">View Payouts</a>
    </div>
  `

  return {
    subject: `Withdrawal ${statusText} - ${formatCurrency(amount)}`,
    html: emailTemplate(content),
  }
}

interface SystemUpdateEmailParams {
  recipientName?: string
  title: string
  message: string
  ctaText?: string
  ctaUrl?: string
}

// Email for system announcements
export function getSystemUpdateEmail(params: SystemUpdateEmailParams): { subject: string; html: string } {
  const { recipientName, title, message, ctaText, ctaUrl } = params

  const content = `
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${recipientName ? `<p>Hi ${recipientName},</p>` : ""}
      <p>${message.replace(/\n/g, "<br>")}</p>
      
      ${ctaText && ctaUrl ? `<a href="${ctaUrl}" class="btn">${ctaText}</a>` : ""}
    </div>
  `

  return {
    subject: title,
    html: emailTemplate(content),
  }
}
