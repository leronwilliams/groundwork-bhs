"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  MapPin,
  DollarSign,
  Clock,
  Building2,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface ProjectDetail {
  id: string;
  projectType: string;
  island: string;
  area: string;
  propertyType: string;
  budgetRange: string;
  squareFootage: number | null;
  description: string;
  startTimeline: string;
  hasPermit: string;
  needFinancing: string | null;
  status: string;
  createdAt: string;
  leads: Array<{
    id: string;
    status: string;
    purchaseDate: string;
    contractor: {
      businessName: string;
      contactName: string;
      phone: string;
      email: string;
    };
  }>;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      const data = await response.json();
      setProject(data);
    } catch (error) {
      console.error("Error fetching project:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-sand-50 py-12">
        <div className="mx-auto max-w-4xl px-4">
          <div className="card text-center py-16">
            <h2 className="text-xl font-semibold text-gray-900">Project not found</h2>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm text-gray-600 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to projects
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {project.projectType}
                </h1>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
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
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {project.island}, {project.area}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {project.budgetRange}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {project.startTimeline}
                </span>
                <span className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  {project.propertyType}
                </span>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              Posted {new Date(project.createdAt).toLocaleDateString()}
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-gray-100 pt-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Project Description
            </h2>
            <p className="text-gray-700 leading-relaxed">{project.description}</p>
          </div>

          {/* Details Grid */}
          <div className="grid sm:grid-cols-2 gap-4 border-t border-gray-100 pt-6 mb-6">
            <div>
              <span className="text-sm font-medium text-gray-500">
                Building Permit
              </span>
              <p className="text-gray-900">{project.hasPermit}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">
                Financing
              </span>
              <p className="text-gray-900">
                {project.needFinancing || "Not specified"}
              </p>
            </div>
            {project.squareFootage && (
              <div>
                <span className="text-sm font-medium text-gray-500">
                  Square Footage
                </span>
                <p className="text-gray-900">
                  {project.squareFootage.toLocaleString()} sq ft
                </p>
              </div>
            )}
          </div>

          {/* Contractor Interest */}
          {project.leads.length > 0 && (
            <div className="border-t border-gray-100 pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Contractor Interest ({project.leads.length})
              </h2>
              <div className="space-y-4">
                {project.leads.map((lead) => (
                  <motion.div
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">
                        {lead.contractor.businessName}
                      </h3>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          lead.status === "CONTACTED"
                            ? "bg-blue-100 text-blue-800"
                            : lead.status === "QUOTED"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {lead.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Contact: {lead.contractor.contactName}</p>
                      <p>Phone: {lead.contractor.phone}</p>
                      <p>Email: {lead.contractor.email}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
