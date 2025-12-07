import { Navbar } from "@/components/layout/navbar"
import { VideoRow } from "@/components/layout/video-row"
import { ContinueWatchingRow } from "@/components/layout/continue-watching-row"
import { MOCK_DATA } from "@/lib/mock-data"

export default function Home() {
  return (
    <div className="relative min-h-screen bg-black">
      <Navbar />
      
      <main className="pt-24 pb-24">
        <VideoRow 
          title="Recommended For You"
          videos={MOCK_DATA.recommended}
        />
        
        <ContinueWatchingRow
          title="Continue Watching"
          items={MOCK_DATA.continueWatching}
        />
      </main>
    </div>
  )
}
