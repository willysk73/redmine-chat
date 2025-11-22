"use client";

import ProjectList from "@/components/ProjectList";
import IssueList from "@/components/IssueList";
import ChatArea from "@/components/ChatArea";

export default function Home() {
  return (
    <main className="flex h-screen w-full bg-gray-950 text-white overflow-hidden">
      <ProjectList />
      <IssueList />
      <ChatArea />
    </main>
  );
}
