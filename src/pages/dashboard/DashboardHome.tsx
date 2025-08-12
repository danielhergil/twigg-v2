import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  BookOpen, 
  Trophy, 
  Users, 
  Calendar,
  Star,
  Target,
  Zap,
  Award,
  TrendingUp,
  Clock,
  Plus,
  Eye,
  MessageSquare,
  BarChart3,
  BookMarked,
  Flame
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";
import { showError } from "@/utils/toast";

interface DashboardStats {
  coursesCreated: number;
  coursesEnrolled: number;
  totalViews: number;
  totalRatings: number;
  averageRating: number;
  totalReviews: number;
  currentStreak: number;
  totalPoints: number;
}

interface MyCourse {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
  rating_avg: number;
  reviews_count: number;
}

interface RecentActivity {
  id: string;
  type: 'course_created' | 'course_published' | 'review_received';
  title: string;
  description: string;
  date: string;
  icon: any;
}

export default function DashboardHome() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    coursesCreated: 0,
    coursesEnrolled: 0,
    totalViews: 0,
    totalRatings: 0,
    averageRating: 0,
    totalReviews: 0,
    currentStreak: 0,
    totalPoints: 0
  });
  const [myCourses, setMyCourses] = useState<MyCourse[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (coursesError) throw coursesError;

      setMyCourses(coursesData || []);

      // Fetch user stats from user_stats table
      const { data: userStats, error: statsError } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Calculate stats
      const publishedCourses = coursesData?.filter(c => c.is_published) || [];
      const totalRatings = publishedCourses.reduce((sum, course) => sum + (course.reviews_count || 0), 0);
      const avgRating = publishedCourses.length > 0 
        ? publishedCourses.reduce((sum, course) => sum + (course.rating_avg || 0), 0) / publishedCourses.length 
        : 0;

      setStats({
        coursesCreated: coursesData?.length || 0,
        coursesEnrolled: userStats?.courses_enrolled || 0,
        totalViews: Math.floor(Math.random() * 5000) + 500, // Mock for now
        totalRatings,
        averageRating: avgRating,
        totalReviews: totalRatings,
        currentStreak: userStats?.current_streak || 0,
        totalPoints: userStats?.total_points || 0
      });

      // Generate recent activity
      const activities: RecentActivity[] = [];
      
      coursesData?.slice(0, 3).forEach(course => {
        if (course.is_published) {
          activities.push({
            id: `published-${course.id}`,
            type: 'course_published',
            title: `Published "${course.title}"`,
            description: 'Your course is now live and available to students',
            date: course.created_at,
            icon: BookOpen
          });
        } else {
          activities.push({
            id: `created-${course.id}`,
            type: 'course_created',
            title: `Created "${course.title}"`,
            description: 'Course draft created and ready for content',
            date: course.created_at,
            icon: Plus
          });
        }
      });

      setRecentActivity(activities.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ).slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const dashboardStats = [
    { 
      name: "Courses Created", 
      value: stats.coursesCreated.toString(), 
      icon: BookOpen,
      description: "Total courses you've created",
      color: "text-blue-600 dark:text-blue-400"
    },
    { 
      name: "Total Views", 
      value: formatNumber(stats.totalViews), 
      icon: Eye,
      description: "Views across all your courses",
      color: "text-green-600 dark:text-green-400"
    },
    { 
      name: "Average Rating", 
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : "0.0", 
      icon: Star,
      description: "Average rating across published courses",
      color: "text-yellow-600 dark:text-yellow-400"
    },
    { 
      name: "Total Reviews", 
      value: stats.totalReviews.toString(), 
      icon: MessageSquare,
      description: "Reviews received on your courses",
      color: "text-purple-600 dark:text-purple-400"
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Welcome back! 👋</h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your teaching journey and course performance.
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/create')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Course
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name} className="hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-800 bg-white dark:bg-card">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-800`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* My Courses */}
        <Card className="lg:col-span-2 border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>My Courses</CardTitle>
              <CardDescription>Manage and track your course performance</CardDescription>
            </div>
            <Button variant="outline" onClick={() => navigate('/dashboard/create')}>
              <Plus className="h-4 w-4 mr-2" />
              New Course
            </Button>
          </CardHeader>
          <CardContent>
            {myCourses.length > 0 ? (
              <div className="space-y-4">
                {myCourses.slice(0, 4).map((course) => (
                  <div 
                    key={course.id} 
                    className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/dashboard/course/${course.id}`)}
                  >
                    <div className="h-16 w-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                      {course.thumbnail_url ? (
                        <img 
                          src={course.thumbnail_url} 
                          alt={course.title}
                          className="h-16 w-16 object-cover rounded-lg"
                        />
                      ) : (
                        <BookOpen className="h-6 w-6 text-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{course.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {course.description || 'No description available'}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant={course.is_published ? "default" : "secondary"}>
                          {course.is_published ? "Published" : "Draft"}
                        </Badge>
                        {course.is_published && (
                          <>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs">{(course.rating_avg || 0).toFixed(1)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs">{course.reviews_count || 0} reviews</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {new Date(course.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {myCourses.length > 4 && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/dashboard/explore')}
                  >
                    View All Courses ({myCourses.length})
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No courses yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start your teaching journey by creating your first course
                </p>
                <Button onClick={() => navigate('/dashboard/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Course
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity & Quick Actions */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/dashboard/create')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Course
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/dashboard/explore')}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Browse All Courses
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/dashboard/profile')}
              >
                <Users className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-card">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest course activities</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => {
                    const Icon = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{activity.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Performance Insights */}
      {stats.coursesCreated > 0 && (
        <Card className="border border-gray-200 dark:border-gray-800 shadow-lg bg-white dark:bg-card">
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>Track your growth and engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-sm">
                <TrendingUp className="mx-auto h-8 w-8 text-green-600 dark:text-green-400 mb-2" />
                <div className="text-2xl font-bold">{stats.coursesCreated}</div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
              </div>
              <div className="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-sm">
                <BarChart3 className="mx-auto h-8 w-8 text-blue-600 dark:text-blue-400 mb-2" />
                <div className="text-2xl font-bold">{formatNumber(stats.totalViews)}</div>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </div>
              <div className="text-center p-6 border border-gray-200 dark:border-gray-700 rounded-lg bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-sm">
                <Star className="mx-auto h-8 w-8 text-yellow-600 dark:text-yellow-400 mb-2" />
                <div className="text-2xl font-bold">
                  {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '0.0'}
                </div>
                <p className="text-sm text-muted-foreground">Avg Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}