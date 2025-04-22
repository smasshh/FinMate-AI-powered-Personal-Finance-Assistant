
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

// Fetch API keys from environment
const ALPACA_API_KEY = Deno.env.get('ALPACA_API_KEY')!;
const ALPACA_SECRET_KEY = Deno.env.get('ALPACA_SECRET_KEY')!;
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Alpaca Trading API Base URL (paper trading)
const ALPACA_BASE_URL = 'https://paper-api.alpaca.markets';

// Handle chat messages using Gemini API
async function processChatMessage(userId: string, message: string) {
  console.log(`Processing chat message from user ${userId}: ${message}`);
  
  try {
    // First, use Gemini to understand the intent and extract trading instructions if any
    const intent = await extractIntentFromMessage(message);
    console.log("Extracted intent:", intent);

    // If this is a trade instruction, handle it appropriately
    if (intent.type === 'EXECUTE_TRADE' && intent.symbol && intent.quantity) {
      // We'll use a two-step approach here. First respond with a confirmation request.
      return {
        intent: 'TRADE_CONFIRMATION',
        messageResponse: `I understand you want to ${intent.side} ${intent.quantity} shares of ${intent.symbol}. Would you like me to execute this trade? Please respond with "Yes" to confirm.`,
        tradeInfo: {
          symbol: intent.symbol,
          quantity: intent.quantity,
          side: intent.side
        }
      };
    } 
    // If user confirmed a trade, execute it
    else if (intent.type === 'CONFIRM_TRADE' && intent.confirm) {
      // Fetch the last pending trade info from the database
      // (In a real implementation, you'd store the pending trade in a session or temporary storage)
      
      // For this demo, we'll assume a simple response
      if (intent.symbol && intent.quantity && intent.side) {
        // Execute the trade
        const tradeResult = await executeTrade(userId, intent.symbol, intent.quantity, intent.side);
        
        if (tradeResult.success) {
          return {
            intent: 'EXECUTE_TRADE',
            messageResponse: `✅ Trade executed successfully! I've ${intent.side === 'buy' ? 'bought' : 'sold'} ${intent.quantity} shares of ${intent.symbol} at $${tradeResult.filledPrice} per share.`,
            tradeInfo: {
              symbol: intent.symbol,
              quantity: intent.quantity,
              side: intent.side
            }
          };
        } else {
          return {
            intent: 'ERROR',
            messageResponse: `❌ Sorry, I couldn't execute your trade: ${tradeResult.error}`
          };
        }
      }
      
      return {
        intent: 'ERROR',
        messageResponse: "I couldn't find the details of the trade you want to confirm. Please provide the complete trading instructions again."
      };
    } 
    // If user asks for portfolio information
    else if (intent.type === 'GET_PORTFOLIO') {
      const positions = await getPortfolioPositions();
      
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
async function extractIntentFromMessage(message: string) {
  // Check for simple buy/sell patterns first to avoid unnecessary API calls
  const buyMatch = message.match(/(?:buy|purchase)\s+(\d+)\s+(?:shares?|stocks?)?(?:\s+of)?\s+([A-Z]+)/i);
  const sellMatch = message.match(/(?:sell|exit)\s+(\d+)\s+(?:shares?|stocks?)?(?:\s+of)?\s+([A-Z]+)/i);
  const portfolioMatch = message.match(/(?:portfolio|holdings|positions|what do i own|show me my stocks)/i);
  const confirmMatch = message.match(/(?:yes|confirm|execute|proceed|go ahead|ok|okay)/i);
  
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
  } else if (confirmMatch) {
    // In a real implementation, you'd retrieve the pending trade from a database or session
    // For this demo, we'll use a simplified approach
    const pendingTradeMatch = message.match(/(?:yes|confirm|execute|proceed).*?(?:buy|sell)\s+(\d+)\s+shares\s+of\s+([A-Z]+)/i);
    
    if (pendingTradeMatch) {
      const side = message.includes('sell') ? 'sell' : 'buy';
      return {
        type: 'CONFIRM_TRADE',
        confirm: true,
        side,
        quantity: parseInt(pendingTradeMatch[1]),
        symbol: pendingTradeMatch[2].toUpperCase()
      };
    }
    
    return {
      type: 'CONFIRM_TRADE',
      confirm: true
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

    return {
      success: tradeResponse.ok,
      orderId: orderData.id,
      status: orderData.status,
      filledPrice: orderData.filled_avg_price || 0
    };
  } catch (error) {
    console.error('Trade execution error:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}

async function getPortfolioPositions() {
  try {
    const positionsResponse = await fetch(`${ALPACA_BASE_URL}/v2/positions`, {
      method: 'GET',
      headers: {
        'APCA-API-KEY-ID': ALPACA_API_KEY,
        'APCA-API-SECRET-KEY': ALPACA_SECRET_KEY
      }
    });

    return await positionsResponse.json();
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
    const { action, userId, symbol, quantity, side, message } = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!, 
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    switch(action) {
      case 'PROCESS_CHAT':
        const chatResult = await processChatMessage(userId, message);
        
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
