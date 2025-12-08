'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Package, User, Phone, Mail, ChevronRight, CheckCircle2, AlertCircle } from '@/components/icons'
import Header from '@/components/layout/Header'
import BottomNav from '@/components/layout/BottomNav'
import { toast } from '@/lib/utils/toast'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export default function CreateShipmentPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    // Sender info
    senderName: '',
    senderPhone: '',
    senderEmail: '',
    pickupAddress: '',
    pickupCity: '',
    pickupPostalCode: '',
    pickupCountry: '',
    
    // Recipient info
    recipientName: '',
    recipientPhone: '',
    recipientEmail: '',
    deliveryAddress: '',
    deliveryCity: '',
    deliveryPostalCode: '',
    deliveryCountry: '',
    
    // Package info
    packageSize: '5KG',
    packageWeight: '',
    packageDescription: '',
    packageValue: '',
    deliveryType: 'Normal',
    
    // Special instructions
    specialInstructions: '',
  })

  const [errors, setErrors] = useState({})
  const [estimatedCost, setEstimatedCost] = useState(null)

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please login to create a shipment')
      router.push('/auth/login?redirect=/create-shipment')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (user && !formData.senderEmail) {
      // Pre-fill sender info from user profile
      setFormData(prev => ({
        ...prev,
        senderEmail: user.email || '',
        senderName: user.user_metadata?.full_name || '',
      }))
    }
  }, [user])

  const validateStep = (stepNumber) => {
    const newErrors = {}
    
    if (stepNumber === 1) {
      if (!formData.senderName.trim()) newErrors.senderName = 'Name is required'
      if (!formData.senderPhone.trim()) newErrors.senderPhone = 'Phone is required'
      if (!formData.senderEmail.trim()) newErrors.senderEmail = 'Email is required'
      if (!formData.pickupAddress.trim()) newErrors.pickupAddress = 'Address is required'
      if (!formData.pickupCity.trim()) newErrors.pickupCity = 'City is required'
      if (!formData.pickupPostalCode.trim()) newErrors.pickupPostalCode = 'Postal code is required'
    } else if (stepNumber === 2) {
      if (!formData.recipientName.trim()) newErrors.recipientName = 'Name is required'
      if (!formData.recipientPhone.trim()) newErrors.recipientPhone = 'Phone is required'
      if (!formData.deliveryAddress.trim()) newErrors.deliveryAddress = 'Address is required'
      if (!formData.deliveryCity.trim()) newErrors.deliveryCity = 'City is required'
      if (!formData.deliveryPostalCode.trim()) newErrors.deliveryPostalCode = 'Postal code is required'
    } else if (stepNumber === 3) {
      if (!formData.packageWeight) newErrors.packageWeight = 'Weight is required'
      if (!formData.packageDescription.trim()) newErrors.packageDescription = 'Description is required'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateCost = async () => {
    if (!formData.pickupAddress || !formData.deliveryAddress) return
    
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLocation: `${formData.pickupAddress}, ${formData.pickupCity}`,
          dropOff: `${formData.deliveryAddress}, ${formData.deliveryCity}`,
          packageSize: formData.packageSize,
          deliveryType: formData.deliveryType,
        }),
      })
      const data = await response.json()
      if (response.ok) {
        setEstimatedCost(data.cost)
      }
    } catch (error) {
      console.error('Error calculating cost:', error)
    }
  }

  useEffect(() => {
    if (step === 3 && formData.pickupAddress && formData.deliveryAddress) {
      calculateCost()
    }
  }, [step, formData.pickupAddress, formData.deliveryAddress, formData.packageSize, formData.deliveryType])

  const generateTrackingNumber = () => {
    const prefix = 'EU'
    const timestamp = Date.now().toString().slice(-10)
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    return `${prefix}-${timestamp}${random}`
  }

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    setStep(step - 1)
    setErrors({})
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return
    
    if (!supabase) {
      toast.error('Database not configured. Please check your .env.local file.')
      return
    }
    
    setLoading(true)
    try {
      // Calculate final cost
      const costResponse = await fetch('/api/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pickupLocation: `${formData.pickupAddress}, ${formData.pickupCity}`,
          dropOff: `${formData.deliveryAddress}, ${formData.deliveryCity}`,
          packageSize: formData.packageSize,
          deliveryType: formData.deliveryType,
        }),
      })
      const costData = await costResponse.json()

      const trackingNumber = generateTrackingNumber()

      // Create shipment
      const { data, error } = await supabase
        .from('shipments')
        .insert({
          tracking_number: trackingNumber,
          user_id: user.id,
          status: 'Pending',
          pickup_location: `${formData.pickupAddress}, ${formData.pickupCity} ${formData.pickupPostalCode}`,
          drop_off_location: `${formData.deliveryAddress}, ${formData.deliveryCity} ${formData.deliveryPostalCode}`,
          package_size: formData.packageSize,
          delivery_type: formData.deliveryType,
          cost: costData.cost,
          sender_info: {
            name: formData.senderName,
            phone: formData.senderPhone,
            email: formData.senderEmail,
            address: `${formData.pickupAddress}, ${formData.pickupCity} ${formData.pickupPostalCode}`,
          },
          recipient_info: {
            name: formData.recipientName,
            phone: formData.recipientPhone,
            email: formData.recipientEmail,
            address: `${formData.deliveryAddress}, ${formData.deliveryCity} ${formData.deliveryPostalCode}`,
          },
          package_info: {
            weight: formData.packageWeight,
            description: formData.packageDescription,
            value: formData.packageValue,
            size: formData.packageSize,
          },
          special_instructions: formData.specialInstructions,
        })
        .select()
        .single()

      if (error) throw error

      // Create initial status
      await supabase
        .from('shipment_status_history')
        .insert({
          shipment_id: data.id,
          status: 'Pending',
          location: formData.pickupAddress,
          notes: 'Shipment created',
        })

      toast.success(`Shipment created! Tracking: ${trackingNumber}`)
      router.push(`/checkout?id=${data.id}`)
    } catch (error) {
      console.error('Error creating shipment:', error)
      toast.error(error.message || 'Failed to create shipment')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header title="Create Shipment" showBack={true} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const steps = [
    { number: 1, title: 'Sender Info', icon: User },
    { number: 2, title: 'Recipient Info', icon: Package },
    { number: 3, title: 'Package Details', icon: Package },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Header title="Create Shipment" showBack={true} />
      
      <main className="px-4 py-6 max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((s, index) => {
              const Icon = s.icon
              const isActive = step === s.number
              const isCompleted = step > s.number
              
              return (
                <div key={s.number} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center mb-2 transition
                      ${isActive ? 'bg-red-500 text-white' : ''}
                      ${isCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}
                    `}>
                      {isCompleted ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        <Icon size={24} />
                      )}
                    </div>
                    <span className={`text-xs font-medium ${isActive ? 'text-red-500' : 'text-gray-500'}`}>
                      {s.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 ${step > s.number ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step 1: Sender Info */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <User size={24} className="text-red-500" />
              Sender Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.senderName}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.senderName ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Enter your full name"
              />
              {errors.senderName && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.senderName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.senderPhone}
                  onChange={(e) => setFormData({ ...formData, senderPhone: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.senderPhone ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="+1 234 567 8900"
                />
                {errors.senderPhone && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.senderPhone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.senderEmail}
                  onChange={(e) => setFormData({ ...formData, senderEmail: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.senderEmail ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="your@email.com"
                />
                {errors.senderEmail && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.senderEmail}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-2" />
                Pickup Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.pickupAddress}
                onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.pickupAddress ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Street address"
              />
              {errors.pickupAddress && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.pickupAddress}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pickupCity}
                  onChange={(e) => setFormData({ ...formData, pickupCity: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.pickupCity ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="City"
                />
                {errors.pickupCity && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.pickupCity}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.pickupPostalCode}
                  onChange={(e) => setFormData({ ...formData, pickupPostalCode: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.pickupPostalCode ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="12345"
                />
                {errors.pickupPostalCode && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.pickupPostalCode}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleNext}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              Continue to Recipient Info
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        {/* Step 2: Recipient Info */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Package size={24} className="text-red-500" />
              Recipient Information
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.recipientName ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Recipient's full name"
              />
              {errors.recipientName && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.recipientName}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone size={16} className="inline mr-2" />
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.recipientPhone}
                  onChange={(e) => setFormData({ ...formData, recipientPhone: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.recipientPhone ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="+1 234 567 8900"
                />
                {errors.recipientPhone && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.recipientPhone}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Mail size={16} className="inline mr-2" />
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="recipient@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin size={16} className="inline mr-2" />
                Delivery Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.deliveryAddress}
                onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.deliveryAddress ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="Street address"
              />
              {errors.deliveryAddress && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.deliveryAddress}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.deliveryCity}
                  onChange={(e) => setFormData({ ...formData, deliveryCity: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.deliveryCity ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="City"
                />
                {errors.deliveryCity && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.deliveryCity}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.deliveryPostalCode}
                  onChange={(e) => setFormData({ ...formData, deliveryPostalCode: e.target.value })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                    errors.deliveryPostalCode ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="12345"
                />
                {errors.deliveryPostalCode && (
                  <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.deliveryPostalCode}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition"
              >
                Back
              </button>
              <button
                onClick={handleNext}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                Continue to Package Details
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Package Details */}
        {step === 3 && (
          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <Package size={24} className="text-red-500" />
              Package Details
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Package Size
              </label>
              <div className="flex gap-3">
                {['1KG', '5KG', '10KG', '20KG'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setFormData({ ...formData, packageSize: size })}
                    className={`flex-1 py-3 px-4 rounded-lg border-2 transition font-medium ${
                      formData.packageSize === size
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Weight (KG) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={formData.packageWeight}
                onChange={(e) => setFormData({ ...formData, packageWeight: e.target.value })}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.packageWeight ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="e.g., 2.5"
              />
              {errors.packageWeight && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.packageWeight}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.packageDescription}
                onChange={(e) => setFormData({ ...formData, packageDescription: e.target.value })}
                rows={3}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                  errors.packageDescription ? 'border-red-500' : 'border-gray-200'
                }`}
                placeholder="What's inside the package?"
              />
              {errors.packageDescription && (
                <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.packageDescription}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Declared Value (EUR)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.packageValue}
                onChange={(e) => setFormData({ ...formData, packageValue: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Type
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, deliveryType: 'Normal' })}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                    formData.deliveryType === 'Normal'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Normal (3-5 days)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, deliveryType: 'Express' })}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition ${
                    formData.deliveryType === 'Express'
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Express (1-2 days)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                value={formData.specialInstructions}
                onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
                rows={2}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Any special delivery instructions?"
              />
            </div>

            {estimatedCost && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">Estimated Cost:</span>
                  <span className="text-2xl font-bold text-blue-600">€{estimatedCost.toFixed(2)}</span>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium transition"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                {loading ? 'Creating...' : 'Create Shipment & Proceed to Payment'}
                {!loading && <ChevronRight size={20} />}
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  )
}
