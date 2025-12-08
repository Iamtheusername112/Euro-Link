'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Printer, Download, ArrowLeft, Package, MapPin, User, Phone, Mail, Calendar } from '@/components/icons'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import { toast } from '@/lib/utils/toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

function ReceiptContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const shipmentId = searchParams.get('id')
  const { user } = useAuth()
  
  const [shipment, setShipment] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (shipmentId) {
      fetchShipment()
    }
  }, [shipmentId])

  const fetchShipment = async () => {
    if (!supabase || !shipmentId) {
      toast.error('Missing shipment information')
      setLoading(false)
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .eq('id', shipmentId)
        .single()

      if (error) {
        console.error('Error fetching shipment:', error)
        toast.error('Failed to load receipt')
        setLoading(false)
        return
      }
      
      // Verify user owns this shipment
      if (data.user_id !== user?.id) {
        toast.error('Unauthorized access')
        router.push('/')
        return
      }
      
      setShipment(data)
    } catch (error) {
      console.error('Error fetching shipment:', error)
      toast.error('Failed to load receipt')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // Create a printable version and trigger download
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${shipment?.tracking_number}</title>
          <style>
            ${document.querySelector('#receipt-styles')?.innerHTML || ''}
            body { font-family: Arial, sans-serif; padding: 20px; }
            .receipt-container { max-width: 800px; margin: 0 auto; }
          </style>
        </head>
        <body>
          ${document.querySelector('#receipt-content')?.innerHTML || ''}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Receipt" showBack={true} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading receipt...</p>
        </div>
      </div>
    )
  }

  if (!shipment) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Receipt" showBack={true} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Receipt not found</p>
        </div>
      </div>
    )
  }

  const senderInfo = shipment.sender_info || {}
  const recipientInfo = shipment.recipient_info || {}
  const packageInfo = shipment.package_info || {}

  return (
    <>
      <style id="receipt-styles">{`
        @media print {
          body { background: white; }
          .no-print { display: none !important; }
          .receipt-container { box-shadow: none; border: none; }
          .print-break { page-break-after: always; }
        }
        @page {
          margin: 1cm;
        }
      `}</style>

      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Receipt" showBack={true} />
        
        <main className="px-4 py-6 max-w-4xl mx-auto">
          {/* Action Buttons - Hidden when printing */}
          <div className="no-print mb-6 flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <Printer size={20} />
              Print Receipt
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <Download size={20} />
              Download PDF
            </button>
            <button
              onClick={() => router.push(`/track?number=${shipment.tracking_number}`)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              <ArrowLeft size={20} />
              Back to Tracking
            </button>
          </div>

          {/* Receipt Content */}
          <div id="receipt-content" className="bg-white rounded-lg shadow-lg p-8 receipt-container">
            {/* Header */}
            <div className="text-center mb-8 pb-6 border-b-2 border-gray-200">
              <h1 className="text-4xl font-bold text-red-600 mb-2">Euro-Link</h1>
              <p className="text-gray-600">Shipping Receipt</p>
              <p className="text-sm text-gray-500 mt-2">
                <Calendar size={14} className="inline mr-1" />
                {new Date(shipment.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>

            {/* Tracking Number - Prominent */}
            <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg p-6 mb-6 text-center">
              <p className="text-sm font-medium mb-2">Tracking Number</p>
              <p className="text-3xl font-bold tracking-wider">{shipment.tracking_number}</p>
              <p className="text-sm mt-2 opacity-90">
                Status: <span className="font-semibold">{shipment.status}</span>
              </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Sender Information */}
              <div className="bg-gray-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <User size={20} className="text-red-500" />
                  Sender Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-gray-900">{senderInfo.name || 'N/A'}</p>
                  {senderInfo.phone && (
                    <p className="text-gray-600 flex items-center gap-2">
                      <Phone size={14} />
                      {senderInfo.phone}
                    </p>
                  )}
                  {senderInfo.email && (
                    <p className="text-gray-600 flex items-center gap-2">
                      <Mail size={14} />
                      {senderInfo.email}
                    </p>
                  )}
                  {shipment.pickup_location && (
                    <p className="text-gray-600 flex items-start gap-2 mt-3">
                      <MapPin size={14} className="mt-1 flex-shrink-0" />
                      <span>{shipment.pickup_location}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Recipient Information */}
              <div className="bg-blue-50 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Package size={20} className="text-blue-600" />
                  Recipient Information
                </h3>
                <div className="space-y-2 text-sm">
                  <p className="font-medium text-gray-900">{recipientInfo.name || 'N/A'}</p>
                  {recipientInfo.phone && (
                    <p className="text-gray-600 flex items-center gap-2">
                      <Phone size={14} />
                      {recipientInfo.phone}
                    </p>
                  )}
                  {recipientInfo.email && (
                    <p className="text-gray-600 flex items-center gap-2">
                      <Mail size={14} />
                      {recipientInfo.email}
                    </p>
                  )}
                  {shipment.drop_off_location && (
                    <p className="text-gray-600 flex items-start gap-2 mt-3">
                      <MapPin size={14} className="mt-1 flex-shrink-0" />
                      <span>{shipment.drop_off_location}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="bg-gray-50 rounded-lg p-5 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Package size={20} className="text-gray-600" />
                Package Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 mb-1">Size</p>
                  <p className="font-medium">{shipment.package_size || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Weight</p>
                  <p className="font-medium">{packageInfo.weight || 'N/A'} KG</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Delivery Type</p>
                  <p className="font-medium">{shipment.delivery_type || 'Normal'}</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-1">Value</p>
                  <p className="font-medium">€{packageInfo.value || '0.00'}</p>
                </div>
              </div>
              {packageInfo.description && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-600 mb-1">Description</p>
                  <p className="text-gray-800">{packageInfo.description}</p>
                </div>
              )}
              {shipment.special_instructions && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-600 mb-1">Special Instructions</p>
                  <p className="text-gray-800">{shipment.special_instructions}</p>
                </div>
              )}
            </div>

            {/* Payment Information */}
            <div className="border-t-2 border-gray-200 pt-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-800">Total Amount</span>
                <span className="text-3xl font-bold text-red-600">
                  €{shipment.cost?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p>Payment Status: <span className="font-medium text-gray-800">{shipment.payment_status || 'Pending'}</span></p>
                </div>
                {shipment.payment_method && (
                  <div>
                    <p>Payment Method: <span className="font-medium text-gray-800">{shipment.payment_method}</span></p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 pt-6 text-center text-sm text-gray-500">
              <p className="mb-2">Thank you for choosing Euro-Link!</p>
              <p>For inquiries, please contact us at support@euro-link.com</p>
              <p className="mt-4 text-xs">
                This is an official receipt. Please keep it for your records.
              </p>
            </div>

            {/* Barcode/QR Code Area (for future implementation) */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <div className="inline-block bg-gray-100 p-4 rounded">
                <p className="text-xs text-gray-500 mb-2">Scan to track</p>
                <div className="w-32 h-32 bg-white border-2 border-gray-300 flex items-center justify-center mx-auto">
                  <p className="text-xs text-gray-400">QR Code</p>
                </div>
              </div>
            </div>
          </div>
        </main>

        <BottomNav />
      </div>
    </>
  )
}

export default function ReceiptPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Receipt" showBack={true} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <ReceiptContent />
    </Suspense>
  )
}

