"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PopoverContextType {
  open: boolean
  setOpen: (open: boolean) => void
}

const PopoverContext = React.createContext<PopoverContextType>({
  open: false,
  setOpen: () => {},
})

const Popover = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  
  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative">
        {children}
      </div>
    </PopoverContext.Provider>
  )
}

const PopoverTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  const { open, setOpen } = React.useContext(PopoverContext)
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setOpen(!open)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      ref,
    })
  }

  return (
    <div
      ref={ref}
      className={className}
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  )
})
PopoverTrigger.displayName = "PopoverTrigger"

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "center" | "end" }
>(({ className, align = "center", children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(PopoverContext)
  const contentRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        // 检查是否点击了 trigger
        const parent = contentRef.current.parentElement
        if (parent && !parent.contains(event.target as Node)) {
          setOpen(false)
        }
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open, setOpen])

  if (!open) return null

  return (
    <div
      ref={(node) => {
        (contentRef as React.MutableRefObject<HTMLDivElement | null>).current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }}
      className={cn(
        "absolute z-50 mt-1 min-w-[200px] rounded-md border bg-white shadow-md animate-in fade-in-0 zoom-in-95",
        align === "start" && "left-0",
        align === "center" && "left-1/2 -translate-x-1/2",
        align === "end" && "right-0",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
PopoverContent.displayName = "PopoverContent"

export { Popover, PopoverTrigger, PopoverContent }

