import { Navbar } from "@/components/layout/navbar"
import { VideoRow } from "@/components/layout/video-row"
import { ContinueWatchingRow } from "@/components/layout/continue-watching-row"
import { getMovie } from "@/lib/omdb"
import { getAllVideos } from "@/lib/videos"
import type { Video, ContinueWatchingItem } from "@/lib/mock-data"

export default async function Home() {
  // Get videos from our data store - first 3 are Suits, SpongeBob, Friends
  const allVideos = getAllVideos()
  
  // First 3 videos in correct order: Suits, SpongeBob, Friends
  const priorityVideos = allVideos.slice(0, 3) // IDs 1, 2, 3
  // Rest of the videos in any order
  const otherVideos = allVideos.slice(3)
  
  // Combine: priority first, then the rest
  const orderedVideos = [...priorityVideos, ...otherVideos]
  
  // Fetch OMDb data for visual appeal
  const showTitles = orderedVideos.map(v => v.title);

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

  // Helper to create video objects with fallback, using our video data
  const createVideo = (video: typeof orderedVideos[0], index: number): Video => {
    const omdbData = showsMap.get(video.title);
    // Use video data from our store as fallback
    const defaultData = {
      Poster: video.thumbnail,
      Rated: video.rating || "TV-MA",
      Year: video.year || "2000",
      Genre: video.genre || "Comedy"
    };
    
    const poster = omdbData?.Poster && omdbData.Poster !== "N/A" ? omdbData.Poster : defaultData.Poster;
    
    return {
      id: video.id,
      title: (omdbData?.Title || video.title).toUpperCase(),
      thumbnailUrl: poster,
      rating: omdbData?.Rated || defaultData.Rated,
      year: (omdbData?.Year || defaultData.Year).split("–")[0],
      genre: (omdbData?.Genre || defaultData.Genre).split(", ").slice(0, 2),
      studio: "TV Network", // OMDb doesn't provide consistent network info
      isNew: index < 2 // First 2 get "New" badge
    };
  };

  // Generate Recommended List from ordered videos
  orderedVideos.forEach((video, index) => {
    movies.push(createVideo(video, index));
  });

  // Generate Continue Watching List with specific episodes
  // Use the ordered videos: Suits (id: 1), SpongeBob (id: 2), Friends (id: 3)
  const suitsVideo = orderedVideos.find(v => v.id === "1")
  const spongebobVideo = orderedVideos.find(v => v.id === "2")
  const friendsVideo = orderedVideos.find(v => v.id === "3")
  
  if (suitsVideo) {
    const omdbData = showsMap.get(suitsVideo.title)
    continueWatchingItems.push({
      id: "1",
      title: "Suits: Pilot",
      thumbnailUrl: omdbData?.Poster && omdbData.Poster !== "N/A" ? omdbData.Poster : suitsVideo.thumbnail,
      timeRemaining: "25m remaining",
      rating: suitsVideo.rating || "TV-14",
      episode: "S1:E1"
    });
  }
  
  if (spongebobVideo) {
    const omdbData = showsMap.get(spongebobVideo.title)
    continueWatchingItems.push({
      id: "2",
      title: "SpongeBob: Pilot",
      thumbnailUrl: omdbData?.Poster && omdbData.Poster !== "N/A" ? omdbData.Poster : spongebobVideo.thumbnail,
      timeRemaining: "8m remaining",
      rating: spongebobVideo.rating || "TV-Y",
      episode: "S1:E1"
    });
  }

  if (friendsVideo) {
    const omdbData = showsMap.get(friendsVideo.title)
    continueWatchingItems.push({
      id: "3",
      title: "Friends: Pilot",
      thumbnailUrl: omdbData?.Poster && omdbData.Poster !== "N/A" ? omdbData.Poster : friendsVideo.thumbnail,
      timeRemaining: "15m remaining",
      rating: friendsVideo.rating || "TV-14",
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
