import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { pickupLocation, dropOff, packageSize, deliveryType } = await request.json()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Fetch pricing from database
    const { data: pricing, error: pricingError } = await supabase
      .from('pricing')
      .select('*')
      .eq('package_size', packageSize)
      .eq('is_active', true)
      .single()

    if (pricingError || !pricing) {
      // Fallback to default pricing if not found in database
      const defaultPricing = {
        '1KG': { base_price: 10, express_multiplier: 1.5, normal_multiplier: 1.0, estimated_days_express: 1, estimated_days_normal: 3 },
        '5KG': { base_price: 25, express_multiplier: 1.5, normal_multiplier: 1.0, estimated_days_express: 1, estimated_days_normal: 3 },
        '10KG': { base_price: 45, express_multiplier: 1.5, normal_multiplier: 1.0, estimated_days_express: 1, estimated_days_normal: 3 },
      }
      
      const defaultPricingData = defaultPricing[packageSize] || defaultPricing['5KG']
      const multiplier = deliveryType === 'Express' ? defaultPricingData.express_multiplier : defaultPricingData.normal_multiplier
      const totalCost = defaultPricingData.base_price * multiplier
      const estimatedDays = deliveryType === 'Express' ? defaultPricingData.estimated_days_express : defaultPricingData.estimated_days_normal

      return NextResponse.json({
        cost: totalCost,
        currency: 'EUR',
        estimatedDays,
      })
    }

    // Use database pricing
    const multiplier = deliveryType === 'Express' 
      ? parseFloat(pricing.express_multiplier) 
      : parseFloat(pricing.normal_multiplier)
    
    const totalCost = parseFloat(pricing.base_price) * multiplier
    const estimatedDays = deliveryType === 'Express' 
      ? pricing.estimated_days_express 
      : pricing.estimated_days_normal

    return NextResponse.json({
      cost: totalCost,
      currency: 'EUR',
      estimatedDays,
    })
  } catch (error) {
    console.error('Calculate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

