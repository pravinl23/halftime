import { Navbar } from "@/components/layout/navbar"
import { VideoRow } from "@/components/layout/video-row"
import { ContinueWatchingRow } from "@/components/layout/continue-watching-row"
import { getMovie } from "@/lib/omdb"
import type { Video, ContinueWatchingItem } from "@/lib/mock-data"

// Reusing the types from mock-data for now to maintain compatibility with components
// Ideally, these types should be moved to a shared types file

export default async function Home() {
  // Fetch data for various shows
  const showTitles = [
    "South Park",
    "Suits",
    "Rick and Morty",
    "The Office",
    "Breaking Bad",
    "Game of Thrones",
    "Stranger Things",
    "The Simpsons"
  ];

  const showsData = await Promise.all(
    showTitles.map(title => getMovie(title))
  );

  // Create a map for easy access
  const showsMap = new Map();
  showTitles.forEach((title, index) => {
    if (showsData[index]) {
      showsMap.set(title, showsData[index]);
    }
  });

  const movies: Video[] = [];
  const continueWatchingItems: ContinueWatchingItem[] = [];

  // Helper to create video objects with fallback
  const createVideo = (id: string, title: string): Video => {
    const data = showsMap.get(title);
    // Default fallback data if API fails
    const defaultData = {
      Poster: "/shows/southpark.jpeg",
      Rated: "TV-MA",
      Year: "2000",
      Genre: "Comedy"
    };
    
    const poster = data?.Poster && data.Poster !== "N/A" ? data.Poster : defaultData.Poster;
    
    return {
      id,
      title: (data?.Title || title).toUpperCase(),
      thumbnailUrl: poster,
      rating: data?.Rated || defaultData.Rated,
      year: (data?.Year || defaultData.Year).split("–")[0],
      genre: (data?.Genre || defaultData.Genre).split(", ").slice(0, 2),
      studio: "TV Network", // OMDb doesn't provide consistent network info
      isNew: id === "1" || id === "3" // Mock "New" badge logic
    };
  };

  // Generate Recommended List from the fetched shows
  showTitles.forEach((title, index) => {
    movies.push(createVideo((index + 1).toString(), title));
  });

  // Generate Continue Watching List with specific episodes
  if (showsMap.get("South Park")) {
    continueWatchingItems.push({
      id: "cw1",
      title: "South Park: Veal",
      thumbnailUrl: showsMap.get("South Park")?.Poster || "/shows/southpark.jpeg",
      timeRemaining: "15m remaining",
      rating: "TV-MA",
      episode: "S10:E12"
    });
  }
  
  if (showsMap.get("Suits")) {
    continueWatchingItems.push({
      id: "cw2",
      title: "Suits: Pilot",
      thumbnailUrl: showsMap.get("Suits")?.Poster || "/shows/suits.jpeg",
      timeRemaining: "25m remaining",
      rating: "TV-14",
      episode: "S1:E1"
    });
  }

  if (showsMap.get("Rick and Morty")) {
    continueWatchingItems.push({
      id: "cw3",
      title: "Rick and Morty: Pilot",
      thumbnailUrl: showsMap.get("Rick and Morty")?.Poster || "/shows/southpark.jpeg", // Fallback
      timeRemaining: "8m remaining",
      rating: "TV-14",
      episode: "S1:E1"
    });
  }


  return (
    <div className="relative min-h-screen bg-black">
      <Navbar />
      
      <main className="pt-24 pb-24">
        <VideoRow 
          title="Recommended For You"
          videos={movies}
        />
        
        <ContinueWatchingRow
          title="Continue Watching"
          items={continueWatchingItems}
        />
      </main>
    </div>
  )
}
