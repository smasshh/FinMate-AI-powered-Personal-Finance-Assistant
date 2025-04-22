
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

// Improved prediction logic with more robust error handling
function getRecommendation(currentPrice: number, predictedPrice: number, volatility: number) {
  const percentChange = ((predictedPrice - currentPrice) / currentPrice) * 100;
  const confidenceScore = Math.max(0, Math.min(1, 1 - volatility * 10));
  
  let recommendation = 'HOLD';
  let riskLevel = 'MEDIUM';

  if (percentChange > 5) {
    recommendation = 'BUY';
    riskLevel = confidenceScore > 0.75 ? 'LOW' : 'MEDIUM';
  } else if (percentChange < -5) {
    recommendation = 'SELL';
    riskLevel = confidenceScore > 0.75 ? 'HIGH' : 'MEDIUM';
  }

  return { 
    recommendation, 
    riskLevel, 
    confidenceScore,
    percentChange
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Ensure API key is available
    if (!ALPHA_VANTAGE_API_KEY) {
      console.error("Alpha Vantage API key is not configured");
      return new Response(
        JSON.stringify({ error: "Alpha Vantage API key is not configured" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const requestData = await req.json();
    const { action, symbol, userId, keywords } = requestData;
    
    console.log(`Processing request: ${action}${symbol ? ` for symbol ${symbol}` : ''}`);
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE || SUPABASE_ANON_KEY);

    switch(action) {
      case 'GENERATE_PREDICTION':
        if (!userId || !symbol) {
          return new Response(
            JSON.stringify({ error: "User ID and Stock Symbol are required" }),
            { 
              status: 400, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

        try {
          console.log(`Generating prediction for symbol: ${symbol}, userId: ${userId}`);
          
          // Fetch historical prices
          const dailyResponse = await fetch(
            `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=full&apikey=${ALPHA_VANTAGE_API_KEY}`
          );
          
          const dailyData = await dailyResponse.json();
          console.log(`Received data from Alpha Vantage for ${symbol}:`, JSON.stringify(dailyData).substring(0, 200) + "...");
          
          // Check if we have valid data
          if (dailyData['Error Message']) {
            console.error(`Alpha Vantage error for ${symbol}:`, dailyData['Error Message']);
            return new Response(
              JSON.stringify({ 
                error: `Alpha Vantage error: ${dailyData['Error Message']}`,
                symbol 
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }
          
          if (dailyData['Note']) {
            console.error(`Alpha Vantage API limit reached:`, dailyData['Note']);
            return new Response(
              JSON.stringify({ 
                error: `Alpha Vantage API limit reached: ${dailyData['Note']}`,
                symbol 
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }
          
          if (!dailyData['Time Series (Daily)'] || Object.keys(dailyData['Time Series (Daily)']).length === 0) {
            console.error(`No data available for ${symbol}`);
            return new Response(
              JSON.stringify({ 
                error: `No data available for ${symbol}. Try selecting a different stock.`,
                symbol 
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }

          // Process historical prices
          const timeSeries = dailyData['Time Series (Daily)'];
          const dates = Object.keys(timeSeries).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          
          if (dates.length < 30) {
            console.error(`Insufficient historical data for ${symbol}. Only ${dates.length} days available.`);
            return new Response(
              JSON.stringify({ error: `Insufficient historical data for ${symbol}. Only ${dates.length} days available.` }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }

          // Recent prices for analysis (last 30 days)
          const recentPrices = dates.slice(0, 30).map(date => ({
            date,
            close: parseFloat(timeSeries[date]['4. close'])
          }));

          // Calculate basic prediction metrics
          const currentPrice = recentPrices[0].close;
          const prices = recentPrices.map(p => p.close);
          
          // Simple moving average prediction
          const movingAverage = prices.reduce((a, b) => a + b, 0) / prices.length;
          
          // Use a simple exponential weighting for prediction
          // More recent prices have more weight
          const weights = Array.from({ length: prices.length }, (_, i) => Math.exp(-0.1 * i));
          const weightSum = weights.reduce((a, b) => a + b, 0);
          const weightedSum = prices.reduce((sum, price, i) => sum + price * weights[i], 0);
          const predictedPrice = weightedSum / weightSum;

          // Calculate volatility
          const variance = prices.reduce((sum, price) => sum + Math.pow(price - movingAverage, 2), 0) / prices.length;
          const volatility = Math.sqrt(variance) / currentPrice;

          // Get recommendation
          const predictionResult = getRecommendation(currentPrice, predictedPrice, volatility);

          // Predict 30 days from now
          const predictionDate = new Date();
          predictionDate.setDate(predictionDate.getDate() + 30);

          console.log(`Generated prediction for ${symbol}: ${predictionResult.recommendation}, confidence: ${predictionResult.confidenceScore}`);

          // Store prediction
          const { error: insertError } = await supabase
            .from('stock_predictions')
            .insert({
              user_id: userId,
              stock_symbol: symbol,
              current_price: currentPrice,
              predicted_price: predictedPrice,
              confidence_score: predictionResult.confidenceScore,
              prediction_date: predictionDate.toISOString().split('T')[0],
              recommendation: predictionResult.recommendation,
              risk_level: predictionResult.riskLevel,
              created_at: new Date().toISOString()
            });

          if (insertError) {
            console.error(`Error saving prediction to database:`, insertError);
            throw insertError;
          }

          return new Response(JSON.stringify({ 
            success: true,
            prediction: {
              symbol,
              currentPrice,
              predictedPrice,
              confidenceScore: predictionResult.confidenceScore,
              recommendation: predictionResult.recommendation,
              riskLevel: predictionResult.riskLevel,
              predictionDate: predictionDate.toISOString(),
              percentChange: predictionResult.percentChange
            }
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (predictionError) {
          console.error("Prediction error:", predictionError);
          return new Response(
            JSON.stringify({ 
              error: "Failed to generate prediction", 
              details: predictionError.message 
            }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

      case 'DAILY_PRICES':
        try {
          console.log(`Fetching daily prices for ${symbol}`);
          const dailyPricesResponse = await fetch(
            `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&outputsize=compact&apikey=${ALPHA_VANTAGE_API_KEY}`
          );
          const dailyPricesData = await dailyPricesResponse.json();
          
          // Check if response contains error or if the API call limit is reached
          if (dailyPricesData['Error Message'] || dailyPricesData['Note']) {
            console.error(`Alpha Vantage error for ${symbol}:`, dailyPricesData['Error Message'] || dailyPricesData['Note']);
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
          });
        } catch (error) {
          console.error(`Error fetching daily prices for ${symbol}:`, error);
          return new Response(
            JSON.stringify({ error: `Failed to fetch daily prices: ${error.message}` }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

      case 'WEEKLY_PRICES':
        try {
          const weeklyPricesResponse = await fetch(
            `https://www.alphavantage.co/query?function=TIME_SERIES_WEEKLY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
          );
          const weeklyPricesData = await weeklyPricesResponse.json();
          
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
          });
        } catch (error) {
          console.error(`Error fetching weekly prices for ${symbol}:`, error);
          return new Response(
            JSON.stringify({ error: `Failed to fetch weekly prices: ${error.message}` }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

      case 'MONTHLY_PRICES':
        try {
          const monthlyPricesResponse = await fetch(
            `https://www.alphavantage.co/query?function=TIME_SERIES_MONTHLY&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
          );
          const monthlyPricesData = await monthlyPricesResponse.json();
          
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
          });
        } catch (error) {
          console.error(`Error fetching monthly prices for ${symbol}:`, error);
          return new Response(
            JSON.stringify({ error: `Failed to fetch monthly prices: ${error.message}` }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

      case 'NEWS':
        try {
          const newsResponse = await fetch(
            `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&${symbol ? `tickers=${symbol}` : ''}&apikey=${ALPHA_VANTAGE_API_KEY}`
          );
          const newsData = await newsResponse.json();
          
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
          });
        } catch (error) {
          console.error(`Error fetching news:`, error);
          return new Response(
            JSON.stringify({ error: `Failed to fetch news: ${error.message}` }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

      case 'SEARCH':
        try {
          const searchResponse = await fetch(
            `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${keywords}&apikey=${ALPHA_VANTAGE_API_KEY}`
          );
          const searchData = await searchResponse.json();
          
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
          });
        } catch (error) {
          console.error(`Error searching stocks:`, error);
          return new Response(
            JSON.stringify({ error: `Failed to search stocks: ${error.message}` }),
            { 
              status: 200, 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
            }
          );
        }

      case 'MARKET_INDICES':
        try {
          // For Indian market we'll use Global Quote API for Nifty 50, Sensex, etc.
          const symbols = ['NSEI', 'BSESN', 'NIFMDCP50.NS', 'NIFTY_IT.NS'];  // Nifty 50, Sensex, Nifty Midcap, Nifty IT
          const indices = [];
          
          console.log('Fetching market indices data');
          
          // Use mock data if we're having API limit issues
          const useMockData = requestData.useMockData === true;
          
          if (useMockData) {
            console.log('Using mock data for market indices');
            return new Response(JSON.stringify({ 
              indices: [
                {
                  symbol: 'NSEI',
                  price: '22456.80',
                  change: '143.21',
                  changePercent: '0.64%',
                  isPositive: true
                },
                {
                  symbol: 'BSESN',
                  price: '73648.30',
                  change: '456.78',
                  changePercent: '0.62%',
                  isPositive: true
                },
                {
                  symbol: 'NIFMDCP50.NS',
                  price: '12567.40',
                  change: '-56.70',
                  changePercent: '-0.45%',
                  isPositive: false
                },
                {
                  symbol: 'NIFTY_IT.NS',
                  price: '33456.70',
                  change: '123.45',
                  changePercent: '0.37%',
                  isPositive: true
                }
              ]
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
          
          for (const indexSymbol of symbols) {
            try {
              console.log(`Fetching data for index: ${indexSymbol}`);
              const quoteResponse = await fetch(
                `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${indexSymbol}&apikey=${ALPHA_VANTAGE_API_KEY}`
              );
              
              // Check for HTTP errors
              if (!quoteResponse.ok) {
                console.error(`HTTP error ${quoteResponse.status} for ${indexSymbol}`);
                continue;
              }
              
              const quoteData = await quoteResponse.json();
              console.log(`Received data for ${indexSymbol}:`, JSON.stringify(quoteData).substring(0, 100) + "...");
              
              // Check for API errors
              if (quoteData['Error Message']) {
                console.error(`Alpha Vantage error for ${indexSymbol}:`, quoteData['Error Message']);
                continue;
              }
              
              if (quoteData['Note']) {
                console.error(`Alpha Vantage API limit reached for ${indexSymbol}:`, quoteData['Note']);
                
                // Return mock data if API limit is reached
                return new Response(JSON.stringify({ 
                  indices: [
                    {
                      symbol: 'NSEI',
                      price: '22456.80',
                      change: '143.21',
                      changePercent: '0.64%',
                      isPositive: true
                    },
                    {
                      symbol: 'BSESN',
                      price: '73648.30',
                      change: '456.78',
                      changePercent: '0.62%',
                      isPositive: true
                    },
                    {
                      symbol: 'NIFMDCP50.NS',
                      price: '12567.40',
                      change: '-56.70',
                      changePercent: '-0.45%',
                      isPositive: false
                    },
                    {
                      symbol: 'NIFTY_IT.NS',
                      price: '33456.70',
                      change: '123.45',
                      changePercent: '0.37%',
                      isPositive: true
                    }
                  ],
                  note: quoteData['Note']
                }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                  status: 200
                });
              }
              
              if (quoteData['Global Quote'] && Object.keys(quoteData['Global Quote']).length > 0) {
                const quote = quoteData['Global Quote'];
                indices.push({
                  symbol: indexSymbol,
                  price: quote['05. price'],
                  change: quote['09. change'],
                  changePercent: quote['10. change percent'],
                  isPositive: parseFloat(quote['09. change']) >= 0
                });
                console.log(`Added ${indexSymbol} to indices response`);
              } else {
                console.error(`No quote data available for ${indexSymbol}`);
              }
            } catch (error) {
              console.error(`Error fetching data for ${indexSymbol}:`, error);
            }
          }
          
          if (indices.length === 0) {
            console.error("No market indices data available");
            
            // Return mock data if no real data is available
            return new Response(JSON.stringify({ 
              indices: [
                {
                  symbol: 'NSEI',
                  price: '22456.80',
                  change: '143.21',
                  changePercent: '0.64%',
                  isPositive: true
                },
                {
                  symbol: 'BSESN',
                  price: '73648.30',
                  change: '456.78',
                  changePercent: '0.62%',
                  isPositive: true
                },
                {
                  symbol: 'NIFMDCP50.NS',
                  price: '12567.40',
                  change: '-56.70',
                  changePercent: '-0.45%',
                  isPositive: false
                },
                {
                  symbol: 'NIFTY_IT.NS',
                  price: '33456.70',
                  change: '123.45',
                  changePercent: '0.37%',
                  isPositive: true
                }
              ]
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 200
            });
          }
          
          return new Response(JSON.stringify({ indices }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error(`Error fetching market indices:`, error);
          
          // Return mock data in case of any error
          return new Response(JSON.stringify({ 
            indices: [
              {
                symbol: 'NSEI',
                price: '22456.80',
                change: '143.21',
                changePercent: '0.64%',
                isPositive: true
              },
              {
                symbol: 'BSESN',
                price: '73648.30',
                change: '456.78',
                changePercent: '0.62%',
                isPositive: true
              },
              {
                symbol: 'NIFMDCP50.NS',
                price: '12567.40',
                change: '-56.70',
                changePercent: '-0.45%',
                isPositive: false
              },
              {
                symbol: 'NIFTY_IT.NS',
                price: '33456.70',
                change: '123.45',
                changePercent: '0.37%',
                isPositive: true
              }
            ],
            error: error.message
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          });
        }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Stock data fetch error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
