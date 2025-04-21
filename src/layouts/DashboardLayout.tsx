
import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  CreditCard, 
  LineChart, 
  TrendingUp, 
  Brain,
  User,
  Settings,
  Bell,
  LogOut,
  Menu,
  X
} from "lucide-react";
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { 
    icon: <BarChart3 className="h-5 w-5" />, 
    label: "Dashboard", 
    path: "/dashboard" 
  },
  { 
    icon: <CreditCard className="h-5 w-5" />, 
    label: "Expenses", 
    path: "/dashboard/expenses" 
  },
  { 
    icon: <TrendingUp className="h-5 w-5" />, 
    label: "Investments", 
    path: "/dashboard/investments" 
  },
  { 
    icon: <LineChart className="h-5 w-5" />, 
    label: "Credit Score", 
    path: "/dashboard/credit-score" 
  },
  { 
    icon: <Brain className="h-5 w-5" />, 
    label: "AI Assistant", 
    path: "/dashboard/ai-assistant" 
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
  
  const handleLogout = () => {
    // This will be connected to Supabase Auth later
    console.log("Logging out...");
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <SideNav className="w-64 hidden md:block" />
      
      {/* Mobile Sidebar */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="p-0">
          <SideNav className="w-full" />
        </SheetContent>
      </Sheet>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navigation */}
        <header className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center md:hidden">
              <SheetTrigger asChild onClick={() => setIsOpen(true)}>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <div className="ml-2 flex items-center">
                <div className="w-6 h-6 rounded bg-finance-blue text-white flex items-center justify-center font-bold text-sm mr-1">F</div>
                <span className="text-lg font-bold text-gray-900">FinMate</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://github.com/shadcn.png" alt="User" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
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
