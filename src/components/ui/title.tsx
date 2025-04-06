import * as React from "react"
import { cn } from "@/lib/utils"

type TitleProps = {
  children: React.ReactNode
  description?: React.ReactNode
  className?: string
  descriptionClassName?: string
  size?: "small" | "medium" | "large" | "xl"
  spacing?: "tight" | "normal" | "loose"
  showBackButton?: boolean
  backButtonAction?: () => void
}

export const Title = React.forwardRef<
  HTMLDivElement,
  TitleProps
>(({ 
  children, 
  description, 
  className, 
  descriptionClassName,
  size = "medium", 
  spacing = "normal",
  ...props 
}, ref) => {
  const titleSizeMap = {
    small: "text-lg font-semibold",
    medium: "text-xl font-bold",
    large: "text-2xl font-bold",
    xl: "text-3xl font-bold"
  }

  const spacingMap = {
    tight: "mb-2",
    normal: "mb-4",
    loose: "mb-6"
  }
  
  return (
    <div
      ref={ref}
      className={cn("title-container", spacingMap[spacing], className)}
      {...props}
    >
      <h1 className={cn(titleSizeMap[size])}>{children}</h1>
      {description && (
        <p className={cn("text-sm text-muted-foreground mt-1", descriptionClassName)}>
          {description}
        </p>
      )}
    </div>
  )
})

Title.displayName = "Title" 