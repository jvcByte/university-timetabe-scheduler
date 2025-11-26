import { Metadata } from "next";
import { readFile } from "fs/promises";
import { join } from "path";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Architecture | Documentation",
  description: "System architecture and design patterns",
};

export default async function ArchitecturePage() {
  const filePath = join(process.cwd(), "docs", "ARCHITECTURE.md");
  const content = await readFile(filePath, "utf-8");

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/docs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Documentation
          </Button>
        </Link>
        <a href="/api/docs/ARCHITECTURE.md" download>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Markdown
          </Button>
        </a>
      </div>

      <MarkdownViewer content={content} />
    </div>
  );
}
