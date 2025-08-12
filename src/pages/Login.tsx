import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showError, showSuccess } from "@/utils/toast";
import { EmailConfirmationMessage } from "@/components/EmailConfirmationMessage";
import { useState } from "react";
import { useTheme } from "next-themes";

const signUpSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export default function Login() {
  const [searchParams] = useSearchParams();
  const isRegisterMode = searchParams.get("mode") === "register";
  const navigate = useNavigate();
  const [showConfirmationMessage, setShowConfirmationMessage] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const { theme } = useTheme();

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
          }
        }
      });
      
      if (error) throw error;
      
      // Show confirmation message after successful signup
      setUserEmail(values.email);
      setShowConfirmationMessage(true);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Sign up failed");
    }
  };

  const handleGoogleAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) throw error;
    } catch (error) {
      showError(error instanceof Error ? error.message : "Google sign in failed");
    }
  };

  const handleBackToLogin = () => {
    setShowConfirmationMessage(false);
    signUpForm.reset();
  };

  // If we're showing the confirmation message, render that instead
  if (showConfirmationMessage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 dark:bg-gradient-to-br dark:from-purple-950 dark:via-pink-950 dark:to-red-950">
        <Header />
        <div className="max-w-md mx-auto mt-16 px-4">
          <EmailConfirmationMessage 
            email={userEmail} 
            onBackToLogin={handleBackToLogin} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-red-50 dark:bg-gradient-to-br dark:from-purple-950 dark:via-pink-950 dark:to-red-950">
      <Header />
      <div className="max-w-md mx-auto mt-16 px-4">
        <div className="bg-white shadow-lg rounded-xl p-6 dark:bg-card dark:shadow-lg">
          <h1 className="text-2xl font-semibold mb-2 dark:text-foreground">
            {isRegisterMode ? "Create an account" : "Welcome to Twigg"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isRegisterMode 
              ? "Fill in your details to get started" 
              : "Sign in or create an account to start building and taking courses."}
          </p>

          {isRegisterMode ? (
            <Form {...signUpForm}>
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <FormField
                  control={signUpForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="your@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="At least 6 characters" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={signUpForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm your password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-700 hover:from-purple-700 hover:to-pink-800 text-white"
                >
                  Create account
                </Button>
                <p className="text-sm text-center text-muted-foreground">
                  Already have an account?{" "}
                  <a href="/login" className="text-purple-600 hover:underline dark:text-primary">
                    Sign in
                  </a>
                </p>
              </form>
            </Form>
          ) : (
            <>
              <Auth
                supabaseClient={supabase}
                providers={["google"]}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: "#8b5cf6",
                        brandAccent: "#ec4899",
                      },
                    },
                  },
                }}
                theme={theme === 'dark' ? 'dark' : 'default'}
                redirectTo={`${window.location.origin}/`}
              />
              <div className="mt-4">
                <Button 
                  onClick={handleGoogleAuth}
                  variant="outline" 
                  className="w-full flex items-center justify-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </Button>
              </div>
              <p className="text-sm text-center text-muted-foreground mt-4">
                Don't have an account?{" "}
                <a href="/login?mode=register" className="text-purple-600 hover:underline dark:text-primary">
                  Sign up
                </a>
              </p>
            </>
          )}
          
          <p className="text-xs text-muted-foreground mt-4">
            By continuing you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}