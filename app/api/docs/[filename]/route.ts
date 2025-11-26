import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    
    // Whitelist allowed files
    const allowedFiles = [
      "USER_GUIDE.md",
      "SOLVER_ALGORITHM.md",
      "ARCHITECTURE.md",
      "API_DOCUMENTATION.md",
      "README.md",
    ];

    if (!allowedFiles.includes(filename)) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const filePath = join(process.cwd(), "docs", filename);
    const content = await readFile(filePath, "utf-8");

    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/markdown",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error serving documentation file:", error);
    return NextResponse.json(
      { error: "Failed to read file" },
      { status: 500 }
    );
  }
}
