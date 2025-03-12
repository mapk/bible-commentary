import UpdatePasswordForm from "@/components/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Update Password</h1>
          <p className="text-sm text-slate-600">Enter your new password</p>
        </div>
        <UpdatePasswordForm />
      </div>
    </div>
  );
}
