import type { Metadata } from "next";
import LandingPage from "./components/LandingPage";

export const metadata: Metadata = {
  title: "Bereken je richtprijs | Floors & More",
  description: "Bereken in enkele stappen een indicatieve richtprijs voor jouw gietvloer.",
};

export default function Home() {
  return <LandingPage />;
}
