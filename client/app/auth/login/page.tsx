"use client";

import { Button } from "@/components/ui/button";
import { useState, ChangeEvent, FormEvent } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "@/app/store/auth-slice/auth";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Dispatch } from "@reduxjs/toolkit";

type FormDataType = {
  email: string;
  password: string;
};

const LoginAI = () => {
  const [formData, setFormData] = useState<FormDataType>({
    email: "",
    password: "",
  });
  const dispatch = useDispatch<any>();
  const router = useRouter();

  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    dispatch(loginUser(formData))
      .unwrap()
      .then((data: any) => {
        toast.success(data?.message || "Login successful!");
        router.push("/");
      })
      .catch((error: any) => {
        console.error(error);
        toast.error(error?.message || error?.error || "Login failed");
      });
  };

  return (
    <div className="w-full flex items-center justify-center bg-black font-mono min-h-screen">
      {/* Card */}
      <div className="w-[380px] p-8 rounded-2xl bg-muted/50 shadow-xl border border-border">
        {/* Heading */}
        <h1 className="text-2xl text-center text-foreground mb-6">
          Login{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            NxtAi
          </span>
        </h1>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-5">
          {/* Email */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={onChange}
              placeholder="Enter your email"
              className="px-4 py-2 rounded-lg bg-muted/50 border border-border 
                         focus:outline-none focus:ring-1 focus:ring-ring 
                         text-foreground"
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label className="text-sm text-muted-foreground">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={onChange}
              placeholder="Enter your password"
              className="px-4 py-2 rounded-lg bg-muted/50 border border-border 
                         focus:outline-none focus:ring-1 focus:ring-ring 
                         text-foreground"
            />
          </div>

          {/* Button */}
          <Button
            type="submit"
            className="w-full p-2 text-md rounded-lg bg-muted/50 text-gray-400 
                       hover:text-primary-foreground hover:opacity-90 
                       transition duration-200 cursor-pointer"
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 w-full text-center">
          <p className="text-sm text-muted-foreground">
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
