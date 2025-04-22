
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4"

const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SUPABASE_SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

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
    
    // Ensure API key is available
    if (!ALPHA_VANTAGE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Alpha Vantage API key is not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE ?? SUPABASE_ANON_KEY)

    switch(action) {
      case 'DAILY_PRICES':
        const dailyPricesResponse = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`
        )
        const dailyPricesData = await dailyPricesResponse.json()
        
        // Check if response contains error or if the API call limit is reached
        if (dailyPricesData['Error Message'] || dailyPricesData['Note']) {
          return new Response(
            JSON.stringify({ 
              error: dailyPricesData['Error Message'] || dailyPricesData['Note'],
              symbol 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        
        return new Response(JSON.stringify(dailyPricesData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'WEEKLY_PRICES':
        const weeklyPricesResponse = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
        )
        const weeklyPricesData = await weeklyPricesResponse.json()
        
        // Check for errors
        if (weeklyPricesData['Error Message'] || weeklyPricesData['Note']) {
          return new Response(
            JSON.stringify({ 
              error: weeklyPricesData['Error Message'] || weeklyPricesData['Note'],
              symbol 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        
        return new Response(JSON.stringify(weeklyPricesData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'MONTHLY_PRICES':
        const monthlyPricesResponse = await fetch(
          `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
        )
        const monthlyPricesData = await monthlyPricesResponse.json()
        
        // Check for errors
        if (monthlyPricesData['Error Message'] || monthlyPricesData['Note']) {
          return new Response(
            JSON.stringify({ 
              error: monthlyPricesData['Error Message'] || monthlyPricesData['Note'],
              symbol 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        
        return new Response(JSON.stringify(monthlyPricesData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'NEWS':
        const newsResponse = await fetch(
          `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&${symbol ? `tickers=${symbol}` : ''}&apikey=${ALPHA_VANTAGE_API_KEY}`
        )
        const newsData = await newsResponse.json()
        
        // Check for errors
        if (newsData['Error Message'] || newsData['Note']) {
          return new Response(
            JSON.stringify({ 
              error: newsData['Error Message'] || newsData['Note'],
              symbol 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        
        return new Response(JSON.stringify(newsData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'SEARCH':
        const searchResponse = await fetch(
          `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${ALPHA_VANTAGE_API_KEY}`
        )
        const searchData = await searchResponse.json()
        
        // Check for errors
        if (searchData['Error Message'] || searchData['Note']) {
          return new Response(
            JSON.stringify({ 
              error: searchData['Error Message'] || searchData['Note'],
              keywords 
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
        
        return new Response(JSON.stringify(searchData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

      case 'MARKET_INDICES':
        // For Indian market we'll use Global Quote API for Nifty 50, Sensex, etc.
        const symbols = ['NSEI', 'BSESN', 'NIFMDCP50.NS', 'NIFTY_IT.NS'];  // Nifty 50, Sensex, Nifty Midcap, Nifty IT
        const indices = [];
        
        for (const indexSymbol of symbols) {
          try {
            const quoteResponse = await fetch(
              `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${indexSymbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
            );
            const quoteData = await quoteResponse.json();
            
            if (quoteData['Global Quote'] && Object.keys(quoteData['Global Quote']).length > 0) {
              const quote = quoteData['Global Quote'];
              indices.push({
                symbol: indexSymbol,
                price: quote['05. price'],
                change: quote['09. change'],
                changePercent: quote['10. change percent'],
                isPositive: parseFloat(quote['09. change']) >= 0
              });
            }
          } catch (error) {
            console.error(`Error fetching data for ${indexSymbol}:`, error);
          }
        }
        
        return new Response(JSON.stringify({ indices }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'GENERATE_PREDICTION':
        if (!userId) {
          return new Response(
            JSON.stringify({ error: "User ID is required for predictions" }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        try {
          // Get historical prices for prediction
          const historicalDataResponse = await fetch(
            `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`
          );
          
          const historicalData = await historicalDataResponse.json();
          
          // Check if we have valid data
          if (historicalData['Error Message'] || historicalData['Note'] || !historicalData['Time Series (Daily)']) {
            return new Response(
              JSON.stringify({ 
                error: historicalData['Error Message'] || historicalData['Note'] || "No data available for this symbol",
                symbol 
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }
          
          // Get current price from the most recent data
          const timeSeries = historicalData['Time Series (Daily)'] || {};
          const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          
          if (dates.length === 0) {
            return new Response(
              JSON.stringify({ error: "No historical data available", symbol }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }
          
          const latestDate = dates[0];
          const currentPrice = parseFloat(timeSeries[latestDate]['4. close']);
          
          // Gather recent prices for analysis
          const recentPrices = dates.slice(0, Math.min(30, dates.length)).map(date => 
            parseFloat(timeSeries[date]['4. close'])
          );
          
          // Simple prediction algorithm - averaging recent movement trends
          // Calculate average daily change
          let avgChange = 0;
          if (recentPrices.length > 1) {
            const changes = [];
            for (let i = 0; i < recentPrices.length - 1; i++) {
              changes.push((recentPrices[i] - recentPrices[i + 1]) / recentPrices[i + 1]);
            }
            avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
          }
          
          // Predict price for 30 days in the future
          const predictedPrice = currentPrice * (1 + avgChange * 30);
          
          // Calculate volatility (standard deviation / current price)
          let volatility = 0;
          if (recentPrices.length > 1) {
            const mean = recentPrices.reduce((a, b) => a + b, 0) / recentPrices.length;
            const squaredDiffs = recentPrices.map(price => Math.pow(price - mean, 2));
            const variance = squaredDiffs.reduce((a, b) => a + b, 0) / recentPrices.length;
            volatility = Math.sqrt(variance) / currentPrice;
          }
          
          // Confidence score - higher volatility means lower confidence
          const confidenceScore = Math.max(0, Math.min(1, 1 - volatility * 10));
          
          // Calculate prediction date (30 days from today)
          const today = new Date();
          const predictionDate = new Date(today);
          predictionDate.setDate(today.getDate() + 30);
          
          // Store the prediction
          const { error } = await supabase
            .from('stock_predictions')
            .insert({
              user_id: userId,
              stock_symbol: symbol,
              current_price: currentPrice,
              predicted_price: predictedPrice,
              confidence_score: confidenceScore,
              prediction_date: predictionDate.toISOString().split('T')[0],
              created_at: new Date().toISOString()
            });
          
          if (error) throw error;
          
          return new Response(JSON.stringify({ 
            success: true,
            prediction: {
              symbol,
              currentPrice,
              predictedPrice,
              confidenceScore,
              predictionDate: predictionDate.toISOString(),
              recommendation: getRecommendation(currentPrice, predictedPrice)
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (predictionError) {
          console.error("Prediction error:", predictionError);
          return new Response(
            JSON.stringify({ error: "Failed to generate prediction", details: predictionError.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    console.error('Stock data fetch error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200, // Changed to 200 to prevent client-side errors
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

// Helper function to determine buy/sell/hold recommendation
function getRecommendation(currentPrice, predictedPrice) {
  const percentChange = ((predictedPrice - currentPrice) / currentPrice) * 100;
  
  if (percentChange > 5) return "BUY";
  if (percentChange < -5) return "SELL";
  return "HOLD";
}
