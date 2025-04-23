import ChordPad from "./components/ChordPad";
import { Suspense } from "react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center">
        <Suspense fallback={<div>Loading...</div>}>
          <ChordPad />
        </Suspense>
      </main>
    </div>
  );
}
