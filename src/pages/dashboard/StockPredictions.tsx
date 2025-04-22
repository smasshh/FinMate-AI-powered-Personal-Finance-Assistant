
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'
import { useStockData } from '@/hooks/useStockData'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const StockPredictions = () => {
  const [stockSymbol, setStockSymbol] = useState('')
  const { stockPrices, stockNews, loading, fetchStockData, addToWatchlist } = useStockData()

  const handleSearch = () => {
    if (stockSymbol) {
      fetchStockData(stockSymbol)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Stock Predictions</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Prediction
        </Button>
      </div>
      
      <div className="flex space-x-2 mb-4">
        <Input 
          placeholder="Enter stock symbol (e.g. AAPL)" 
          value={stockSymbol}
          onChange={(e) => setStockSymbol(e.target.value.toUpperCase())}
        />
        <Button onClick={handleSearch} disabled={!stockSymbol}>
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading stock data...</p>
          ) : stockPrices ? (
            <>
              <div className="mb-4">
                <Button onClick={() => addToWatchlist(stockSymbol)}>
                  Add to Watchlist
                </Button>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Open</TableHead>
                    <TableHead>High</TableHead>
                    <TableHead>Low</TableHead>
                    <TableHead>Close</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Implement stock price rendering */}
                </TableBody>
              </Table>
            </>
          ) : (
            <p>Search for a stock to view its data</p>
          )}
        </CardContent>
      </Card>

      {/* News Section */}
      <Card>
        <CardHeader>
          <CardTitle>Stock News</CardTitle>
        </CardHeader>
        <CardContent>
          {stockNews && stockNews.feed ? (
            stockNews.feed.slice(0, 5).map((article, index) => (
              <div key={index} className="mb-4 border-b pb-2">
                <h3 className="font-bold">{article.title}</h3>
                <p>{article.summary}</p>
                <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-500">
                  Read More
                </a>
              </div>
            ))
          ) : (
            <p>No news available</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StockPredictions
