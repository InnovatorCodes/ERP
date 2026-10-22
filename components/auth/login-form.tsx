"use client"
import { useState } from "react"
import Image from "next/image"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

export default function LoginForm({ errorMessage }: { errorMessage?: string }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setIsSubmitting(false)
    } else {
      // Full page load so the middleware sees the new session cookies and
      // sends "/" to the role's home page. If it sends the user back here
      // with an error, the page starts fresh and shows the message instead
      // of staying on "Logging in...".
      window.location.assign("/")
    }
  }

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-3">
          <Image src="/Vinyork_Logo.png" alt="Vinyork" width={35} height={40} className="h-10 w-auto" priority />
          <span className="text-xl uppercase tracking-[0.25em] text-sidebar-accent-foreground" style={{ fontFamily: 'Mainlux, sans-serif' }}>
            Vinyork
          </span>
        </div>
        <div className="max-w-md space-y-3">
          <p className="text-3xl font-semibold leading-tight text-sidebar-accent-foreground">
            Every order, from carpentry to delivery.
          </p>
          <p className="text-sidebar-muted">
            Customers, products, production and history in one place.
          </p>
        </div>
        <p className="text-xs text-sidebar-muted">© {new Date().getFullYear()} Vinyork</p>
      </div>

      {/* Sign-in form */}
      <div className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Image src="/Vinyork_Logo.png" alt="Vinyork" width={28} height={32} className="h-8 w-auto" />
            <span className="text-lg uppercase tracking-[0.2em]" style={{ fontFamily: 'Mainlux, sans-serif' }}>Vinyork</span>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in with your work account.</p>

          {errorMessage && (
            <p role="alert" className="mt-6 rounded-lg border border-destructive/20 bg-destructive-soft p-3 text-sm text-destructive">
              {errorMessage}
            </p>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 bg-card"
                placeholder="you@vinyork.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 bg-card"
              />
            </div>

            <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Accounts are created by an admin.
          </p>
        </div>
      </div>
    </div>
  )
}
