import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function SignupSuccessPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card className="border-2">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Check Your Email</CardTitle>
            <CardDescription className="text-base">
              We've sent you a confirmation email. Please check your inbox and click the verification link to activate
              your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">What's next?</p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Sign in to your account</li>
              </ol>
            </div>
            <Link href="/login" className="block">
              <Button className="w-full">Go to Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
