
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Loader2 } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useStockData } from '@/hooks/useStockData';
import { Button } from '@/components/ui/button';

export const StockNews = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { stockNews, loading, fetchStockNews } = useStockData();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Fetch general market news on component mount
    loadNews();
  }, []);

  const loadNews = async (symbol?: string) => {
    setErrorMessage(null);
    try {
      const data = await fetchStockNews(symbol);
      if (!data || data.error) {
        setErrorMessage(data?.error || "Could not fetch news. The API may have reached its quota limit.");
      }
    } catch (error) {
      console.error("Error loading news:", error);
      setErrorMessage("Failed to load news. Please try again later.");
    }
  };
  
  const renderArticles = (articles: any[]) => {
    if (!articles || articles.length === 0) {
      return <p className="text-muted-foreground">No news available</p>;
    }

    return articles.slice(0, 5).map((article: any, index: number) => (
      <div key={index} className="border-b pb-4 last:border-0 mb-4">
        <h3 className="font-semibold mb-2">{article.title}</h3>
        <p className="text-sm text-muted-foreground mb-2">{article.summary}</p>
        <div className="flex justify-between items-center">
          <a 
            href={article.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:text-blue-600 inline-flex items-center"
          >
            Read More
            <ExternalLink className="w-4 h-4 ml-1" />
          </a>
          <span className="text-xs text-muted-foreground">
            {new Date(article.time_published || Date.now()).toLocaleDateString()}
          </span>
        </div>
        {article.ticker_sentiment && article.ticker_sentiment.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {article.ticker_sentiment.map((ticker: any, i: number) => (
              <span key={i} className="text-xs px-2 py-1 bg-slate-100 rounded-full">
                {ticker.ticker}
              </span>
            ))}
          </div>
        )}
      </div>
    ));
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'general') {
      loadNews();
    } else if (value === 'watchlist') {
      // Use the existing news but filter them for watchlist stocks
      // This avoids making another API call which might hit rate limits
    }
  };

  const getWatchlistNews = () => {
    if (!stockNews?.feed) return [];
    
    // Filter news for articles with ticker sentiments
    return stockNews.feed.filter((article: any) => 
      article.ticker_sentiment?.some((ticker: any) => 
        ticker.relevance_score > 0.5
      )
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial News</CardTitle>
        <p className="text-sm text-muted-foreground">Latest market updates and stock-specific news</p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => loadNews()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Refresh News
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="general">General Market</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist News</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : errorMessage ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{errorMessage}</p>
                <Button variant="outline" className="mt-4" onClick={() => loadNews()}>
                  Try Again
                </Button>
              </div>
            ) : stockNews?.feed ? (
              <div className="space-y-4">
                {renderArticles(stockNews.feed)}
                {stockNews.feed.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">No news available at this time.</p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No news data available.</p>
                <Button variant="outline" className="mt-4" onClick={() => loadNews()}>
                  Load News
                </Button>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="watchlist" className="space-y-4">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : errorMessage ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{errorMessage}</p>
                <Button variant="outline" className="mt-4" onClick={() => loadNews()}>
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {renderArticles(getWatchlistNews())}
                {getWatchlistNews().length === 0 && (
                  <p className="text-center py-4 text-muted-foreground">
                    No news available for stocks in your watchlist.
                  </p>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

const RefreshCw = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);
