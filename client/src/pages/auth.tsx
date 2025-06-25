import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileText, UserPlus, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function Auth() {
  const [isLogin, setIsLogin] = useState(false); // Start with register form
  const { login, register, loginError, registerError, isLoggingIn, isRegistering } = useAuth();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onLoginSubmit = (data: LoginForm) => {
    login(data);
  };

  const onRegisterSubmit = (data: RegisterForm) => {
    register(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Invoice Management System
          </h1>
          <p className="text-gray-600">
            Dipak Kumar Sao & Associates
          </p>
          <p className="text-sm text-gray-500">
            (Advocate & Tax Consultant)
          </p>
        </div>

        {/* Auth Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? "Admin Login" : "Create Admin Account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLogin ? (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter username" 
                            autoComplete="username"
                            autoFocus
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Enter password" 
                            autoComplete="current-password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {loginError && (
                    <Alert variant="destructive">
                      <AlertDescription>{loginError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={isLoggingIn}>
                    <LogIn className="w-4 h-4 mr-2" />
                    {isLoggingIn ? "Logging in..." : "Login"}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Choose username (min 3 chars)" 
                            autoComplete="username"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={registerForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input 
                            type="password" 
                            placeholder="Choose password (min 6 chars)" 
                            autoComplete="new-password"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {registerError && (
                    <Alert variant="destructive">
                      <AlertDescription>{registerError}</AlertDescription>
                    </Alert>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={isRegistering}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isRegistering ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
            )}

            <div className="mt-4 text-center">
              <Button
                variant="ghost"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm"
              >
                {isLogin 
                  ? "Need to create an admin account? Register here" 
                  : "Already have an account? Login here"
                }
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info */}
        <div className="text-center text-sm text-gray-600">
          <p>📧 dipakadv.sao@gmail.com</p>
          <p>📞 9778780582 / 9434001881</p>
        </div>
      </div>
    </div>
  );
}