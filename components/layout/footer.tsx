import Link from "next/link";
import { HardHat, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 text-xl font-bold text-white mb-4">
              <HardHat className="h-7 w-7" />
              <span>Groundwork BHS</span>
            </div>
            <p className="text-sm leading-6 max-w-sm">
              Connecting homeowners with verified contractors across The Bahamas. 
              From New Providence to the Family Islands, we make construction projects simple.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Platform</h3>
            <ul className="space-y-3">
              <li><Link href="/post-project" className="text-sm hover:text-white transition-colors">Post a Project</Link></li>
              <li><Link href="/contractors" className="text-sm hover:text-white transition-colors">Find Contractors</Link></li>
              <li><Link href="/advisor" className="text-sm hover:text-white transition-colors">AI Advisor</Link></li>
              <li><Link href="/pricing" className="text-sm hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                hello@groundworksbhs.com
              </li>
              <li className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4" />
                +1 (242) 555-0100
              </li>
              <li className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                Nassau, New Providence
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-800 pt-8 text-sm">
          <p>&copy; {new Date().getFullYear()} Groundwork BHS. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
