const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export const hasGoogleKey = Boolean(API_KEY);

let loading;

function loadMapsScript() {
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  if (loading) return loading;
  loading = new Promise((resolve, reject) => {
    const callback = "__geonegocioMapsReady";
    window[callback] = () => {
      delete window[callback];
      resolve();
    };
    const params = new URLSearchParams({
      key: API_KEY,
      v: "weekly",
      language: "es",
      region: "MX",
      loading: "async",
      callback,
    });
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.onerror = () => {
      loading = null;
      reject(new Error("No se pudo cargar Google Maps"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

const FIELDS = [
  "id",
  "displayName",
  "location",
  "rating",
  "userRatingCount",
  "reviews",
  "priceLevel",
  "formattedAddress",
  "primaryTypeDisplayName",
  "businessStatus",
];

/**
 * Busca negocios parecidos al concepto alrededor de un punto con Places API (New).
 * Devuelve objetos normalizados con sus reseñas.
 */
export async function searchPlacesByConcept(concept, [lat, lng], radiusM) {
  await loadMapsScript();
  const { Place } = await window.google.maps.importLibrary("places");
  const { places } = await Place.searchByText({
    textQuery: concept,
    fields: FIELDS,
    locationBias: { center: { lat, lng }, radius: Math.min(radiusM, 50000) },
    maxResultCount: 20,
    language: "es",
    region: "mx",
  });

  return (places || []).map((p) => ({
    id: p.id,
    googleId: p.id,
    source: "google",
    name: p.displayName,
    lat: p.location.lat(),
    lng: p.location.lng(),
    rating: p.rating ?? null,
    ratingCount: p.userRatingCount ?? 0,
    priceLevel: p.priceLevel ?? null,
    address: p.formattedAddress ?? "",
    type: p.primaryTypeDisplayName ?? "",
    closed: p.businessStatus === "CLOSED_PERMANENTLY",
    reviews: (p.reviews || []).map((r) => ({
      text: typeof r.text === "string" ? r.text : r.text?.text ?? "",
      rating: r.rating ?? null,
      when: r.relativePublishTimeDescription ?? "",
    })),
  }));
}

const DETAIL_FIELDS = [
  "displayName",
  "formattedAddress",
  "googleMapsURI",
  "photos",
  "rating",
  "userRatingCount",
  "regularOpeningHours",
  "utcOffsetMinutes",
  "nationalPhoneNumber",
  "websiteURI",
  "editorialSummary",
  "primaryTypeDisplayName",
  "reviews",
];

/**
 * Ficha de Google de un negocio: por su id o, si viene de OSM, buscándolo por nombre cerca de su ubicación.
 * Devuelve null si Google no lo tiene.
 */
export async function fetchPlaceDetails(b) {
  await loadMapsScript();
  const { Place } = await window.google.maps.importLibrary("places");
  let place;
  if (b.googleId) {
    place = new Place({ id: b.googleId, requestedLanguage: "es" });
  } else {
    const { places } = await Place.searchByText({
      textQuery: b.name,
      fields: ["id"],
      locationBias: { center: { lat: b.lat, lng: b.lng }, radius: 150 },
      maxResultCount: 1,
      language: "es",
      region: "mx",
    });
    if (!places?.length) return null;
    place = places[0];
  }
  await place.fetchFields({ fields: DETAIL_FIELDS });

  let openNow = null;
  try {
    openNow = place.regularOpeningHours ? await place.isOpen() : null;
  } catch {
    openNow = null;
  }
  return {
    googleId: place.id,
    name: place.displayName,
    type: place.primaryTypeDisplayName ?? "",
    address: place.formattedAddress ?? "",
    rating: place.rating ?? null,
    ratingCount: place.userRatingCount ?? 0,
    summary: place.editorialSummary ?? "",
    phone: place.nationalPhoneNumber ?? "",
    website: place.websiteURI ?? "",
    mapsUrl: place.googleMapsURI ?? "",
    openNow,
    hours: place.regularOpeningHours?.weekdayDescriptions ?? [],
    photos: (place.photos || []).slice(0, 6).map((ph) => ({
      url: ph.getURI({ maxWidth: 800 }),
      author: ph.authorAttributions?.[0]?.displayName ?? "",
      authorUri: ph.authorAttributions?.[0]?.uri ?? "",
    })),
    reviews: (place.reviews || []).slice(0, 3).map((r) => ({
      text: typeof r.text === "string" ? r.text : r.text?.text ?? "",
      rating: r.rating ?? null,
      when: r.relativePublishTimeDescription ?? "",
      author: r.authorAttribution?.displayName ?? "",
    })),
  };
}
