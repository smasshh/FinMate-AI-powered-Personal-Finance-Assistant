
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink } from 'lucide-react';

export const StockNews = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Market News</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {stockNews?.feed?.slice(0, 5).map((article: any, index: number) => (
            <div key={index} className="border-b pb-4 last:border-0">
              <h3 className="font-semibold mb-2">{article.title}</h3>
              <p className="text-sm text-muted-foreground mb-2">{article.summary}</p>
              <a 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-500 hover:text-blue-600 inline-flex items-center"
              >
                Read More
                <ExternalLink className="w-4 h-4 ml-1" />
              </a>
            </div>
          )) || <p>No news available</p>}
        </div>
      </CardContent>
    </Card>
  );
};
