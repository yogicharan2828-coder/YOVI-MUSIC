const API_BASE_URL =
  "http://127.0.0.1:8000";


// ============================================================
// GET DEVICE EXPLORE
// ============================================================

export async function getDeviceExplore(
  deviceId
) {

  if (!deviceId) {

    return null;

  }


  try {

    const response =
      await fetch(
        `${API_BASE_URL}/explore/device/${encodeURIComponent(
          deviceId
        )}`
      );


    if (!response.ok) {

      const errorText =
        await response.text()
          .catch(
            () => ""
          );


      console.warn(
        "YOVI Explore request failed:",
        response.status,
        errorText
      );


      return null;

    }


    return await response.json();

  } catch (error) {

    console.warn(
      "YOVI Explore failed:",
      error
    );


    return null;

  }

}