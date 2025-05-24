const express = require("express");
const axios = require("axios");
const router = express.Router();
const { Pool } = require("pg");
const config = require("../../constants/config.json");
const BASE_URL = config.BASE_URL;
const GOOGLE_MAPS_APIKEY = config.GOOGLE_MAPS_API_KEY;
const USE_CACHE = config.USE_CACHE; // Use this to toggle caching behavior

const pool = new Pool({
  user: "pradeepkumar.jp",
  host: "localhost",
  database: "travel_guide",
  port: 5432,
});

// --- Helper functions (getWikiSummaryByTitle, getWikiNearbyTitle, fetchAllPlaces) remain the same ---
// ... (paste previous helper functions here) ...
const getWikiSummaryByTitle = async (title) => {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await axios.get(url);
    return {
      title,
      description: res?.data?.extract || "",
      image: res?.data?.thumbnail?.source || null,
    };
  } catch {
    return null;
  }
};

const getWikiNearbyTitle = async (lat, lng) => {
  try {
    const geoURL = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lng}&gsradius=1000&gslimit=5&format=json&origin=*`;
    const geoRes = await axios.get(geoURL);
    return geoRes?.data?.query?.geosearch?.[0]?.title || null;
  } catch {
    return null;
  }
};

const fetchAllPlaces = async (cityName) => {
  let allPlaces = [];
  let url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=places+to+visit+in+${encodeURIComponent(cityName)}&key=${GOOGLE_MAPS_APIKEY}`;

  for (let i = 0; i < 3; i++) {
    // Limit to 3 pages (approx 60 results)
    try {
      console.log(`Fetching page ${i + 1}: ${url.split("&key=")[0]}...`); // Log URL without key
      const res = await axios.get(url);
      const data = res.data;

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.warn(`Google Text Search API Error: ${data.status} - ${data.error_message || "Unknown error"}`);
        break; // Stop fetching if there's an error
      }

      if (data.results) {
        allPlaces.push(...data.results);
      }

      if (data.next_page_token) {
        // Important: Google requires a short delay before using next_page_token
        await new Promise((resolve) => setTimeout(resolve, 2000));
        url = `https://maps.googleapis.com/maps/api/place/textsearch/json?pagetoken=${data.next_page_token}&key=${GOOGLE_MAPS_APIKEY}`;
      } else {
        break; // No more pages
      }
    } catch (fetchErr) {
      console.error("Error fetching page from Google Text Search:", fetchErr.message);
      break; // Stop fetching on network or other errors
    }
  }
  console.log(`Total places fetched from Google: ${allPlaces.length}`);
  return allPlaces;
};

router.post("/buildExploreDestinationResult", async (req, res) => {
  const { cityName, placeId } = req.body; // placeId = parent city ID
  console.log("▶️ API Hit: /buildExploreDestinationResult");
  console.log("📍 City Name:", cityName, "| placeId:", placeId);

  if (!placeId || !cityName) {
    return res.status(400).json({ error: "Missing cityName or placeId" });
  }

  try {
    let resultsToSend = []; // Variable to hold the final sorted results

    // --- Caching Logic ---
    if (`${USE_CACHE}`) {
      const parent = await pool.query('SELECT 1 FROM "ExploreDestinationPlaces" WHERE place_id = $1 LIMIT 1', [placeId]);

      // ** MODIFIED QUERY with WHERE clause and ORDER BY for priority **
      const childrenQuery = `
        SELECT
          place_place_id AS place_id, -- Alias DB PK to match frontend expected key for spot ID
          place_name,
          description,
          ratings,
          type,
          total_user_rating,
          ph_number,
          website,
          photo_url
          -- Select other columns needed by the frontend list card or details page
        FROM "ExploreDestinationPlacesDetails"
        WHERE
          place_id = $1                      -- Filter by Parent City ID (FK)
          AND NOT (type @> ARRAY['travel_agency'])
        ORDER BY
          total_user_rating DESC NULLS LAST,
          ratings DESC NULLS LAST,
          CASE WHEN ph_number IS NOT NULL AND ph_number <> '' THEN 0 ELSE 1 END ASC,
          CASE WHEN website IS NOT NULL AND website <> '' THEN 0 ELSE 1 END ASC

      `;
      const children = await pool.query(childrenQuery, [placeId]);

      if (parent.rows.length > 0 && children.rows.length > 0) {
        // console.log(`⚡️ Cache hit. Found ${children.rows.length} sorted saved places. Returning.`);
        resultsToSend = children.rows; // Use the sorted results from the DB
        console.log(`📤 Sending ${resultsToSend.length} cached, sorted places to frontend.`);
        return res.json({ data: resultsToSend }); // Return cached, sorted data
      } else {
        console.log(`🔁 Cache miss or partial data. Parent found: ${parent.rows.length > 0}, Children found: ${children.rows.length}. Re-fetching from APIs.`);
      }
    }

    // --- Fetching & Enrichment Logic (if cache miss) ---
    // Insert parent place first (if not already present)
    await pool.query('INSERT INTO "ExploreDestinationPlaces" (place_id, place_name) VALUES ($1, $2) ON CONFLICT (place_id) DO NOTHING', [placeId, cityName]);

    const places = await fetchAllPlaces(cityName); // Fetches up to ~60 places
    console.log(`✅ Retrieved ${places.length} raw places from Google APIs`);

    const enrichedResults = await Promise.all(
      places.map(async (place) => {
        // --- Skip processing if essential data is missing ---
        if (!place || !place.place_id || !place.name || !place.geometry?.location) {
          console.warn("⚠️ Skipping place due to missing essential info:", place?.name || "Unknown");
          return null;
        }
        // --- End skip ---

        // Check if type contains 'travel_agency' early to potentially skip API calls
        if (place.types?.includes("travel_agency")) {
          console.log(`ℹ️ Skipping travel agency: ${place.name}`);
          return null; // Skip based on Priority 5
        }

        try {
          const subPlaceId = place.place_id; // Tourist spot ID
          const name = place.name;
          const lat = place.geometry.location.lat;
          const lng = place.geometry.location.lng;

          // Fetch details (consider adding fields needed for sorting like rating, user_ratings_total, types, formatted_phone_number, website)
          // const detailsFields = "formatted_address,business_status,rating,user_ratings_total,type,opening_hours/weekday_text,formatted_phone_number,website,photo,name";
          const detailsFields = "formatted_address,business_status,rating,user_ratings_total,type,opening_hours/weekday_text,formatted_phone_number,website,photos,name";
          const detailsURL = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${subPlaceId}&fields=${detailsFields}&key=${GOOGLE_MAPS_APIKEY}`;
          const detailsRes = await axios.get(detailsURL);

          // Handle potential errors from details API
          if (detailsRes.data.status !== "OK") {
            console.warn(`⚠️ Google Details API Error for ${name} (${subPlaceId}): ${detailsRes.data.status} - ${detailsRes.data.error_message || "No details"}`);
            // Decide how to handle: return partial data or skip? Let's try partial.
            // return null; // Option: skip entirely
          }
          const details = detailsRes.data.result || {}; // Use empty object if no result

          // Skip again if it's a travel agency based on detailed types
          if (details.types?.includes("travel_agency")) {
            console.log(`ℹ️ Skipping travel agency based on details: ${name}`);
            return null; // Skip based on Priority 5
          }

          // const photoRef = details.photos?.[0]?.photo_reference;
          const photoRef = details.photos?.[0]?.photo_reference || place.photos?.[0]?.photo_reference; // Use either from details or place object
          const googlePhotoUrl = photoRef ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=1024&photoreference=${photoRef}&key=${GOOGLE_MAPS_APIKEY}` : null;

          // Wikipedia Fetching (keep as is)
          let wikiTitle = null;
          try {
            const searchURL = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(name)}&format=json&origin=*`;
            const searchRes = await axios.get(searchURL);
            wikiTitle = searchRes?.data?.query?.search?.[0]?.title;
          } catch {}

          if (!wikiTitle) {
            wikiTitle = await getWikiNearbyTitle(lat, lng);
          }

          const wikiData = wikiTitle ? await getWikiSummaryByTitle(wikiTitle) : null;
          const finalPhotoUrl = googlePhotoUrl || wikiData?.image || "";
          const description = wikiData?.description || "";

          // Prepare data for DB insertion
          const dbData = {
            parentPlaceId: placeId, // FK reference to city
            subPlaceId: subPlaceId, // actual tourist spot ID (PK)
            name: name,
            description: description,
            address: details.formatted_address || "",
            business_status: details.business_status || "",
            rating: details.rating || null,
            types: details.types || [],
            total_user_rating: details.user_ratings_total || 0,
            timing: details.opening_hours?.weekday_text || [],
            ph_number: details.formatted_phone_number || "",
            website: details.website || "",
            photo_url: finalPhotoUrl,
          };

          // Insert into DB
          await pool.query(
            `INSERT INTO "ExploreDestinationPlacesDetails" (
              place_place_id, place_id, place_name, description, address,
              business_status, ratings, type, total_user_rating, timing,
              ph_number, website, photo_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            ON CONFLICT (place_place_id) DO NOTHING`, // Conflict on tourist spot ID (PK)
            [
              dbData.subPlaceId,
              dbData.parentPlaceId,
              dbData.name,
              dbData.description,
              dbData.address,
              dbData.business_status,
              dbData.rating,
              dbData.types,
              dbData.total_user_rating,
              dbData.timing,
              dbData.ph_number,
              dbData.website,
              dbData.photo_url,
            ]
          );

          // Return data needed for frontend AND for sorting later
          return {
            place_id: dbData.subPlaceId, // Corresponds to place_place_id in DB
            place_name: dbData.name,
            description: dbData.description, // Return if needed by frontend
            address: dbData.address, // Return if needed by frontend
            ratings: dbData.rating,
            type: dbData.types,
            total_user_rating: dbData.total_user_rating,
            ph_number: dbData.ph_number,
            website: dbData.website,
            photo_url: dbData.photo_url,
          };
        } catch (err) {
          // Log specific error and place name if possible
          console.warn(`⚠️ Skipping place "${place?.name || "Unknown"}" due to processing error:`, err.message);
          return null; // Ensure failed places are filtered out
        }
      })
    );

    // Filter out nulls (skipped places) and apply sorting logic IN JAVASCRIPT
    // This ensures the data sent back after fetching is also sorted
    const cleanedResults = enrichedResults.filter((item) => item !== null); // Filter out nulls

    cleanedResults.sort((a, b) => {
      // Priority 5 (travel_agency) is already filtered out before this sort

      // Priority 1: total_user_rating (higher first)
      const ratingTotalDiff = (b.total_user_rating ?? -1) - (a.total_user_rating ?? -1); // Treat null as -1 (lowest)
      if (ratingTotalDiff !== 0) return ratingTotalDiff;

      // Priority 2: ratings (higher first)
      const ratingDiff = (b.ratings ?? -1) - (a.ratings ?? -1); // Treat null as -1 (lowest)
      if (ratingDiff !== 0) return ratingDiff;

      // Priority 3: has ph_number (yes first)
      const phoneA = a.ph_number && a.ph_number !== "" ? 0 : 1;
      const phoneB = b.ph_number && b.ph_number !== "" ? 0 : 1;
      if (phoneA !== phoneB) return phoneA - phoneB; // 0 - 1 = -1 (A first), 1 - 0 = 1 (B first)

      // Priority 4: has website (yes first)
      const websiteA = a.website && a.website !== "" ? 0 : 1;
      const websiteB = b.website && b.website !== "" ? 0 : 1;
      if (websiteA !== websiteB) return websiteA - websiteB;

      return 0; // Keep original order if all priorities are equal
    });

    resultsToSend = cleanedResults; // Use the newly fetched & sorted results

    console.log(`📤 Sending ${resultsToSend.length} sorted, enriched places to frontend.`);
    res.json({ data: resultsToSend });
  } catch (err) {
    console.error("❌ Error in buildExploreDestinationResult:", err.message, err.stack); // Log stack trace
    res.status(500).json({ error: "Failed to build destination result" });
  }
});

// Add this route handler to your existing Express router file (e.g., the one containing /buildExploreDestinationResult)

router.get("/getPlaceDetails/:placeDetailId", async (req, res) => {
  const { placeDetailId } = req.params; // Get ID from URL parameter
  console.log(`▶️ API Hit: /getPlaceDetails/${placeDetailId}`);

  if (!placeDetailId) {
    return res.status(400).json({ error: "Missing placeDetailId parameter" });
  }

  try {
    const query = `
      SELECT *
      FROM "ExploreDestinationPlacesDetails"
      WHERE place_place_id = $1 -- Query by the Primary Key (tourist spot ID)
    `;
    const result = await pool.query(query, [placeDetailId]);

    if (result.rows.length === 0) {
      console.log(`⚠️ Place details not found for ID: ${placeDetailId}`);
      return res.status(404).json({ error: "Place details not found" });
    }

    console.log(`✅ Found details for ${result.rows[0].place_name}`);
    res.json({ data: result.rows[0] }); // Return the single row found
  } catch (err) {
    console.error(`❌ Error fetching place details for ID ${placeDetailId}:`, err.message);
    res.status(500).json({ error: "Failed to fetch place details" });
  }
});

module.exports = router;
