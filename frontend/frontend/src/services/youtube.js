import axios from "axios";

import API_BASE_URL from "../config/api";


export async function findYouTubeSong(
  title,
  artist
) {

  const response =
    await axios.get(
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