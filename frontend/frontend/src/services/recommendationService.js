const API_BASE_URL =
  "http://127.0.0.1:8000";


// ============================================================
// GET DEVICE RECOMMENDATIONS
// ============================================================

export async function getDeviceRecommendations(
  deviceId,
  limit = 20
) {

  if (!deviceId) {

    return {
      mode: "discovery",
      profile: null,
      count: 0,
      results: [],
    };

  }


  try {

    const response =
      await fetch(
        `${API_BASE_URL}/recommendations/device/${encodeURIComponent(
          deviceId
        )}?limit=${limit}`
      );


    if (!response.ok) {

      const errorText =
        await response.text()
          .catch(
            () => ""
          );


      console.warn(
        "YOVI recommendations request failed:",
        response.status,
        errorText
      );


      return {
        mode: "discovery",
        profile: null,
        count: 0,
        results: [],
      };

    }


    return await response.json();

  } catch (error) {

    /*
     * Recommendation failure must NEVER
     * affect music playback.
     */

    console.warn(
      "YOVI recommendations failed:",
      error
    );


    return {
      mode: "discovery",
      profile: null,
      count: 0,
      results: [],
    };

  }

}