
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"

const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, symbol, keywords, userId } = await req.json()
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE ?? SUPABASE_ANON_KEY)

    switch(action) {
      case 'DAILY_PRICES':
        const dailyPricesResponse = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`
        )
        const dailyPricesData = await dailyPricesResponse.json()
        return new Response(JSON.stringify(dailyPricesData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'WEEKLY_PRICES':
        const weeklyPricesResponse = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
        )
        const weeklyPricesData = await weeklyPricesResponse.json()
        return new Response(JSON.stringify(weeklyPricesData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'MONTHLY_PRICES':
        const monthlyPricesResponse = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
        )
        const monthlyPricesData = await monthlyPricesResponse.json()
        return new Response(JSON.stringify(monthlyPricesData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'NEWS':
        const newsResponse = await fetch(
          `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&${symbol ? `tickers=${symbol}` : ''}&apikey=${ALPHA_VANTAGE_API_KEY}`
        )
        const newsData = await newsResponse.json()
        return new Response(JSON.stringify(newsData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'SEARCH':
        const searchResponse = await fetch(
          `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${ALPHA_VANTAGE_API_KEY}`
        )
        const searchData = await searchResponse.json()
        return new Response(JSON.stringify(searchData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'GENERATE_PREDICTION':
        // Get historical prices
        const historicalDataResponse = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`
        )
        const historicalData = await historicalDataResponse.json()
        
        // Get current price from the most recent data
        const timeSeries = historicalData['Time Series (Daily)'] || {}
        const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
        const latestDate = dates[0]
        const currentPrice = parseFloat(timeSeries[latestDate]['4. close'])
        
        // Simple prediction algorithm (this is just a placeholder for demonstration)
        // In a real application, you'd use a more sophisticated prediction model
        const recentPrices = dates.slice(0, 30).map(date => parseFloat(timeSeries[date]['4. close']))
        const avgChange = recentPrices.slice(0, 29).reduce((acc, price, i) => {
          return acc + ((recentPrices[i] - recentPrices[i + 1]) / recentPrices[i + 1])
        }, 0) / 29
        
        // Predict price for 30 days in the future
        const predictedPrice = currentPrice * (1 + avgChange * 30)
        
        // Calculate a confidence score based on volatility
        const volatility = Math.sqrt(recentPrices.reduce((acc, price) => {
          const diff = price - (recentPrices.reduce((sum, p) => sum + p, 0) / recentPrices.length)
          return acc + (diff * diff)
        }, 0) / recentPrices.length) / currentPrice
        
        const confidenceScore = Math.max(0, Math.min(1, 1 - volatility * 10))
        
        // Calculate prediction date (30 days from today)
        const today = new Date()
        const predictionDate = new Date(today)
        predictionDate.setDate(today.getDate() + 30)
        
        // Store the prediction
        const { error } = await supabase
          .from('stock_predictions')
          .insert({
            user_id: userId,
            stock_symbol: symbol,
            current_price: currentPrice,
            predicted_price: predictedPrice,
            confidence_score: confidenceScore,
            prediction_date: predictionDate.toISOString().split('T')[0]
          })
        
        if (error) throw error
        
        return new Response(JSON.stringify({ 
          success: true,
          prediction: {
            symbol,
            currentPrice,
            predictedPrice,
            confidenceScore,
            predictionDate: predictionDate.toISOString()
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    console.error('Stock data fetch error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
