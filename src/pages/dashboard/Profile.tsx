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
  Users
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { showError, showSuccess } from "@/utils/toast";
import { AvatarUploadModal } from "@/components/AvatarUploadModal";

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
      const { data, error } = await supabase
        .from("users")
        .select("id, email, created_at")
        .eq("id", user.id)
        .single();
      
      if (error) throw error;
      
      setUserData(data);
    } catch (error) {
      console.error("Failed to fetch user data:", error);
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
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="relative mx-auto">
                {/* Circular avatar with object-cover to ensure proper cropping */}
                <div className="h-24 w-24 mx-auto rounded-full overflow-hidden">
                  {profile?.avatar_url ? (
                    <img 
                      src={getCacheBustedAvatarUrl(profile.avatar_url)} 
                      alt="Profile picture" 
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="bg-muted w-full h-full flex items-center justify-center">
                      <User className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute bottom-0 right-0 rounded-full h-8 w-8 p-0"
                  onClick={() => setIsAvatarModalOpen(true)}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              </div>
              <CardTitle className="mt-4">
                {profile?.first_name && profile?.last_name 
                  ? `${profile.first_name} ${profile.last_name}` 
                  : user?.email}
              </CardTitle>
              <CardDescription>
                {user?.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                Joined {getJoinDate()}
              </div>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-medium">Account Information</h3>
                <div className="text-sm space-y-1">
                  <p>Email: {user?.email}</p>
                  <p>Provider: {profile?.provider === 'google' ? 'Google' : 'Email'}</p>
                  <p>Status: 
                    <Badge variant={profile?.email_confirmed ? "default" : "destructive"} className="ml-2">
                      {profile?.email_confirmed ? "Verified" : "Unverified"}
                    </Badge>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Details and Plan */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                    <Button onClick={() => setIsEditing(true)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription Plan */}
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>Manage your subscription and billing information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => {
                  const Icon = plan.icon;
                  const isCurrent = plan.name === currentPlan;
                  
                  return (
                    <Card 
                      key={plan.name} 
                      className={`relative ${isCurrent ? "border-primary ring-2 ring-primary/20" : ""}`}
                    >
                      {plan.popular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      <CardContent className="pt-6">
                        <div className="flex flex-col items-center text-center space-y-3">
                          <div className={`p-3 rounded-full ${plan.color} bg-opacity-10`}>
                            <Icon className={`h-6 w-6 ${plan.color.replace("bg-", "text-")}`} />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{plan.name}</h3>
                            <p className="text-2xl font-bold mt-1">{plan.price}<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                          </div>
                          <ul className="space-y-2 text-sm text-left w-full">
                            {plan.features.map((feature, index) => (
                              <li key={index} className="flex items-start">
                                <Star className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                          <Button 
                            className="w-full mt-4" 
                            variant={isCurrent ? "secondary" : "default"}
                            disabled={isCurrent}
                          >
                            {isCurrent ? "Current Plan" : "Upgrade"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Billing Information</h4>
                    <p className="text-sm text-muted-foreground">Manage your payment methods and billing details</p>
                  </div>
                  <Button variant="outline" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Manage Billing
                  </Button>
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