
import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  LineChart,
  CreditCard,
  Brain,
  MessageSquare,
  Settings,
  User,
  LogOut,
  Menu as MenuIcon
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { 
    icon: <LayoutDashboard className="h-5 w-5" />, 
    label: "Dashboard", 
    path: "/dashboard" 
  },
  { 
    icon: <DollarSign className="h-5 w-5" />, 
    label: "Expenses", 
    path: "/dashboard/expenses" 
  },
  { 
    icon: <Wallet className="h-5 w-5" />, 
    label: "Budget", 
    path: "/dashboard/budget" 
  },
  { 
    icon: <TrendingUp className="h-5 w-5" />, 
    label: "Stock Predictions", 
    path: "/dashboard/stock-predictions" 
  },
  { 
    icon: <LineChart className="h-5 w-5" />, 
    label: "Portfolio", 
    path: "/dashboard/portfolio" 
  },
  { 
    icon: <Brain className="h-5 w-5" />, 
    label: "AI Trading", 
    path: "/dashboard/ai-trading" 
  },
  { 
    icon: <MessageSquare className="h-5 w-5" />, 
    label: "ChatBot", 
    path: "/dashboard/chatbot" 
  },
  { 
    icon: <CreditCard className="h-5 w-5" />, 
    label: "Credit Score", 
    path: "/dashboard/credit-score" 
  }
];

interface SideNavProps {
  className?: string;
}

const SideNav = ({ className = "" }: SideNavProps) => {
  const location = useLocation();
  
  return (
    <div className={`flex-shrink-0 bg-white border-r border-gray-200 ${className}`}>
      <div className="p-4 flex items-center">
        <Link to="/" className="flex items-center">
          <div className="w-8 h-8 rounded bg-finance-blue text-white flex items-center justify-center font-bold text-lg mr-2">F</div>
          <span className="text-xl font-bold text-gray-900">FinMate</span>
        </Link>
      </div>
      <nav className="mt-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                  location.pathname === item.path
                    ? "bg-finance-blue text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.icon}
                <span className="ml-3">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

const DashboardLayout = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  
  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <SideNav className="w-64 hidden md:block" />
      
      {/* Mobile Sidebar */}
      <Dialog>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="left" className="p-0">
            <SideNav className="w-full" />
          </SheetContent>
        </Sheet>
      </Dialog>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center md:hidden">
              <Dialog>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)}>
                  <MenuIcon className="h-5 w-5" />
                </Button>
              </Dialog>
              <div className="ml-2 flex items-center">
                <div className="w-6 h-6 rounded bg-finance-blue text-white flex items-center justify-center font-bold text-sm mr-1">F</div>
                <span className="text-lg font-bold text-gray-900">FinMate</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url || ''} alt={profile?.full_name || 'User'} />
                      <AvatarFallback>{profile?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{profile?.full_name || 'My Account'}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/dashboard/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
