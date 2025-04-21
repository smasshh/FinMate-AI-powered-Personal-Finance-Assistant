
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft } from "lucide-react";

const Register = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agreeTerms) {
      alert("You must agree to the terms and conditions");
      return;
    }
    
    setIsLoading(true);
    
    // Here we'll connect to Supabase auth when it's integrated
    // For now, simulate loading
    setTimeout(() => {
      setIsLoading(false);
      // Later will redirect to dashboard once auth is implemented
      console.log("Registration attempted with:", { fullName, email, password });
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="absolute top-4 left-4">
        <Link to="/" className="text-gray-600 hover:text-finance-blue flex items-center">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Home
        </Link>
      </div>
      
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-finance-blue text-white flex items-center justify-center font-bold text-xl mb-4">F</div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-gray-600 mt-1">Start your financial journey with FinMate</p>
        </div>
        
        <form onSubmit={handleRegister}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input 
                id="fullName" 
                placeholder="John Doe" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="Create a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-gray-500">
                Must contain at least 8 characters including a number and a special character
              </p>
            </div>
            
            <div className="flex items-start space-x-2">
              <Checkbox 
                id="terms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm font-normal leading-tight">
                I agree to the{" "}
                <Link to="/terms" className="text-finance-blue hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" className="text-finance-blue hover:underline">
                  Privacy Policy
                </Link>
              </Label>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading || !agreeTerms}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-finance-blue hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
