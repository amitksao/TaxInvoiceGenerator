import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuthTest() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test Authentication Form</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoFocus
            />
            <p className="text-sm text-gray-600 mt-1">Value: {username}</p>
          </div>
          
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
            <p className="text-sm text-gray-600 mt-1">Value: {password}</p>
          </div>
          
          <Button 
            onClick={() => {
              console.log("Username:", username);
              console.log("Password:", password);
              alert(`Username: ${username}, Password: ${password}`);
            }}
            className="w-full"
          >
            Test Submit
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => {
              setUsername("");
              setPassword("");
            }}
            className="w-full"
          >
            Clear
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}