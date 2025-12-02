"use client"

import { Outlet } from "react-router-dom"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Sidebar from "../components/layout/Sidebar"
import Header from "../components/layout/Header"
import { useIsMobile } from "../hooks/useIsMobile"

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence>
        {(sidebarOpen || !isMobile) && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={`fixed inset-y-0 left-0 z-50 w-64 bg-background border-r border-border md:relative ${
              sidebarOpen && isMobile ? "block" : ""
            }`}
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-col flex-1 w-full overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
