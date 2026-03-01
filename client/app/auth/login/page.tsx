import { Button } from "@/components/ui/button";

const LoginAI = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black font-mono">
      
      {/* Card */}
      <div className="w-[380px] p-8 rounded-2xl bg-muted/50 shadow-xl border border-border">
        
        {/* Heading */}
        <h1 className="text-2xl text-center text-foreground mb-6">
          Login <span className="">NxtAi</span>
        </h1>

        {/* Form */}
        <form className="space-y-5">
          
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">
              Email
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-1 rounded-lg bg-muted/50 border border-border 
                         focus:outline-none  focus:ring-1 focus:ring-ring 
                         text-foreground"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              className="px-4 py-1 rounded-lg bg-muted/50 border border-border 
                         focus:outline-none focus:ring-1 focus:ring-ring 
                         text-foreground"
            />
          </div>

          {/* Button */}
          <Button
            type="submit"
            className="w-full p-2 text-md rounded-lg bg-muted/50 text-gray-400 hover:text-primary-foreground
                       hover:opacity-90 transition duration-200  cursor-pointer "
          >
            Sign In
          </Button>

        </form>

        {/* Footer */}
        <div className="mt-6 w-full text-center" >
        <p className="text-center  text-sm text-muted-foreground ">
          Don’t have an account?{" "}
          <span className="text-gray-400 cursor-pointer hover:text-primary-foreground hover:underline">
            Sign up
          </span>
        </p>
        </div>

      </div>
    </div>
  );
};

export default LoginAI;