/**
 * Curated high-resolution optical care and clinical photography
 * Sourced from verified royalty-free Unsplash collections for modern medical UI.
 */
export const CLINIC_PHOTOS = {
  hero: "https://images.unsplash.com/photo-1591076482161-42ce6da69f67?auto=format&fit=crop&w=1200&q=80", // Modern optical gallery & clinic interior
  clinicExam: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80", // Advanced phoropter vision diagnostic station
  consultation: "https://images.unsplash.com/photo-1574258495973-f010dfbb5371?auto=format&fit=crop&w=800&q=80", // Patient and optometrist eyewear consultation
  refraction: "https://images.unsplash.com/photo-1508296695146-257a814070b4?auto=format&fit=crop&w=800&q=80", // Optical acuity assessment & trial lenses
  eyewear: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80", // Precision crafted spectacles & frame fitting
  contactLens: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=800&q=80", // Contact lens care & examination
  doctorElena: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=800&q=80", // Dr. Elena Reyes, OD
  doctorMarcus: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=800&q=80", // Dr. Marcus Tan, MD
  defaultDoctor: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=800&q=80", // Staff clinician
};

export function getServicePhoto(nameOrSlug?: string): string {
  const s = (nameOrSlug || "").toLowerCase();
  if (s.includes("comprehensive") || s.includes("exam") || s.includes("pediatric")) {
    return CLINIC_PHOTOS.clinicExam;
  }
  if (s.includes("refraction") || s.includes("testing") || s.includes("acuity")) {
    return CLINIC_PHOTOS.refraction;
  }
  if (s.includes("contact") || s.includes("lens")) {
    return CLINIC_PHOTOS.contactLens;
  }
  if (s.includes("eyewear") || s.includes("frame") || s.includes("fitting")) {
    return CLINIC_PHOTOS.eyewear;
  }
  if (s.includes("consultation") || s.includes("optometry")) {
    return CLINIC_PHOTOS.consultation;
  }
  return CLINIC_PHOTOS.hero;
}

export function getDoctorPhoto(nameOrSlug?: string): string {
  const s = (nameOrSlug || "").toLowerCase();
  if (s.includes("reyes") || s.includes("elena") || s.includes("santos")) {
    return CLINIC_PHOTOS.doctorElena;
  }
  if (s.includes("tan") || s.includes("marcus") || s.includes("cruz")) {
    return CLINIC_PHOTOS.doctorMarcus;
  }
  return CLINIC_PHOTOS.defaultDoctor;
}
