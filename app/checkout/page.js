'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CreditCard, DollarSign, Package } from '@/components/icons'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import { toast } from '@/lib/utils/toast'
import { supabase } from '@/lib/supabase'

function CheckoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const shipmentId = searchParams.get('id')
  const shipmentIds = searchParams.get('ids') // Multiple shipment IDs
  
  const [shipments, setShipments] = useState([])
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (shipmentIds) {
      fetchMultipleShipments()
    } else if (shipmentId) {
      fetchSingleShipment()
    }
  }, [shipmentId, shipmentIds])

  const fetchSingleShipment = async () => {
    if (!supabase || !shipmentId) {
      toast.error('Database not configured or missing shipment ID')
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
        toast.error('Failed to load shipment details')
        return
      }
      setShipments([data])
    } catch (error) {
      console.error('Error fetching shipment:', error)
      toast.error('Failed to load shipment details')
    }
  }

  const fetchMultipleShipments = async () => {
    if (!supabase || !shipmentIds) {
      toast.error('Database not configured or missing shipment IDs')
      return
    }
    
    try {
      const ids = shipmentIds.split(',').filter(id => id.trim())
      const { data, error } = await supabase
        .from('shipments')
        .select('*')
        .in('id', ids)

      if (error) {
        console.error('Error fetching shipments:', error)
        toast.error('Failed to load shipment details')
        return
      }
      setShipments(data || [])
    } catch (error) {
      console.error('Error fetching shipments:', error)
      toast.error('Failed to load shipment details')
    }
  }

  const handlePayment = async () => {
    if (shipments.length === 0) {
      toast.error('No shipments to pay for')
      return
    }

    setLoading(true)
    try {
      // In a real app, integrate with Stripe/PayPal/etc.
      // For now, simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      const shipmentIdsToUpdate = shipments.map(s => s.id)
      const totalAmount = shipments.reduce((sum, s) => sum + (s.cost || 0), 0)

      // Update all shipments status to paid
      const { error: updateError } = await supabase
        .from('shipments')
        .update({ 
          status: 'Paid',
          payment_status: 'completed',
          payment_method: paymentMethod,
        })
        .in('id', shipmentIdsToUpdate)

      if (updateError) throw updateError

      // Create payment records for each shipment
      const paymentRecords = shipments.map(shipment => ({
        shipment_id: shipment.id,
        amount: shipment.cost,
        payment_method: paymentMethod,
        status: 'completed',
      }))

      const { error: paymentError } = await supabase
        .from('payments')
        .insert(paymentRecords)

      if (paymentError) throw paymentError

      toast.success(`Payment successful! ${shipments.length} shipment(s) being processed.`)
      
      // Redirect to receipt with all shipment IDs
      const idsParam = shipmentIdsToUpdate.join(',')
      router.push(`/receipt?ids=${idsParam}`)
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (shipments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Checkout" showBack={true} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Checkout" showBack={true} />
      
      <main className="px-4 py-6 max-w-md mx-auto">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h3 className="text-lg font-semibold mb-4">
            Order Summary {shipments.length > 1 && `(${shipments.length} shipments)`}
          </h3>
          
          <div className="space-y-4">
            {shipments.map((shipment, index) => (
              <div key={shipment.id} className={index > 0 ? 'border-t pt-3' : ''}>
                {shipments.length > 1 && (
                  <p className="text-sm font-medium text-gray-700 mb-2">Shipment #{index + 1}</p>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tracking Number</span>
                    <span className="font-medium">{shipment.tracking_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Package Size</span>
                    <span className="font-medium">{shipment.package_size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Type</span>
                    <span className="font-medium">{shipment.delivery_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost</span>
                    <span className="font-medium">€{shipment.cost?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between">
              <span className="text-lg font-semibold">Total</span>
              <span className="text-lg font-bold text-red-500">
                €{shipments.reduce((sum, s) => sum + (s.cost || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
          
          <div className="space-y-3">
            <button
              onClick={() => setPaymentMethod('card')}
              className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition ${
                paymentMethod === 'card'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200'
              }`}
            >
              <CreditCard size={24} />
              <span className="font-medium">Credit/Debit Card</span>
            </button>

            <button
              onClick={() => setPaymentMethod('paypal')}
              className={`w-full p-4 border-2 rounded-lg flex items-center gap-3 transition ${
                paymentMethod === 'paypal'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200'
              }`}
            >
              <DollarSign size={24} />
              <span className="font-medium">PayPal</span>
            </button>
          </div>
        </div>

        {/* Card Details */}
        {paymentMethod === 'card' && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
            <h3 className="text-lg font-semibold mb-4">Card Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                  maxLength={19}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="1234 5678 9012 3456"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry
                  </label>
                  <input
                    type="text"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                    maxLength={5}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                    maxLength={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="123"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pay Button */}
        <button
          onClick={handlePayment}
          disabled={loading || (paymentMethod === 'card' && !cardDetails.number)}
          className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-4 rounded-lg font-medium text-lg transition"
        >
          {loading ? 'Processing...' : `Pay €${shipments.reduce((sum, s) => sum + (s.cost || 0), 0).toFixed(2)}`}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          Your payment is secure and encrypted
        </p>
      </main>

      <BottomNav />
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Checkout" showBack={true} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}

