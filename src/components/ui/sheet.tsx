"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

export interface SheetOverlayProps extends SheetPrimitive.Backdrop.Props {
  className?: string
}

function SheetOverlay({ className, ...props }: SheetOverlayProps) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ease-in-out data-ending-style:opacity-0 data-starting-style:opacity-0 dark:bg-black/80",
        className
      )}
      {...props}
    />
  )
}

const sheetVariants = cva(
  "fixed z-50 flex flex-col gap-4 bg-background text-foreground shadow-2xl transition ease-in-out duration-300 outline-none data-ending-style:opacity-0 data-starting-style:opacity-0 focus-visible:outline-none dark:bg-card dark:text-card-foreground",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b border-border max-h-[85vh] sm:max-h-[75vh] md:max-h-[60vh] overflow-y-auto data-ending-style:-translate-y-full data-starting-style:-translate-y-full",
        bottom: "inset-x-0 bottom-0 border-t border-border max-h-[85vh] sm:max-h-[75vh] md:max-h-[60vh] overflow-y-auto data-ending-style:translate-y-full data-starting-style:translate-y-full",
        left: "inset-y-0 left-0 h-full border-r border-border data-ending-style:-translate-x-full data-starting-style:-translate-x-full",
        right: "inset-y-0 right-0 h-full border-l border-border data-ending-style:translate-x-full data-starting-style:translate-x-full",
      },
      size: {
        default: "",
        sm: "",
        md: "",
        lg: "",
        xl: "",
        full: "",
      },
    },
    compoundVariants: [
      {
        side: ["left", "right"],
        size: "default",
        className: "w-full sm:w-3/4 sm:max-w-sm md:max-w-md lg:max-w-lg",
      },
      {
        side: ["left", "right"],
        size: "sm",
        className: "w-full sm:w-3/4 sm:max-w-xs md:max-w-sm",
      },
      {
        side: ["left", "right"],
        size: "md",
        className: "w-full sm:w-3/4 sm:max-w-sm md:max-w-md",
      },
      {
        side: ["left", "right"],
        size: "lg",
        className: "w-full sm:w-3/4 sm:max-w-md md:max-w-lg lg:max-w-xl",
      },
      {
        side: ["left", "right"],
        size: "xl",
        className: "w-full sm:w-3/4 sm:max-w-lg md:max-w-xl lg:max-w-2xl",
      },
      {
        side: ["left", "right"],
        size: "full",
        className: "w-screen max-w-none",
      },
      {
        side: ["top", "bottom"],
        size: "full",
        className: "h-screen max-h-none",
      },
    ],
    defaultVariants: {
      side: "right",
      size: "default",
    },
  }
)

export interface SheetContentProps
  extends SheetPrimitive.Popup.Props,
    VariantProps<typeof sheetVariants> {
  children?: React.ReactNode
  showCloseButton?: boolean
  overlayClassName?: string
}

function SheetContent({
  className,
  children,
  side = "right",
  size = "default",
  showCloseButton = true,
  overlayClassName,
  ...props
}: SheetContentProps) {
  return (
    <SheetPortal>
      <SheetOverlay className={overlayClassName} />
      <SheetPrimitive.Popup
        data-slot="sheet-content"
        data-side={side}
        className={cn(sheetVariants({ side, size }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none dark:hover:bg-accent/80"
                size="icon-sm"
                aria-label="Close"
              />
            }
          >
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "flex flex-col gap-1.5 p-4 sm:p-6 text-center sm:text-left",
        className
      )}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn(
        "mt-auto flex flex-col-reverse gap-2 p-4 sm:flex-row sm:justify-end sm:gap-2 sm:p-6",
        className
      )}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-lg font-semibold tracking-tight text-foreground dark:text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn(
        "text-sm text-muted-foreground dark:text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  sheetVariants,
}
