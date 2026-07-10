"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  Plus,
  MapPin,
  Clock,
  DollarSign,
  ChevronRight,
  Loader2,
} from "lucide-react";

interface Project {
  id: string;
  projectType: string;
  island: string;
  area: string;
  budgetRange: string;
  status: string;
  createdAt: string;
  leads: Array<{
    id: string;
    status: string;
    contractor: {
      businessName: string;
    };
  }>;
}

export default function DashboardPage() {
  const { isSignedIn, userId } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSignedIn) {
      fetchProjects();
    }
  }, [isSignedIn]);

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects");
      const data = await response.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-sand-50 py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Sign in to view your projects</h1>
          <p className="mt-4 text-gray-600">
            Create an account or sign in to manage your projects and connect with contractors.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Projects</h1>
            <p className="mt-2 text-gray-600">
              Manage your projects and contractor connections
            </p>
          </div>
          <Link href="/post-project" className="btn-primary">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-16"
          >
            <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
              <Plus className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No projects yet
            </h2>
            <p className="text-gray-600 mb-6">
              Post your first project to get matched with verified contractors
            </p>
            <Link href="/post-project" className="btn-primary">
              Post a Project
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {project.projectType}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          project.status === "OPEN"
                            ? "bg-green-100 text-green-800"
                            : project.status === "MATCHED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {project.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {project.island}, {project.area}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {project.budgetRange}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(project.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Link
                    href={`/dashboard/projects/${project.id}`}
                    className="flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
                  >
                    View
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>

                {project.leads.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Contractor interest ({project.leads.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {project.leads.map((lead) => (
                        <span
                          key={lead.id}
                          className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700"
                        >
                          {lead.contractor.businessName} · {lead.status}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
