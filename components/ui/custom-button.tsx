// components/ui/custom-button.tsx
import React from "react";
import { Button } from "@/components/ui/button";

interface CustomButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "white" | "black";
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CustomButton({
  variant = "white",
  children,
  disabled = false,
  onClick,
  className = "",
  ...props
}: CustomButtonProps) {
  const baseStyles =
    "text-sm font-medium rounded-sm pt-4.5 pb-5 cursor-pointer transition w-full";

  const variantStyles = {
    white:
      "bg-primary text-black hover:bg-primary/80 disabled:bg-stone-600 disabled:text-gray-400",
    black:
      "bg-background text-primary border-2 border-[#1f1f1f] hover:bg-primary/10 disabled:bg-stone-600 disabled:text-gray-400",
  };

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className}`;

  return (
    <Button
      className={combinedClassName}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
}
