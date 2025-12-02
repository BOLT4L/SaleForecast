"use client"

import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Home, ShieldAlert } from "lucide-react"
import { Button } from "../components/ui/Button"

const ForbiddenPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md"
      >
        <ShieldAlert className="w-24 h-24 mx-auto mb-4 text-destructive" />
        <h1 className="mb-4 text-6xl font-bold text-destructive">403</h1>
        <h2 className="mb-6 text-3xl font-bold">Access Denied</h2>
        <p className="mb-8 text-muted-foreground">
          You don't have permission to access this page. Please contact your administrator if you believe this is an
          error.
        </p>
        <Button asChild>
          <Link to="/" className="flex items-center gap-2">
            <Home className="w-5 h-5" />
            <span>Return to Dashboard</span>
          </Link>
        </Button>
      </motion.div>
    </div>
  )
}

export default ForbiddenPage
