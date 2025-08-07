import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  BookOpen, 
  Clock, 
  Star, 
  Users, 
  TrendingUp,
  Award
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Mock data for demonstration
const mockCourses = [
  {
    id: 1,
    title: "Advanced React Patterns",
    instructor: "Alex Johnson",
    rating: 4.8,
    students: 1240,
    level: "Advanced",
    duration: "8 hours",
    topics: ["React", "JavaScript", "Frontend"],
    tags: ["react", "patterns", "advanced"],
    thumbnail: "/placeholder.svg",
    isFeatured: true,
    description: "Master advanced React patterns and techniques used by experts."
  },
  {
    id: 2,
    title: "UI/UX Design Fundamentals",
    instructor: "Sarah Miller",
    rating: 4.9,
    students: 2100,
    level: "Beginner",
    duration: "12 hours",
    topics: ["Design", "UI/UX", "Figma"],
    tags: ["design", "ui", "ux", "figma"],
    thumbnail: "/placeholder.svg",
    isFeatured: true,
    description: "Learn the fundamentals of user interface and user experience design."
  },
  {
    id: 3,
    title: "TypeScript Masterclass",
    instructor: "Michael Chen",
    rating: 4.7,
    students: 980,
    level: "Intermediate",
    duration: "10 hours",
    topics: ["TypeScript", "JavaScript", "Programming"],
    tags: ["typescript", "javascript", "programming"],
    thumbnail: "/placeholder.svg",
    isFeatured: false,
    description: "Become a TypeScript expert with this comprehensive masterclass."
  },
  {
    id: 4,
    title: "Data Visualization with D3.js",
    instructor: "Emma Wilson",
    rating: 4.6,
    students: 750,
    level: "Intermediate",
    duration: "6 hours",
    topics: ["Data Visualization", "D3.js", "JavaScript"],
    tags: ["d3", "data", "visualization"],
    thumbnail: "/placeholder.svg",
    isFeatured: false,
    description: "Create stunning data visualizations with D3.js."
  },
  {
    id: 5,
    title: "Node.js Backend Development",
    instructor: "David Brown",
    rating: 4.8,
    students: 1560,
    level: "Intermediate",
    duration: "15 hours",
    topics: ["Node.js", "Backend", "API"],
    tags: ["nodejs", "backend", "api"],
    thumbnail: "/placeholder.svg",
    isFeatured: true,
    description: "Build scalable backend applications with Node.js."
  },
  {
    id: 6,
    title: "Machine Learning Basics",
    instructor: "Dr. Rachel Green",
    rating: 4.5,
    students: 890,
    level: "Advanced",
    duration: "20 hours",
    topics: ["Machine Learning", "Python", "AI"],
    tags: ["ml", "python", "ai"],
    thumbnail: "/placeholder.svg",
    isFeatured: false,
    description: "Introduction to machine learning concepts and algorithms."
  }
];

const suggestedCourses = mockCourses.slice(0, 3);
const featuredCourses = mockCourses.filter(course => course.isFeatured);

export default function Explore() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedLevel, setSelectedLevel] = React.useState<string>("all");
  const [sortBy, setSortBy] = React.useState<string>("popular");

  // Filter courses based on search and filters
  const filteredCourses = mockCourses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLevel = selectedLevel === "all" || course.level === selectedLevel;
    
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Explore Courses</h1>
        <p className="text-muted-foreground">Discover new skills and advance your career</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search courses, topics, or instructors..."
            className="pl-10 py-6 text-lg"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Filters</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most Popular</SelectItem>
                  <SelectItem value="rating">Highest Rated</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Courses Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Suggested for You</h2>
          <Button variant="link" className="text-primary">View all</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {suggestedCourses.map((course) => (
            <Card key={course.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gradient-to-r from-purple-400 to-pink-500 rounded-t-lg" />
              <CardHeader>
                <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                <CardDescription>{course.instructor}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center mt-3 gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{course.rating}</span>
                  <Users className="h-4 w-4 ml-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{course.students}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="secondary">{course.level}</Badge>
                  <Badge variant="outline">{course.duration}</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Enroll Now</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Featured Courses</h2>
          <Button variant="link" className="text-primary">View all</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredCourses.map((course) => (
            <Card key={course.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gradient-to-r from-blue-400 to-teal-500 rounded-t-lg" />
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    <CardDescription>{course.instructor}</CardDescription>
                  </div>
                  <Badge className="flex items-center gap-1" variant="default">
                    <Award className="h-3 w-3" />
                    Featured
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center mt-3 gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{course.rating}</span>
                  <Users className="h-4 w-4 ml-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{course.students}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="secondary">{course.level}</Badge>
                  <Badge variant="outline">{course.duration}</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Enroll Now</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      {/* All Courses Section */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">All Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <div className="h-40 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-t-lg" />
              <CardHeader>
                <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                <CardDescription>{course.instructor}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center mt-3 gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{course.rating}</span>
                  <Users className="h-4 w-4 ml-2 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{course.students}</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="secondary">{course.level}</Badge>
                  <Badge variant="outline">{course.duration}</Badge>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Enroll Now</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No courses found</h3>
            <p className="mt-2 text-muted-foreground">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </section>
    </div>
  );
}