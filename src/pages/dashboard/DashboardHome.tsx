import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BookOpen, 
  Trophy, 
  Users, 
  Calendar,
  Star,
  Target,
  Zap,
  Award
} from "lucide-react";

const coursesInProgress = [
  {
    id: 1,
    title: "Advanced React Patterns",
    progress: 75,
    lessonsCompleted: 12,
    totalLessons: 16,
    lastAccessed: "2023-06-15",
  },
  {
    id: 2,
    title: "UI/UX Design Fundamentals",
    progress: 45,
    lessonsCompleted: 9,
    totalLessons: 20,
    lastAccessed: "2023-06-14",
  },
  {
    id: 3,
    title: "TypeScript Masterclass",
    progress: 20,
    lessonsCompleted: 4,
    totalLessons: 20,
    lastAccessed: "2023-06-10",
  },
];

const achievements = [
  {
    id: 1,
    title: "First Course Completed",
    description: "Complete your first course",
    icon: Trophy,
    earned: true,
    date: "2023-05-20",
  },
  {
    id: 2,
    title: "Quick Learner",
    description: "Complete 5 lessons in one day",
    icon: Zap,
    earned: true,
    date: "2023-06-01",
  },
  {
    id: 3,
    title: "Course Creator",
    description: "Create your first course",
    icon: BookOpen,
    earned: false,
  },
  {
    id: 4,
    title: "Community Helper",
    description: "Help 10 other learners",
    icon: Users,
    earned: false,
  },
];

const stats = [
  { name: "Courses Enrolled", value: "12", icon: BookOpen },
  { name: "Courses Completed", value: "8", icon: Award },
  { name: "Points", value: "1,240", icon: Star },
  { name: "Streak", value: "7 days", icon: Target },
];

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Continue your learning journey.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.name}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Courses in Progress */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Courses in Progress</CardTitle>
            <CardDescription>You're doing great! Keep it up.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {coursesInProgress.map((course) => (
              <div key={course.id} className="space-y-2">
                <div className="flex justify-between">
                  <h3 className="font-medium">{course.title}</h3>
                  <span className="text-sm text-muted-foreground">
                    {course.lessonsCompleted}/{course.totalLessons} lessons
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={course.progress} className="flex-1" />
                  <span className="text-sm font-medium w-12">{course.progress}%</span>
                </div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  Last accessed: {new Date(course.lastAccessed).toLocaleDateString()}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Achievements</CardTitle>
            <CardDescription>Your learning milestones</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {achievements.map((achievement) => {
              const Icon = achievement.icon;
              return (
                <div 
                  key={achievement.id} 
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    achievement.earned 
                      ? "bg-primary/10 border border-primary/20" 
                      : "bg-muted/50 border border-dashed"
                  }`}
                >
                  <div className={`p-2 rounded-full ${achievement.earned ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{achievement.title}</h3>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                    {achievement.earned && achievement.date && (
                      <p className="text-xs mt-1">Earned on {new Date(achievement.date).toLocaleDateString()}</p>
                    )}
                  </div>
                  {achievement.earned ? (
                    <Badge variant="secondary" className="ml-auto">Earned</Badge>
                  ) : (
                    <Badge variant="outline" className="ml-auto">Locked</Badge>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest learning activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Completed lesson: "State Management in React"</p>
                <p className="text-sm text-muted-foreground">in Advanced React Patterns</p>
                <p className="text-xs text-muted-foreground mt-1">2 days ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Trophy className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Earned achievement: "Quick Learner"</p>
                <p className="text-sm text-muted-foreground">for completing 5 lessons in one day</p>
                <p className="text-xs text-muted-foreground mt-1">3 days ago</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-medium">Subscribed to 3 new creators</p>
                <p className="text-sm text-muted-foreground">You're now following React Masters, Design Gurus, and TypeScript Experts</p>
                <p className="text-xs text-muted-foreground mt-1">1 week ago</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}