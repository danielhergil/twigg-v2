import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  MapPin, 
  Calendar, 
  CreditCard, 
  Edit3, 
  Crown,
  Star,
  Zap,
  Users,
  Key,
  LogOut,
  Settings,
  Shield,
  Mail,
  Globe,
  CheckCircle,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
  Trophy,
  BookOpen,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { showError, showSuccess } from "@/utils/toast";
import { AvatarUploadModal } from "@/components/AvatarUploadModal";
import { useNavigate } from "react-router-dom";

interface ProfileData {
  first_name: string;
  last_name: string;
  avatar_url: string;
  email_confirmed: boolean;
  updated_at: string;
  email: string;
  provider: string;
  city: string;
  country: string;
  created_at: string;
}

interface UserData {
  id: string;
  email: string;
  created_at: string;
}

const plans = [
  {
    name: "Starter",
    price: "$0",
    features: [
      "Unlimited learning access",
      "Basic course creation tools",
      "Full community access",
      "Standard support"
    ],
    icon: User,
    color: "bg-gray-500"
  },
  {
    name: "Pro",
    price: "$12",
    features: [
      "All Starter features",
      "Advanced creation suite",
      "Detailed insights & analytics",
      "Priority email support",
      "Custom branding options"
    ],
    icon: Crown,
    color: "bg-purple-500",
    popular: true
  },
  {
    name: "Team",
    price: "$29",
    features: [
      "All Pro features",
      "Dedicated team workspaces",
      "Real-time collaboration",
      "Shared content libraries",
      "Dedicated account manager"
    ],
    icon: Users,
    color: "bg-blue-500"
  }
];

export default function Profile() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    first_name: "",
    last_name: "",
    city: "",
    country: ""
  });
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState("Starter");
  const [showToken, setShowToken] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [tokenVisible, setTokenVisible] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserData();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      
      if (error) throw error;
      
      setProfile(data);
      setEditedProfile({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        city: data.city || "",
        country: data.country || ""
      });
    } catch (error) {
      showError("Failed to load profile");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    if (!user) return;
    
    try {
      // Use the user data from auth which is already available
      setUserData({
        id: user.id,
        email: user.email || '',
        created_at: user.created_at || new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to set user data:", error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          city: editedProfile.city,
          country: editedProfile.country
        })
        .eq("id", user.id);
      
      if (error) throw error;
      
      showSuccess("Profile updated successfully!");
      setIsEditing(false);
      fetchProfile(); // Refresh profile data
    } catch (error) {
      showError("Failed to update profile");
      console.error(error);
    }
  };

  const handleAvatarUpdate = (url: string) => {
    if (profile) {
      setProfile({ ...profile, avatar_url: url });
    }
  };

  const handleShowToken = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setToken(session.access_token);
        setShowToken(true);
        console.log("User Access Token:", session.access_token);
        console.log("Token will expire at:", new Date(session.expires_at * 1000));
      } else {
        console.log("No active session or token found");
      }
    } catch (error) {
      console.error("Error getting session:", error);
    }
  };

  const copyTokenToClipboard = () => {
    if (token) {
      navigator.clipboard.writeText(token);
      showSuccess("Token copied to clipboard!");
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      showSuccess("Logged out successfully!");
    } catch (error) {
      showError("Failed to logout");
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Add timestamp to avatar URL for cache busting
  const getCacheBustedAvatarUrl = (url: string | undefined) => {
    if (!url) return url;
    const timestamp = Date.now();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${timestamp}`;
  };

  // Get the join date - either from profile or user data
  const getJoinDate = () => {
    const date = profile?.created_at || userData?.created_at;
    if (date) {
      return new Date(date).toLocaleDateString();
    }
    return "Unknown";
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 p-8">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full overflow-hidden border-4 border-white/20 shadow-xl">
                {profile?.avatar_url ? (
                  <img 
                    src={getCacheBustedAvatarUrl(profile.avatar_url)} 
                    alt="Profile picture" 
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="bg-white/20 w-full h-full flex items-center justify-center">
                    <User className="h-8 w-8 text-white" />
                  </div>
                )}
              </div>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-white text-black hover:bg-gray-100"
                onClick={() => setIsAvatarModalOpen(true)}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </div>
            <div className="text-white">
              <h1 className="text-3xl font-bold">
                {profile?.first_name && profile?.last_name 
                  ? `${profile.first_name} ${profile.last_name}` 
                  : user?.email}
              </h1>
              <p className="text-blue-100 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {user?.email}
              </p>
              <p className="text-blue-200 flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                Member since {getJoinDate()}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col gap-3">
            <Button 
              variant="outline" 
              className="border-white/30 text-white hover:bg-white hover:text-gray-900"
              onClick={() => setIsEditing(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button 
              variant="destructive" 
              className="bg-red-500 hover:bg-red-600"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute -top-10 -right-10 h-40 w-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-yellow-400/20 rounded-full blur-2xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar Cards */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Stats Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <BookOpen className="h-6 w-6 mx-auto text-blue-500 mb-1" />
                  <div className="text-lg font-bold">0</div>
                  <div className="text-xs text-muted-foreground">Courses</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <Clock className="h-6 w-6 mx-auto text-green-500 mb-1" />
                  <div className="text-lg font-bold">0h</div>
                  <div className="text-xs text-muted-foreground">Learning</div>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Learning Streak</span>
                <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                  <Sparkles className="h-3 w-3 mr-1" />
                  0 days
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Account Status Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Account Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Email Verified</span>
                  </div>
                  {profile?.email_confirmed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Provider</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {profile?.provider === 'google' ? 'Google' : 'Email'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Plan</span>
                  </div>
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                    {currentPlan}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Developer Tools Card */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-500" />
                Developer Tools
              </CardTitle>
              <CardDescription>
                Access your API token for development
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleShowToken}
              >
                <Key className="h-4 w-4 mr-2" />
                {showToken ? 'Hide Token' : 'Show Access Token'}
              </Button>
              
              {showToken && token && (
                <div className="p-4 bg-muted rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Access Token</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={copyTokenToClipboard}
                      className="h-8 w-8 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="relative">
                    <code className="text-xs font-mono block p-2 bg-background rounded border overflow-hidden">
                      {tokenVisible ? token : token.replace(/./g, '•')}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1 h-6 w-6 p-0"
                      onClick={() => setTokenVisible(!tokenVisible)}
                    >
                      {tokenVisible ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Keep your token secure. Check console for full token details.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-500" />
                    Personal Information
                  </CardTitle>
                  <CardDescription>Keep your profile information up to date</CardDescription>
                </div>
                {!isEditing && (
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input
                        id="first-name"
                        value={editedProfile.first_name}
                        onChange={(e) => setEditedProfile({...editedProfile, first_name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input
                        id="last-name"
                        value={editedProfile.last_name}
                        onChange={(e) => setEditedProfile({...editedProfile, last_name: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={editedProfile.city}
                        onChange={(e) => setEditedProfile({...editedProfile, city: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={editedProfile.country}
                        onChange={(e) => setEditedProfile({...editedProfile, country: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSave}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">First Name</Label>
                      <p className="font-medium">{profile?.first_name || "Not set"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Last Name</Label>
                      <p className="font-medium">{profile?.last_name || "Not set"}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">City</Label>
                      <p className="font-medium">{profile?.city || "Not set"}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Country</Label>
                      <p className="font-medium">{profile?.country || "Not set"}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Plan */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-purple-500" />
                Subscription Plan
              </CardTitle>
              <CardDescription>Choose the plan that's right for you</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  const isCurrent = plan.name === currentPlan;
                  
                  return (
                    <Card 
                      key={plan.name} 
                      className={`relative transition-all duration-300 hover:shadow-xl ${
                        isCurrent 
                          ? "border-2 border-primary ring-4 ring-primary/10 shadow-lg" 
                          : "border hover:border-primary/50"
                      }`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      {isCurrent && (
                        <div className="absolute -top-4 right-4 z-10">
                          <Badge className="bg-green-500 text-white px-3 py-1">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Current
                          </Badge>
                        </div>
                      )}
                      <CardContent className="pt-8 pb-6">
                        <div className="flex flex-col items-center text-center space-y-4">
                          <div className={`p-4 rounded-2xl ${plan.color} bg-opacity-20 border-2 border-current border-opacity-20`}>
                            <Icon className={`h-8 w-8 ${plan.color.replace("bg-", "text-")}`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-xl mb-1">{plan.name}</h3>
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-3xl font-bold">{plan.price}</span>
                              <span className="text-muted-foreground">/month</span>
                            </div>
                          </div>
                          <ul className="space-y-3 text-sm w-full">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start text-left">
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                                <span className="text-muted-foreground">{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Button 
                            className={`w-full mt-6 ${
                              plan.popular 
                                ? "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600" 
                                : ""
                            }`}
                            variant={isCurrent ? "secondary" : "default"}
                            disabled={isCurrent}
                            size="lg"
                          >
                            {isCurrent ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Current Plan
                              </>
                            ) : (
                              <>
                                <Crown className="h-4 w-4 mr-2" />
                                Upgrade Now
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border border-blue-200/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 dark:text-blue-100">Billing & Payments</h4>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Manage your payment methods and billing history</p>
                    </div>
                  </div>
                  <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-lg font-bold text-green-600">$0</div>
                    <div className="text-xs text-muted-foreground">Current Bill</div>
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">Free</div>
                    <div className="text-xs text-muted-foreground">Current Plan</div>
                  </div>
                  <div className="text-center p-3 bg-white/50 dark:bg-black/20 rounded-lg">
                    <div className="text-lg font-bold text-purple-600">∞</div>
                    <div className="text-xs text-muted-foreground">Days Left</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AvatarUploadModal 
        open={isAvatarModalOpen} 
        onClose={() => setIsAvatarModalOpen(false)}
        onAvatarUpdate={handleAvatarUpdate}
      />
    </div>
  );
}