// UMaT Tarkwa - Programs of Study
export const UMaTPrograms = [
  // Faculty of Engineering
  { code: 'EEE', name: 'Electrical & Electronic Engineering', faculty: 'Faculty of Engineering' },
  { code: 'ME', name: 'Mechanical Engineering', faculty: 'Faculty of Engineering' },
  { code: 'REE', name: 'Renewable Energy Engineering', faculty: 'Faculty of Engineering' },

  // Faculty of Mineral Resources Technology
  { code: 'MNE', name: 'Mining Engineering', faculty: 'Faculty of Mineral Resources Technology' },
  { code: 'MIE', name: 'Mineral Engineering', faculty: 'Faculty of Mineral Resources Technology' },

  // School of Petroleum Studies (GNPC)
  { code: 'PE', name: 'Petroleum Engineering', faculty: 'School of Petroleum Studies' },
  { code: 'PGE', name: 'Petroleum Geosciences & Engineering', faculty: 'School of Petroleum Studies' },
  { code: 'CPE', name: 'Chemical & Petrochemical Engineering', faculty: 'School of Petroleum Studies' },

  // Faculty of Geosciences & Environmental Studies
  { code: 'ESE', name: 'Environmental & Safety Engineering', faculty: 'Faculty of Geosciences & Environmental Studies' },
  { code: 'GEO', name: 'Geomatic Engineering', faculty: 'Faculty of Geosciences & Environmental Studies' },
  { code: 'GLE', name: 'Geological Engineering', faculty: 'Faculty of Geosciences & Environmental Studies' },

  // Faculty of Computing & Mathematical Sciences
  { code: 'CSE', name: 'Computer Science & Engineering', faculty: 'Faculty of Computing & Mathematical Sciences' },
  { code: 'MA', name: 'Mathematics', faculty: 'Faculty of Computing & Mathematical Sciences' },

  // Faculty of Integrated Management Science
  { code: 'TC', name: 'Technical Communication', faculty: 'Faculty of Integrated Management Science' },
  { code: 'MS', name: 'Management Studies', faculty: 'Faculty of Integrated Management Science' },
];

export const AcademicLevels = [
  '100', '200', '300', '400',
  '500', '600', '700',
  'Postgraduate Diploma', "Master's", 'PhD',
];

export const UMaTHalls = [
  // On-campus halls
  { name: 'KT Hall', type: 'on-campus' },
  { name: 'Chambers of Mines Hall', type: 'on-campus' },
  { name: 'Gold Refinery Hall', type: 'on-campus' },

  // Campus hostels
  { name: 'CK Hostel', type: 'hostel' },
  { name: 'Corazon Hostel', type: 'hostel' },
  { name: 'Tovet Hostel', type: 'hostel' },
  { name: 'Hilda Hostel', type: 'hostel' },
  { name: 'Figenco Hostel', type: 'hostel' },
  { name: "Kabi's Hostel", type: 'hostel' },
  { name: 'Castle Gate Hostel', type: 'hostel' },
  { name: 'The White House Hostel', type: 'hostel' },
  { name: 'Platinum Hostel', type: 'hostel' },
  { name: 'RNM Hostel', type: 'hostel' },
  { name: 'Nhiraba Hostel', type: 'hostel' },
  { name: 'Osborne Hostel', type: 'hostel' },

  // Off-campus
  { name: 'Off-Campus', type: 'off-campus' },
];

// UMaT Tarkwa Campus verified pickup spots (accurate coordinates for Main & Akoon Campuses)
export const PickupSpots = [
  // Central Campus (Main Campus - Bogoso Road)
  { name: 'Main Library Entrance', area: 'Central Campus', description: 'Front of the main university library', lat: 5.2965, lng: -2.0011, isActive: true, isManual: false },
  { name: 'Administration Block', area: 'Central Campus', description: 'Main admin building entrance', lat: 5.2971, lng: -2.0018, isActive: true, isManual: false },
  { name: 'IT Centre', area: 'Central Campus', description: 'ICT centre near the library complex', lat: 5.2966, lng: -2.0008, isActive: true, isManual: false },
  { name: "Students' Centre", area: 'Central Campus', description: 'Student centre building', lat: 5.2960, lng: -2.0005, isActive: true, isManual: false },
  { name: 'Cafeteria', area: 'Central Campus', description: 'Main campus cafeteria area', lat: 5.2958, lng: -2.0008, isActive: true, isManual: false },
  { name: 'Main Auditorium', area: 'Central Campus', description: 'Main university auditorium entrance', lat: 5.2968, lng: -2.0014, isActive: true, isManual: false },
  { name: 'Mini Auditorium', area: 'Central Campus', description: 'Mini auditorium entrance', lat: 5.2970, lng: -2.0011, isActive: true, isManual: false },

  // Academic Blocks (Main Campus - Bogoso Road)
  { name: 'Engineering Block Entrance', area: 'Academic', description: 'Main entrance to the Engineering faculty block', lat: 5.2978, lng: -1.9995, isActive: true, isManual: false },
  { name: 'Petroleum Studies Block', area: 'Academic', description: 'GNPC School of Petroleum Studies building', lat: 5.2990, lng: -1.9985, isActive: true, isManual: false },
  { name: 'Geosciences Block Entrance', area: 'Academic', description: 'Geosciences & Environmental Studies block', lat: 5.2982, lng: -2.0020, isActive: true, isManual: false },
  { name: 'Computing & Maths Block', area: 'Academic', description: 'Faculty of Computing & Mathematical Sciences', lat: 5.2974, lng: -2.0002, isActive: true, isManual: false },
  { name: 'Management Science Block', area: 'Academic', description: 'Faculty of Integrated Management Science', lat: 5.2962, lng: -2.0015, isActive: true, isManual: false },

  // On-Campus Halls
  { name: 'KT Hall Entrance', area: 'KT Hall', description: 'Entrance of KT Hall (Main Campus)', lat: 5.30616, lng: -1.99668, isActive: true, isManual: false },
  { name: 'Chambers of Mines Hall Entrance', area: 'Chambers of Mines Hall', description: 'Entrance of Chambers of Mines Hall (Main Campus)', lat: 5.29944, lng: -2.00306, isActive: true, isManual: false },
  { name: 'Gold Refinery Hall Entrance', area: 'Gold Refinery Hall', description: 'Entrance of Gold Refinery Hall (Akoon Campus)', lat: 5.31917, lng: -1.98583, isActive: true, isManual: false },

  // Hostels (Main student housing corridors around Main Campus & Akyempim)
  { name: 'CK Hostel Entrance', area: 'Hostels', description: 'Entrance of CK Hostel', lat: 5.2968, lng: -1.9945, isActive: true, isManual: false },
  { name: 'Corazon Hostel Entrance', area: 'Hostels', description: 'Entrance of Corazon Hostel', lat: 5.2982, lng: -1.9930, isActive: true, isManual: false },
  { name: 'Tovet Hostel Entrance', area: 'Hostels', description: 'Entrance of Tovet Hostel', lat: 5.3015, lng: -1.9940, isActive: true, isManual: false },
  { name: 'Hilda Hostel Entrance', area: 'Hostels', description: 'Entrance of Hilda Hostel', lat: 5.3110, lng: -1.9920, isActive: true, isManual: false },
  { name: 'Figenco Hostel Entrance', area: 'Hostels', description: 'Entrance of Figenco Hostel', lat: 5.2995, lng: -1.9915, isActive: true, isManual: false },
  { name: "Kabi's Hostel Entrance", area: 'Hostels', description: "Entrance of Kabi's Hostel", lat: 5.2975, lng: -1.9928, isActive: true, isManual: false },
  { name: 'Castle Gate Hostel Entrance', area: 'Hostels', description: 'Entrance of Castle Gate Hostel', lat: 5.3025, lng: -1.9950, isActive: true, isManual: false },
  { name: 'The White House Hostel Entrance', area: 'Hostels', description: 'Entrance of The White House Hostel', lat: 5.2990, lng: -1.9938, isActive: true, isManual: false },
  { name: 'Platinum Hostel Entrance', area: 'Hostels', description: 'Entrance of Platinum Hostel', lat: 5.3032, lng: -1.9955, isActive: true, isManual: false },
  { name: 'RNM Hostel Entrance', area: 'Hostels', description: 'Entrance of RNM Hostel', lat: 5.3050, lng: -1.9960, isActive: true, isManual: false },
  { name: 'Nhiraba Hostel Entrance', area: 'Hostels', description: 'Entrance of Nhiraba Hostel', lat: 5.3045, lng: -1.9952, isActive: true, isManual: false },
  { name: 'Osborne Hostel Entrance', area: 'Hostels', description: 'Entrance of Osborne Hostel', lat: 5.3055, lng: -1.9972, isActive: true, isManual: false },

  // Campus Gates
  { name: 'Main Gate (UMaT Entrance)', area: 'Campus Gates', description: 'Main entrance gate of UMaT on Bogoso Road', lat: 5.2952, lng: -2.0040, isActive: true, isManual: false },
  { name: 'Back Gate', area: 'Campus Gates', description: 'Back/side gate of UMaT campus', lat: 5.3015, lng: -1.9980, isActive: true, isManual: false },

  // Tarkwa Town
  { name: 'Fijai Junction', area: 'Tarkwa Town', description: 'Fijai junction near campus', lat: 5.3040, lng: -1.9910, isActive: true, isManual: false },
  { name: 'Akyempim Junction', area: 'Tarkwa Town', description: 'Akyempim junction landmark', lat: 5.3130, lng: -1.9970, isActive: true, isManual: false },
  { name: 'Tarkwa Market', area: 'Tarkwa Town', description: 'Tarkwa main market area', lat: 5.3012, lng: -1.9880, isActive: true, isManual: false },
  { name: 'Ghana Post - Tarkwa', area: 'Tarkwa Town', description: 'Ghana Post office in Tarkwa town', lat: 5.3005, lng: -1.9890, isActive: true, isManual: false },

  // Manual entry - always last
  { name: 'Other (specify below)', area: 'Custom', description: 'Enter a custom pickup location manually', isActive: true, isManual: true },
];