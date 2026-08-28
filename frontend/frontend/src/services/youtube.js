import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000";

export async function findYouTubeSong(
  title,
  artist
) {
  const response = await axios.get(
    `${API_BASE_URL}/youtube/search`,
    {
      params: {
        q: `${title} ${artist}`,
        limit: 5,
      },
    }
  );

  return response.data;
}