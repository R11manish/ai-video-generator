import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

const Navigation: React.FC = () => {
  return (
    <nav className="border-b bg-background p-4 sticky top-0 z-50">
      <div className="container flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          EssentiallySports Shorts
        </Link>

        <div className="flex gap-4">
          <Link href="/" passHref>
            <Button variant="ghost">Home</Button>
          </Link>

          <Link href="/admin/sqs" passHref>
            <Button variant="outline" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Generate AI Videos
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
