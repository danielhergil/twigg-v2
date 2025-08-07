import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

interface EmailConfirmationMessageProps {
  email: string;
  onBackToLogin: () => void;
}

export function EmailConfirmationMessage({ email, onBackToLogin }: EmailConfirmationMessageProps) {
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 p-3 rounded-full w-12 h-12 flex items-center justify-center mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Check your email</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground mb-4">
          We've sent a confirmation email to <strong>{email}</strong>. 
          Please click the link in the email to verify your account.
        </p>
        <p className="text-sm text-muted-foreground">
          Didn't receive the email? Check your spam folder or wait a few minutes.
        </p>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={onBackToLogin}
          variant="outline" 
          className="w-full"
        >
          Back to login
        </Button>
      </CardFooter>
    </Card>
  );
}