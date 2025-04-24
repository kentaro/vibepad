import { Suspense } from "react";
import ChordPad from "./components/ChordPad";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <main className="flex-1 p-4 md:p-6 flex flex-col items-center justify-center">
        <Suspense>
          <ChordPad />
        </Suspense>
      </main>
    </div>
  );
}
