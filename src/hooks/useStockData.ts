
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export const useStockData = () => {
  const [stockPrices, setStockPrices] = useState(null)
  const [stockNews, setStockNews] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchStockData = async (symbol: string) => {
    setLoading(true)
    try {
      const pricesResponse = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ action: 'DAILY_PRICES', symbol })
      })

      const newsResponse = await supabase.functions.invoke('stock-data', {
        body: JSON.stringify({ action: 'NEWS', symbol })
      })

      setStockPrices(pricesResponse.data)
      setStockNews(newsResponse.data)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  const addToWatchlist = async (symbol: string) => {
    const { data, error } = await supabase
      .from('stock_watchlist')
      .insert({ stock_symbol: symbol })
  }

  return { 
    stockPrices, 
    stockNews, 
    loading, 
    error, 
    fetchStockData,
    addToWatchlist 
  }
}
