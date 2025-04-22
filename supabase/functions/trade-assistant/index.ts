
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Fetch API keys from environment
const ALPACA_API_KEY = Deno.env.get('ALPACA_API_KEY')!;
const ALPACA_SECRET_KEY = Deno.env.get('ALPACA_SECRET_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY')!;

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Alpaca Trading API Base URL (paper trading)
const ALPACA_BASE_URL = 'https://paper-api.alpaca.markets';

// Handle chat messages using Gemini API
async function processChatMessage(userId: string, message: string, pendingTrade: any = null) {
  console.log(`Processing chat message from user ${userId}: ${message}`);
  console.log(`Pending trade: ${JSON.stringify(pendingTrade)}`);
  
  try {
    // First, use Gemini to understand the intent and extract trading instructions if any
    const intent = await extractIntentFromMessage(message, pendingTrade);
    console.log("Extracted intent:", intent);

    // If this is a trade instruction, handle it appropriately
    if (intent.type === 'EXECUTE_TRADE' && intent.symbol && intent.quantity) {
      // We'll use a two-step approach here. First respond with a confirmation request.
      // Get real-time price from Alpha Vantage for better user experience
      const stockPrice = await getStockPrice(intent.symbol);
      const estimatedCost = stockPrice * intent.quantity;
      
      return {
        intent: 'TRADE_CONFIRMATION',
        messageResponse: `I understand you want to ${intent.side} ${intent.quantity} shares of ${intent.symbol}. Current price is $${stockPrice.toFixed(2)}, for an estimated total of $${estimatedCost.toFixed(2)}. Would you like me to execute this trade? Please respond with "Yes" to confirm.`,
        tradeInfo: {
          symbol: intent.symbol,
          quantity: intent.quantity,
          side: intent.side
        }
      };
    } 
    // If user confirmed a trade, execute it
    else if (intent.type === 'CONFIRM_TRADE' && intent.confirm) {
      // Use the pending trade information if available, otherwise try to extract from message
      const tradeDetails = pendingTrade || {}; 
      const symbol = tradeDetails.symbol || intent.symbol;
      const quantity = tradeDetails.quantity || intent.quantity;
      const side = tradeDetails.side || intent.side;
      
      if (!symbol || !quantity || !side) {
        return {
          intent: 'ERROR',
          messageResponse: "I couldn't find the details of the trade you want to confirm. Please provide the complete trading instructions again."
        };
      }
      
      // Execute the trade
      const tradeResult = await executeTrade(userId, symbol, quantity, side);
      
      if (tradeResult.success) {
        return {
          intent: 'EXECUTE_TRADE',
          messageResponse: `✅ Trade executed successfully! I've ${side === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${symbol} at $${tradeResult.filledPrice.toFixed(2)} per share.`,
          tradeInfo: {
            symbol,
            quantity,
            side
          }
        };
      } else {
        return {
          intent: 'ERROR',
          messageResponse: `❌ Sorry, I couldn't execute your trade: ${tradeResult.error}`
        };
      }
    } 
    // If user asks for portfolio information
    else if (intent.type === 'GET_PORTFOLIO') {
      const positions = await getPortfolioPositions(ALPACA_API_KEY, ALPACA_SECRET_KEY);
      
      if (positions.length === 0) {
        return {
          intent: 'GET_PORTFOLIO',
          messageResponse: "You don't have any positions in your portfolio yet. Would you like me to help you make your first investment?"
        };
      }
      
      const totalValue = positions.reduce((sum, pos) => sum + Number(pos.market_value), 0);
      const totalPL = positions.reduce((sum, pos) => sum + Number(pos.unrealized_pl), 0);
      
      let positionsList = "";
      positions.forEach(pos => {
        positionsList += `\n• ${pos.symbol}: ${pos.qty} shares, Value: $${Number(pos.market_value).toFixed(2)}, P/L: $${Number(pos.unrealized_pl).toFixed(2)}`;
      });
      
      return {
        intent: 'GET_PORTFOLIO',
        messageResponse: `📊 Your portfolio contains ${positions.length} positions with a total value of $${totalValue.toFixed(2)} and an unrealized P/L of $${totalPL.toFixed(2)}.${positionsList}`
      };
    }
    // If user asks for stock information
    else if (intent.type === 'GET_STOCK_INFO' && intent.symbol) {
      const price = await getStockPrice(intent.symbol);
      
      if (price === 0) {
        return {
          intent: 'ERROR',
          messageResponse: `I couldn't find information for ${intent.symbol}. Please check the symbol and try again.`
        };
      }
      
      const stockInfo = await getStockInfo(intent.symbol);
      
      if (stockInfo) {
        return {
          intent: 'GET_STOCK_INFO',
          messageResponse: `📈 **${stockInfo.name} (${intent.symbol})** \n\nCurrent Price: $${price.toFixed(2)} \n\n${stockInfo.description?.substring(0, 300) || 'No detailed description available.'}...`
        };
      } else {
        return {
          intent: 'GET_STOCK_INFO',
          messageResponse: `📈 ${intent.symbol} is currently trading at $${price.toFixed(2)}.`
        };
      }
    }
    // For any other type of message, provide a helpful response
    else {
      // Use Gemini to generate a conversational response
      return {
        intent: 'GENERAL',
        messageResponse: await generateChatResponse(message)
      };
    }
  } catch (error) {
    console.error('Error processing chat message:', error);
    return { 
      intent: 'ERROR',
      messageResponse: `I'm sorry, I encountered an error processing your request: ${error.message}. Please try again.` 
    };
  }
}

// Extract trading intent from user message using Gemini
async function extractIntentFromMessage(message: string, pendingTrade: any = null) {
  // For confirming trades with "yes" - use the pending trade
  if (pendingTrade && /^(yes|confirm|ok|okay|yeah|sure|execute|do it)$/i.test(message.trim())) {
    return {
      type: 'CONFIRM_TRADE',
      confirm: true,
      symbol: pendingTrade.symbol,
      quantity: pendingTrade.quantity,
      side: pendingTrade.side
    };
  }
  
  // Check for simple buy/sell patterns first to avoid unnecessary API calls
  const buyMatch = message.match(/(?:buy|purchase)\s+(\d+)\s+(?:shares?|stocks?)?(?:\s+of)?\s+([A-Z]+)/i);
  const sellMatch = message.match(/(?:sell|exit)\s+(\d+)\s+(?:shares?|stocks?)?(?:\s+of)?\s+([A-Z]+)/i);
  const portfolioMatch = message.match(/(?:portfolio|holdings|positions|what do i own|show me my stocks)/i);
  const confirmMatch = message.match(/(?:yes|confirm|execute|proceed|go ahead|ok|okay)/i);
  const stockInfoMatch = message.match(/(?:info|information|details|price|about|analyze|what'?s the price of)\s+(?:stock|ticker|symbol)?\s*([A-Z]+)/i);
  
  // Simple hardcoded pattern matching as a fallback/optimization
  if (buyMatch) {
    return {
      type: 'EXECUTE_TRADE',
      side: 'buy',
      quantity: parseInt(buyMatch[1]),
      symbol: buyMatch[2].toUpperCase(),
    };
  } else if (sellMatch) {
    return {
      type: 'EXECUTE_TRADE',
      side: 'sell',
      quantity: parseInt(sellMatch[1]),
      symbol: sellMatch[2].toUpperCase(),
    };
  } else if (portfolioMatch) {
    return {
      type: 'GET_PORTFOLIO'
    };
  } else if (confirmMatch && pendingTrade) {
    return {
      type: 'CONFIRM_TRADE',
      confirm: true,
      symbol: pendingTrade.symbol,
      quantity: pendingTrade.quantity,
      side: pendingTrade.side
    };
  } else if (stockInfoMatch) {
    return {
      type: 'GET_STOCK_INFO',
      symbol: stockInfoMatch[1].toUpperCase()
    };
  }

  try {
    // For more complex queries, we could use the Gemini API
    // This is a simplified implementation
    return {
      type: 'GENERAL',
      message: message
    };
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    // Fallback to general response
    return {
      type: 'GENERAL',
      message: message
    };
  }
}

// Get real-time stock price from Alpha Vantage
async function getStockPrice(symbol: string): Promise<number> {
  try {
    console.log(`Fetching stock price for ${symbol} from Alpha Vantage`);
    const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`);
    const data = await response.json();
    
    if (data['Global Quote'] && data['Global Quote']['05. price']) {
      return parseFloat(data['Global Quote']['05. price']);
    }
    
    // Fallback to Alpaca API if Alpha Vantage fails
    console.log(`Alpha Vantage failed, falling back to Alpaca API for ${symbol}`);
    const alpacaResponse = await fetch(`${ALPACA_BASE_URL}/v2/stocks/${symbol}/trades/latest`, {
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY
      }
    });
    
    const alpacaData = await alpacaResponse.json();
    if (alpacaData.trade && alpacaData.trade.p) {
      return alpacaData.trade.p;
    }
    
    // Default fallback
    return 0;
  } catch (error) {
    console.error('Error fetching stock price:', error);
    return 0;
  }
}

// Get detailed stock information from Alpha Vantage
async function getStockInfo(symbol: string) {
  try {
    console.log(`Fetching stock info for ${symbol} from Alpha Vantage`);
    const response = await fetch(`https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`);
    const data = await response.json();
    
    if (data.Name) {
      return {
        name: data.Name,
        description: data.Description || `No detailed description available for ${data.Name}`,
        sector: data.Sector,
        industry: data.Industry,
        marketCap: data.MarketCapitalization,
        peRatio: data.PERatio,
        dividendYield: data.DividendYield
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching stock info:', error);
    return null;
  }
}

// Generate conversational response using Gemini (simplified implementation)
async function generateChatResponse(message: string) {
  // In a production app, you would call the Gemini API here
  // Simplified implementation with hardcoded responses
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return "Hello! I'm your AI trading assistant. How can I help you today? You can ask me to buy or sell stocks, check your portfolio, or get market information.";
  } else if (lowerMessage.includes('help')) {
    return "I can help you with trading stocks. Try commands like:\n• 'Buy 5 shares of AAPL'\n• 'Sell 3 shares of MSFT'\n• 'Show my portfolio'\n• 'What's the price of TSLA?'";
  } else if (lowerMessage.includes('market') || lowerMessage.includes('today')) {
    return "The market today is generally mixed. Major indices like S&P 500 and Nasdaq are showing moderate movements. Is there a specific sector or stock you're interested in?";
  } else if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
    return "I'm not able to provide specific investment recommendations. However, I can help you execute trades or analyze your existing portfolio. What would you like to do?";
  } else {
    return "I'm not sure how to respond to that. You can ask me to buy or sell stocks, check your portfolio, or get general market information. How can I assist you with your trading today?";
  }
}

async function executeTrade(userId: string, symbol: string, quantity: number, side: 'buy' | 'sell') {
  try {
    console.log(`Executing ${side} trade for ${quantity} shares of ${symbol}`);
    
    const tradeResponse = await fetch(`${ALPACA_BASE_URL}/v2/orders`, {
      method: 'POST',
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        symbol: symbol,
        qty: quantity,
        side: side,
        type: 'market',
        time_in_force: 'gtc'
      })
    });

    const orderData = await tradeResponse.json();
    console.log("Alpaca order response:", orderData);
    
    // Get current price for storing in the trade record
    const currentPrice = await getStockPrice(symbol);
    console.log(`Current price for ${symbol}: $${currentPrice}`);
    
    // If order is successful, store in Supabase
    if (tradeResponse.ok) {
      // Create a Supabase client
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!, 
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      // Store the trade price (either from order or from current price)
      const price = orderData.filled_avg_price 
        ? parseFloat(orderData.filled_avg_price) 
        : currentPrice;
      
      console.log(`Inserting trade record with price: $${price}`);
      
      // Insert trade into the user_trades table
      await supabase
        .from('user_trades')
        .insert({
          user_id: userId,
          symbol: symbol,
          quantity: quantity,
          trade_type: side,
          price_at_execution: price,
          alpaca_order_id: orderData.id,
          status: orderData.status,
          via_chatbot: true
        });
    }

    return {
      success: tradeResponse.ok,
      orderId: orderData.id,
      status: orderData.status,
      filledPrice: orderData.filled_avg_price ? parseFloat(orderData.filled_avg_price) : currentPrice,
      error: tradeResponse.ok ? null : orderData.message || 'Unknown error'
    };
  } catch (error) {
    console.error('Trade execution error:', error);
    return { 
      success: false, 
      error: error.message,
      filledPrice: 0
    };
  }
}

async function getPortfolioPositions(apiKey = ALPACA_API_KEY, secretKey = ALPACA_SECRET_KEY) {
  try {
    console.log("Fetching portfolio positions from Alpaca");
    const positionsResponse = await fetch(`${ALPACA_BASE_URL}/v2/positions`, {
      method: 'GET',
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey
      }
    });

    if (!positionsResponse.ok) {
      console.error(`Alpaca API error: ${positionsResponse.status} ${positionsResponse.statusText}`);
      const errorText = await positionsResponse.text();
      console.error(`Error response: ${errorText}`);
      return [];
    }

    const positions = await positionsResponse.json();
    console.log(`Retrieved ${positions.length} positions`);
    return positions;
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { action, userId, symbol, quantity, side, message, pendingTrade } = await req.json();
    console.log(`Processing request with action: ${action}`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    switch(action) {
      case 'PROCESS_CHAT':
        const chatResult = await processChatMessage(userId, message, pendingTrade);
        
        // Store chat in database for history
        const { error: chatError } = await supabase
          .from('chat_history')
          .insert({
            user_id: userId,
            message: message,
            response: chatResult.messageResponse,
            chat_type: 'trading'
          });

        if (chatError) console.error('Supabase chat insert error:', chatError);
        
        return new Response(JSON.stringify(chatResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'EXECUTE_TRADE':
        const tradeResult = await executeTrade(userId, symbol, quantity, side);
        
        if (tradeResult.success) {
          // Store trade in Supabase
          const { error } = await supabase
            .from('user_trades')
            .insert({
              user_id: userId,
              symbol: symbol,
              quantity: quantity,
              trade_type: side,
              price_at_execution: Number(tradeResult.filledPrice || 0),
              alpaca_order_id: tradeResult.orderId,
              status: tradeResult.status
            });

          if (error) console.error('Supabase trade insert error:', error);
        }

        return new Response(JSON.stringify(tradeResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      case 'GET_PORTFOLIO':
        const positions = await getPortfolioPositions();
        
        // Optional: Store portfolio snapshot
        const portfolioValue = positions.reduce((total, pos) => 
          total + (Number(pos.market_value) || 0), 0);
        
        const { error: snapshotError } = await supabase
          .from('portfolio_snapshots')
          .insert({
            user_id: userId,
            portfolio_value: portfolioValue,
            positions_data: JSON.stringify(positions)
          });

        if (snapshotError) console.error('Portfolio snapshot error:', snapshotError);

        return new Response(JSON.stringify(positions), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
  } catch (error) {
    console.error('Trade Assistant Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
