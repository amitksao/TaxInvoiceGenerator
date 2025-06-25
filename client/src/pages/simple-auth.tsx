import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { FileText } from "lucide-react";

export default function SimpleAuth() {
  const [isLogin, setIsLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, register, loginError, registerError, isLoggingIn, isRegistering } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", { username, password, isLogin });
    
    if (!username.trim() || !password.trim()) {
      alert("Please fill in both fields");
      return;
    }

    if (isLogin) {
      login({ username: username.trim(), password: password.trim() });
    } else {
      if (username.trim().length < 3) {
        alert("Username must be at least 3 characters");
        return;
      }
      if (password.trim().length < 6) {
        alert("Password must be at least 6 characters");
        return;
      }
      register({ username: username.trim(), password: password.trim() });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
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

        {/* Simple Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {isLogin ? "Admin Login" : "Create Admin Account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium mb-2">
                  Username {!isLogin && "(min 3 characters)"}
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    console.log("Username changed:", e.target.value);
                    setUsername(e.target.value);
                  }}
                  onInput={(e) => console.log("Username input:", e.currentTarget.value)}
                  onKeyDown={(e) => console.log("Username keydown:", e.key)}
                  placeholder={isLogin ? "Enter username" : "Choose username"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                  autoComplete="username"
                  spellCheck={false}
                />
                <p className="text-xs text-gray-500 mt-1">Current value: "{username}"</p>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password {!isLogin && "(min 6 characters)"}
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    console.log("Password changed:", e.target.value);
                    setPassword(e.target.value);
                  }}
                  onInput={(e) => console.log("Password input:", e.currentTarget.value)}
                  onKeyDown={(e) => console.log("Password keydown:", e.key)}
                  placeholder={isLogin ? "Enter password" : "Choose password"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  spellCheck={false}
                />
                <p className="text-xs text-gray-500 mt-1">Current value: "{password.replace(/./g, '*')}"</p>
              </div>

              {(loginError || registerError) && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                  {loginError || registerError}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoggingIn || isRegistering}
              >
                {(isLoggingIn || isRegistering) 
                  ? "Processing..." 
                  : (isLogin ? "Login" : "Create Account")
                }
              </Button>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setUsername("");
                  setPassword("");
                }}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {isLogin 
                  ? "Need to create an admin account? Register here" 
                  : "Already have an account? Login here"
                }
              </button>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded text-xs">
              <p>Debug Info:</p>
              <p>Username: "{username}" (length: {username.length})</p>
              <p>Password: "{password.replace(/./g, '*')}" (length: {password.length})</p>
              <p>Mode: {isLogin ? "Login" : "Register"}</p>
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