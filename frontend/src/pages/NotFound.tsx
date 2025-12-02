import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Home } from "lucide-react"
import { Button } from "../components/ui/Button"

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md"
      >
        <h1 className="mb-4 text-9xl font-bold text-primary">404</h1>
        <h2 className="mb-6 text-3xl font-bold">Page Not Found</h2>
        <p className="mb-8 text-muted-foreground">The page you are looking for doesn't exist or has been moved.</p>
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

export default NotFound
