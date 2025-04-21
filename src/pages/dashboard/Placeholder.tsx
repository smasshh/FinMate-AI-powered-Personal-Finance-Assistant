
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Wrench } from "lucide-react";

interface PlaceholderProps {
  title: string;
  description: string;
}

const Placeholder = ({ title, description }: PlaceholderProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wrench className="h-5 w-5 mr-2 text-finance-blue" />
            Under Construction
          </CardTitle>
          <CardDescription>This feature is coming soon</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center p-12">
          <div className="text-center">
            <div className="bg-gray-100 p-6 rounded-full inline-block mb-4">
              <Wrench className="h-12 w-12 text-finance-blue" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              We're building {title.toLowerCase()}
            </h3>
            <p className="text-gray-600 max-w-md mx-auto mb-6">
              This section is currently under development and will be available soon. 
              Check back later for updates!
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Placeholder;
