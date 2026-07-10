import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-sand-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-gray-600">Sign in to your Groundwork BHS account</p>
        </div>
        <SignIn 
          appearance={{
            elements: {
              card: "shadow-none border-0",
              formButtonPrimary: "bg-primary-600 hover:bg-primary-700",
            }
          }}
        />
      </div>
    </div>
  );
}
