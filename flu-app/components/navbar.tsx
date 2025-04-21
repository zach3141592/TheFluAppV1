import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, ClipboardList } from "lucide-react"

export function Navbar() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-bold text-xl flex items-center gap-2">
          <span className="text-red-600">The Flu App</span>
          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Canada</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Button>
          </Link>
          <Link href="/survey">
            <Button variant="ghost" size="sm" className="flex items-center gap-1">
              <ClipboardList className="h-4 w-4" />
              <span>Survey</span>
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  )
}
