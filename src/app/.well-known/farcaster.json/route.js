import { NextResponse } from "next/server";

export async function GET() {
  const manifest = {
    accountAssociation: {
      header: "",
      payload: "",
      signature: "",
    },
    miniapp: {
      version: "1",
      name: "Base Micro-Bounties Hub",
      subtitle: "Small Tasks. Instant On-Chain Payments.",
      description:
        "Decentralized micro-bounty marketplace on Base. Post tasks, lock rewards in escrow, get paid on approval.",
      iconUrl: "https://base-micro-bounties-hub.vercel.app/icon.png",
      homeUrl: "https://base-micro-bounties-hub.vercel.app",
      splashImageUrl: "https://base-micro-bounties-hub.vercel.app/splash.png",
      splashBackgroundColor: "#0A0B14",
      primaryCategory: "finance",
      tags: ["bounties", "escrow", "base", "payments", "defi"],
      heroImageUrl: "https://base-micro-bounties-hub.vercel.app/hero.png",
      tagline: "Post bounties. Get paid on-chain.",
      ogTitle: "Base Micro-Bounties Hub",
      ogDescription: "Decentralized micro-bounty marketplace on Base",
      ogImageUrl: "https://base-micro-bounties-hub.vercel.app/hero.png",
    },
  };

  return NextResponse.json(manifest);
}
