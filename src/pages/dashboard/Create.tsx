import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Clock, 
  BarChart3, 
  Image as ImageIcon,
  Sparkles,
  Upload,
  Globe,
  Loader2,
  ChevronDown,
  ChevronRight,
  CheckCircle
} from "lucide-react";
import { showError, showSuccess } from "@/utils/toast";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/hooks/useUser";

interface CourseFormData {
  title: string;
  description: string;
  duration: number;
  level: string;
  prompt: string;
  language: string;
  coverImage: File | null;
}

interface Test {
  question: string;
  options: string[];
  answer: string;
  solution: string;
}

interface Lesson {
  lessonTitle: string;
  theory: string;
  tests: Test[];
}

interface Topic {
  topicTitle: string;
  lessons: Lesson[];
}

interface Module {
  moduleNumber: number;
  moduleTitle: string;
  weeks: number[];
  topics: Topic[];
}

interface CourseOutline {
  courseTitle: string;
  level: string;
  durationWeeks: number;
  description: string;
  modules: {
    moduleNumber: number;
    moduleTitle: string;
    weeks: number[];
  }[];
}

interface CourseDraft {
  courseTitle: string;
  level: string;
  durationWeeks: number;
  description: string;
  modules: Module[];
}

// Top 10 most spoken languages in the world
const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "zh", name: "Chinese (Mandarin)" },
  { code: "hi", name: "Hindi" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "ar", name: "Arabic" },
  { code: "bn", name: "Bengali" },
  { code: "ru", name: "Russian" },
  { code: "pt", name: "Portuguese" },
  { code: "id", name: "Indonesian" }
];

export default function Create() {
  const { user } = useUser();
  const [formData, setFormData] = useState<CourseFormData>({
    title: "",
    description: "",
    duration: 4,
    level: "beginner",
    prompt: "",
    language: "en",
    coverImage: null
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>("");
  const [courseOutline, setCourseOutline] = useState<CourseOutline | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const [completedCourse, setCompletedCourse] = useState<CourseDraft | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "duration" ? parseInt(value) || 0 : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match("image.*")) {
        showError("Please select an image file");
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        coverImage: file
      }));
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const toggleModuleExpansion = (moduleNumber: number) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleNumber]: !prev[moduleNumber]
    }));
  };

  const handleGenerateCourse = async () => {
  if (!formData.title.trim()) return showError("Please enter a course title");
  if (!formData.prompt.trim()) return showError("Please enter a prompt for course generation");
  if (!user) return showError("You must be logged in to generate a course");

  setIsGenerating(true);
  setGenerationStep("Starting course generation...");
  setCourseOutline(null);
  setModules([]);
  setCompletedCourse(null);
  setExpandedModules({});
  setDraftId(null);

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("No authentication token found");

    const courseData = {
      courseTitle: formData.title,
      level: formData.level.charAt(0).toUpperCase() + formData.level.slice(1),
      durationWeeks: formData.duration,
      prompt: formData.prompt,
      language: formData.language,
    };

    const resp = await fetch("http://localhost:8000/drafts/stream", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(courseData),
    });

    if (!resp.ok) throw new Error(`HTTP error ${resp.status}`);
    if (!resp.body) throw new Error("Response body is null");

    // --- Parser SSE básico (event/data) ---
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";
    let currEvent: string | null = null;
    let dataBuf = "";

    const flushEvent = () => {
      if (!dataBuf) return;
      try {
        const payload = JSON.parse(dataBuf);
        // Ruteo por tipo de evento del backend
        switch (currEvent) {
          case "draft_started":
            setGenerationStep("Generating course outline...");
            if (payload.draftId) setDraftId(payload.draftId);
            break;

          case "outline":
            setCourseOutline(payload);
            setGenerationStep("Generating course modules...");
            break;

          case "module":
            setModules((prev) => {
              const idx = prev.findIndex((m) => m.moduleNumber === payload.moduleNumber);
              if (idx >= 0) {
                const next = [...prev];
                next[idx] = payload;
                return next;
              }
              return [...prev, payload];
            });
            break;

          case "complete":
            // El back envia { draftId, draft: { ...curso... } }
            if (payload.draftId) setDraftId(payload.draftId);
            if (payload.draft) {
              setCompletedCourse(payload.draft);
              setGenerationStep("Course generation completed!");
            }
            break;

          case "error":
            console.error("Stream error:", payload);
            showError(payload?.message ?? "Stream error");
            break;

          default:
            // Por compatibilidad con respuestas sin 'event:' (raro)
            // Intenta deducir:
            if (payload?.modules && payload?.courseTitle && !("topics" in payload)) {
              setCourseOutline(payload);
              setGenerationStep("Generating course modules...");
            } else if (payload?.moduleNumber && payload?.topics) {
              setModules((prev) => {
                const idx = prev.findIndex((m) => m.moduleNumber === payload.moduleNumber);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = payload;
                  return next;
                }
                return [...prev, payload];
              });
            } else if (payload?.draft && payload?.draft?.modules) {
              setCompletedCourse(payload.draft);
              setGenerationStep("Course generation completed!");
            }
            break;
        }
      } catch (e) {
        console.warn("SSE JSON parse error:", e, "raw:", dataBuf);
      } finally {
        dataBuf = "";
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        // al cerrar el stream, procesa lo que quede en buffer
        flushEvent();
        break;
      }

      buf += decoder.decode(value, { stream: true });
      // Cada evento en SSE termina con una línea en blanco
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";

      for (const line of lines) {
        const l = line.trimEnd();

        if (l.startsWith("event:")) {
          // nuevo nombre de evento
          currEvent = l.slice(6).trim();
          continue;
        }

        if (l.startsWith("data:")) {
          // puede haber varias líneas data:, se concatenan con \n
          const chunk = l.slice(5).trimStart();
          dataBuf += (dataBuf ? "\n" : "") + chunk;
          continue;
        }

        if (l === "") {
          // fin del evento actual -> procesar
          flushEvent();
          currEvent = null;
          continue;
        }

        // Líneas que no son event/data ni vacías: las ignoramos o log
        // console.debug("SSE extra line:", l);
      }
    }

    showSuccess("Course generation completed successfully!");
  } catch (err) {
    console.error("Course generation error:", err);
    showError("Failed to generate course. Please try again.");
    setIsGenerating(false); // cierra modal si falla
  }
};


  const handlePublishDraft = async () => {
    if (!draftId) {
      showError("No draft ID found");
      return;
    }
    
    if (!user) {
      showError("You must be logged in to publish a course");
      return;
    }
    
    setIsPublishing(true);
    
    try {
      // Get user token
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) {
        throw new Error("No authentication token found");
      }
      
      // Publish the draft
      const response = await fetch("http://localhost:8000/drafts/publish", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ draftId }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      showSuccess("Course published successfully!");
      
      // Reset form after successful publishing
      resetForm();
    } catch (error) {
      console.error("Publish error:", error);
      showError("Failed to publish course. Please try again.");
    } finally {
      setIsPublishing(false);
      setIsGenerating(false); // Close the modal after publishing
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      duration: 4,
      level: "beginner",
      prompt: "",
      language: "en",
      coverImage: null
    });
    setPreviewUrl(null);
    setCourseOutline(null);
    setModules([]);
    setCompletedCourse(null);
    setExpandedModules({});
    setDraftId(null);
    setIsGenerating(false);
    
    // Reset file input
    const fileInput = document.getElementById("cover-image") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Create New Course</h1>
        <p className="text-muted-foreground">Design and generate your course content with AI assistance</p>
      </div>

      {/* Generation Modal */}
      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {completedCourse ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <Loader2 className="h-5 w-5 animate-spin" />
                )}
                {completedCourse ? "Course Generation Complete" : "Generating Course"}
              </CardTitle>
              <CardDescription>
                {generationStep}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {courseOutline && (
                <div className="space-y-2">
                  <h3 className="font-medium">Course Outline</h3>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="font-medium">{courseOutline.courseTitle}</p>
                    <p className="text-sm text-muted-foreground">{courseOutline.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="secondary">{courseOutline.level}</Badge>
                      <Badge variant="outline">{courseOutline.durationWeeks} weeks</Badge>
                    </div>
                  </div>
                </div>
              )}
              
              {modules.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Generated Modules</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {modules.map((module) => (
                      <Card key={module.moduleNumber} className="bg-muted">
                        <CardContent className="p-3">
                          <button
                            className="flex items-center justify-between w-full text-left"
                            onClick={() => toggleModuleExpansion(module.moduleNumber)}
                          >
                            <span className="font-medium">Module {module.moduleNumber}: {module.moduleTitle}</span>
                            {expandedModules[module.moduleNumber] ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </button>
                          {expandedModules[module.moduleNumber] && (
                            <div className="mt-2 pl-4 space-y-1">
                              {module.topics.map((topic, index) => (
                                <div key={index} className="text-sm">
                                  <span className="font-medium">• {topic.topicTitle}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
              
              {completedCourse && (
                <div className="space-y-4">
                  <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                    <p className="font-medium">Course generation completed!</p>
                    <p className="text-sm">Your course is ready to be published.</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1"
                      onClick={resetForm}
                    >
                      Create Another
                    </Button>
                    <Button 
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800"
                      onClick={handlePublishDraft}
                      disabled={isPublishing}
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Publishing...
                        </>
                      ) : (
                        "Publish Course"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Form (hidden during generation) */}
      {!isGenerating && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Course Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Details</CardTitle>
                <CardDescription>Provide the basic information for your course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter a compelling course title"
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Course Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe what students will learn in this course"
                    className="min-h-24"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (weeks)</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="duration"
                        name="duration"
                        type="number"
                        min="1"
                        max="52"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Skill Level</Label>
                    <Select 
                      name="level" 
                      value={formData.level} 
                      onValueChange={(value) => handleSelectChange("level", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                        <SelectItem value="expert">Expert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select 
                      name="language" 
                      value={formData.language} 
                      onValueChange={(value) => handleSelectChange("language", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((language) => (
                          <SelectItem key={language.code} value={language.code}>
                            {language.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prompt">
                    Course Generation Prompt
                    <span className="text-muted-foreground text-sm font-normal block">
                      Describe the content and structure you want for your course
                    </span>
                  </Label>
                  <Textarea
                    id="prompt"
                    name="prompt"
                    value={formData.prompt}
                    onChange={handleInputChange}
                    placeholder="Example: Create a comprehensive course on React hooks covering useState, useEffect, useContext, and custom hooks with practical examples..."
                    className="min-h-32"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cover Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle>Cover Image</CardTitle>
                <CardDescription>Upload an eye-catching image for your course</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div 
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                    onClick={() => document.getElementById("cover-image")?.click()}
                  >
                    <input
                      type="file"
                      id="cover-image"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <ImageIcon className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {formData.coverImage ? "Image selected" : "Drag & drop your image here"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formData.coverImage ? formData.coverImage.name : "or click to browse files"}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose File
                      </Button>
                    </div>
                  </div>

                  {previewUrl && (
                    <div className="mt-4">
                      <h3 className="font-medium mb-2">Image Preview</h3>
                      <div className="max-w-xs mx-auto">
                        <img 
                          src={previewUrl} 
                          alt="Course cover preview" 
                          className="rounded-lg object-cover w-full h-40"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview and Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Preview</CardTitle>
                <CardDescription>How your course will appear</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted rounded-lg aspect-video flex items-center justify-center">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Course cover" 
                        className="rounded-lg object-cover w-full h-full"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <ImageIcon className="h-12 w-12 mx-auto mb-2" />
                        <p>No cover image</p>
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-bold text-lg line-clamp-1">
                      {formData.title || "Course Title"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {formData.description || "Course description will appear here"}
                    </p>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="secondary">
                        {formData.level.charAt(0).toUpperCase() + formData.level.slice(1)}
                      </Badge>
                      <Badge variant="outline">
                        {formData.duration} weeks
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Globe className="h-3 w-3" />
                        {LANGUAGES.find(lang => lang.code === formData.language)?.name || "English"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generate Course</CardTitle>
                <CardDescription>AI-powered course creation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium">AI Course Generation</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Our AI will create a complete course structure based on your prompt
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800"
                  size="lg"
                  onClick={handleGenerateCourse}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Course
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  By generating this course, you agree to our content policies
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}