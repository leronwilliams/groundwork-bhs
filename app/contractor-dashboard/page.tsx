"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import {
  Loader2,
  MapPin,
  DollarSign,
  Clock,
  Eye,
  Lock,
  CheckCircle,
} from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Lead {
  id: string;
  project: {
    id: string;
    projectType: string;
    island: string;
    area: string;
    budgetRange: string;
    description: string;
    startTimeline: string;
    hasPermit: string;
  };
  purchasePrice: number;
  isPurchased: boolean;
  purchasedAt: string | null;
}

export default function ContractorDashboardPage() {
  const { isSignedIn } = useAuth();
  const [leads, setLeads] = useState<{ matches: Lead[]; leads: any[] }>({
    matches: [],
    leads: [],
  });
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      fetchLeads();
    }
  }, [isSignedIn]);

  const fetchLeads = async () => {
    try {
      const response = await fetch("/api/contractors/leads");
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error("Error fetching leads:", error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseLead = async (matchId: string) => {
    setPurchasing(matchId);
    try {
      const response = await fetch(`/api/contractors/leads/${matchId}/purchase`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        if (data.clientSecret) {
          // Handle Stripe payment
          const stripe = await stripePromise;
          if (stripe) {
            const { error } = await stripe.confirmCardPayment(data.clientSecret);
            if (error) {
              console.error("Payment error:", error);
              return;
            }
          }
        }
        // Refresh leads
        fetchLeads();
      }
    } catch (error) {
      console.error("Error purchasing lead:", error);
    } finally {
      setPurchasing(null);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-sand-50 py-24">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Contractor Dashboard
          </h1>
          <p className="mt-4 text-gray-600">
            Sign in to view and purchase leads
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Lead Board</h1>
          <p className="mt-2 text-gray-600">
            New project matches in your service area
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
          </div>
        ) : leads.matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card text-center py-16"
          >
            <div className="mx-auto h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No leads yet
            </h2>
            <p className="text-gray-600">
              New projects matching your trade and island will appear here
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-6">
            {leads.matches.map((match, index) => (
              <motion.div
                key={match.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {match.project.projectType}
                      </h3>
                      {match.isPurchased ? (
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Purchased
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                          <Lock className="mr-1 h-3 w-3" />
                          Locked
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {match.project.island}, {match.project.area}
                      </span>
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        {match.project.budgetRange}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {match.project.startTimeline}
                      </span>
                    </div>

                    {match.isPurchased ? (
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700">
                          {match.project.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium text-gray-700">
                            Permit:
                          </span>
                          <span className="text-gray-600">
                            {match.project.hasPermit}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">
                        Purchase this lead to unlock full project details and
                        homeowner contact information.
                      </p>
                    )}
                  </div>

                  <div className="ml-6 text-right">
                    <div className="text-2xl font-bold text-gray-900">
                      ${match.purchasePrice}
                    </div>
                    <div className="text-sm text-gray-500">per lead</div>
                    {!match.isPurchased && (
                      <button
                        onClick={() => purchaseLead(match.id)}
                        disabled={purchasing === match.id}
                        className="mt-3 btn-primary text-sm py-2 px-4"
                      >
                        {purchasing === match.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            Unlock
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
