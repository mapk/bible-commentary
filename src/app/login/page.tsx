import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Login</h1>
          <p className="text-sm text-slate-600">
            Please sign in to add commentary
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
