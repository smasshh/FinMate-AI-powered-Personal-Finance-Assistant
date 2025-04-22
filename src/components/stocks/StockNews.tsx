
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useStockData } from '@/hooks/useStockData';

export const StockNews = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { stockNews, loading, fetchStockNews } = useStockData();

  useEffect(() => {
    // Fetch general market news on component mount
    fetchStockNews();
  }, [fetchStockNews]);

  const renderArticles = (articles: any[]) => {
    if (!articles || articles.length === 0) {
      return <p className="text-muted-foreground">No news available</p>;
    }

    return articles.slice(0, 5).map((article: any, index: number) => (
      <div key={index} className="border-b pb-4 last:border-0">
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Financial News</CardTitle>
        <p className="text-sm text-muted-foreground">Latest market updates and stock-specific news</p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="general">General Market</TabsTrigger>
            <TabsTrigger value="watchlist">Watchlist News</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-4">
            {loading ? (
              <p>Loading news...</p>
            ) : (
              <div className="space-y-4">
                {renderArticles(stockNews?.feed || [])}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="watchlist" className="space-y-4">
            {loading ? (
              <p>Loading watchlist news...</p>
            ) : (
              <div className="space-y-4">
                {renderArticles(stockNews?.feed?.filter((article: any) => 
                  article.ticker_sentiment?.some((ticker: any) => 
                    ticker.relevance_score > 0.5
                  )
                ) || [])}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
