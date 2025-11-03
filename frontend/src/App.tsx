import React, { useState } from "react"
import { AuthProvider, useAuth } from "./context/AuthProvider"
import Login from "./components/Login"
import Landing from "./components/Landing"
import { ProjectsPage } from "./components/ProjectsPage"
import { DashboardPage } from "./components/DashboardPage"

type View = "landing" | "login" | "projects" | "dashboard"

function LoggedIn() {
  const { user, signOut } = useAuth()
  const [currentView, setCurrentView] = useState<View>("projects")
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)

  const handleProjectClick = (projectId: number) => {
    setSelectedProjectId(projectId)
    setCurrentView("dashboard")
  }

  const handleBackToProjects = () => {
    setCurrentView("projects")
    setSelectedProjectId(null)
  }

  return (
      <div className="size-full p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">
            Welcome {user?.email || "user"}
          </h2>
          <button
              onClick={signOut}
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            Sign out
          </button>
        </div>

        {currentView === "projects" && (
            <ProjectsPage onProjectClick={handleProjectClick} />
        )}

        {currentView === "dashboard" && selectedProjectId && (
            <DashboardPage
                projectId={selectedProjectId}
                onBack={handleBackToProjects}
            />
        )}
      </div>
  )
}

function Main() {
  const { session } = useAuth()
  const [view, setView] = useState<"landing" | "login">("landing")

  if (session) return <LoggedIn />

  return (
      <div>
        {view === "landing" ? (
            <Landing onStart={() => setView("login")} />
        ) : (
            <Login onBack={() => setView("landing")} />
        )}
      </div>
  )
}

export default function App() {
  return (
      <AuthProvider>
        <div className="min-h-screen flex flex-col">
          <main className="flex-grow">
            <Main />
          </main>
        </div>
      </AuthProvider>
  )
}
