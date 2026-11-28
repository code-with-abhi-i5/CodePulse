import * as React from "react"
import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"

import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
  SheetClose,
  sheetVariants,
} from "./sheet"

describe("Sheet Component", () => {
  it("renders open sheet with header, title, description, and footer", () => {
    render(
      <Sheet open={true}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Sheet Header Title</SheetTitle>
            <SheetDescription>Sheet helper description text</SheetDescription>
          </SheetHeader>
          <div>Sheet body content</div>
          <SheetFooter>
            <button>Save Changes</button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    )

    expect(screen.getByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText("Sheet Header Title")).toBeInTheDocument()
    expect(screen.getByText("Sheet helper description text")).toBeInTheDocument()
    expect(screen.getByText("Sheet body content")).toBeInTheDocument()
    expect(screen.getByText("Save Changes")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument()
  })

  it("applies proper data-side and responsive styling for side='right'", () => {
    render(
      <Sheet open={true}>
        <SheetContent side="right">
          <SheetTitle>Right Sheet</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    const content = screen.getByRole("dialog")
    expect(content).toHaveAttribute("data-side", "right")
    expect(content.className).toContain("right-0")
    expect(content.className).toContain("border-l")
    expect(content.className).toContain("sm:max-w-sm")
  })

  it("applies proper data-side and styling for side='left'", () => {
    render(
      <Sheet open={true}>
        <SheetContent side="left">
          <SheetTitle>Left Sheet</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    const content = screen.getByRole("dialog")
    expect(content).toHaveAttribute("data-side", "left")
    expect(content.className).toContain("left-0")
    expect(content.className).toContain("border-r")
  })

  it("applies proper styling for side='top' with responsive max-height", () => {
    render(
      <Sheet open={true}>
        <SheetContent side="top">
          <SheetTitle>Top Sheet</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    const content = screen.getByRole("dialog")
    expect(content).toHaveAttribute("data-side", "top")
    expect(content.className).toContain("top-0")
    expect(content.className).toContain("border-b")
    expect(content.className).toContain("max-h-[85vh]")
    expect(content.className).toContain("sm:max-h-[75vh]")
    expect(content.className).toContain("md:max-h-[60vh]")
  })

  it("applies proper styling for side='bottom' with responsive max-height", () => {
    render(
      <Sheet open={true}>
        <SheetContent side="bottom">
          <SheetTitle>Bottom Sheet</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    const content = screen.getByRole("dialog")
    expect(content).toHaveAttribute("data-side", "bottom")
    expect(content.className).toContain("bottom-0")
    expect(content.className).toContain("border-t")
    expect(content.className).toContain("max-h-[85vh]")
  })

  it("supports size variants like lg and full", () => {
    const { rerender } = render(
      <Sheet open={true}>
        <SheetContent side="right" size="lg">
          <SheetTitle>Large Sheet</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    let content = screen.getByRole("dialog")
    expect(content.className).toContain("sm:max-w-md")
    expect(content.className).toContain("md:max-w-lg")
    expect(content.className).toContain("lg:max-w-xl")

    rerender(
      <Sheet open={true}>
        <SheetContent side="right" size="full">
          <SheetTitle>Full Sheet</SheetTitle>
        </SheetContent>
      </Sheet>
    )
    content = screen.getByRole("dialog")
    expect(content.className).toContain("w-screen")
    expect(content.className).toContain("max-w-none")
  })

  it("hides close button when showCloseButton={false}", () => {
    render(
      <Sheet open={true}>
        <SheetContent showCloseButton={false}>
          <SheetTitle>No Close Button Sheet</SheetTitle>
        </SheetContent>
      </Sheet>
    )

    expect(screen.queryByRole("button", { name: /close/i })).not.toBeInTheDocument()
  })

  it("renders SheetTrigger and SheetClose appropriately", () => {
    render(
      <Sheet>
        <SheetTrigger>Open Drawer</SheetTrigger>
        <SheetContent>
          <SheetTitle>Drawer Title</SheetTitle>
          <SheetClose>Dismiss</SheetClose>
        </SheetContent>
      </Sheet>
    )

    expect(screen.getByText("Open Drawer")).toBeInTheDocument()
  })

  it("exports sheetVariants cva helper with default options", () => {
    const defaultClasses = sheetVariants()
    expect(defaultClasses).toContain("fixed")
    expect(defaultClasses).toContain("z-50")
    expect(defaultClasses).toContain("right-0")
  })
})
