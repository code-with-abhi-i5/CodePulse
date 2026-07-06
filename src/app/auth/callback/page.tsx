"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const code = searchParams.get("code");
    
    if (!code) {
      setError("No authentication code found.");
      return;
    }

    const authenticate = async () => {
      try {
        // Send code to backend
        const response = await apiClient.post("/auth/github", { code });
        
        // Save token to localStorage
        if (response.data && response.data.data && response.data.data.accessToken) {
          localStorage.setItem("devbattle_token", response.data.data.accessToken);
          
          // Invalidate auth query to fetch real user
          queryClient.invalidateQueries({ queryKey: ["auth"] });
          
          toast.success("Successfully logged in!");
          router.push("/dashboard");
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (err) {
        console.error("Auth error:", err);
        setError("Authentication failed. Please try again.");
        toast.error("Authentication failed");
      }
    };

    authenticate();
  }, [searchParams, router, queryClient]);

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="glass-card p-8 rounded-2xl max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Authentication Failed</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button 
            onClick={() => router.push("/login")}
            className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <h2 className="text-xl font-semibold">Authenticating with GitHub...</h2>
      <p className="text-muted-foreground">Please wait while we log you in.</p>
    </div>
  );
}
