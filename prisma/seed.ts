import "dotenv/config";
import { PrismaClient, CollegeType, CutoffCategory } from "@prisma/client";

const prisma = new PrismaClient();

type CollegeSeed = {
  id: number;
  name: string;
  city: string;
  state: string;
  type: CollegeType;
  streams: string[];
  nirf_rank: number | null;
  established: number;
  accreditation: string;
  website: string;
  fees: {
    course: string;
    degree: string;
    annual_fee: number;
  }[];
  placements: {
    year: number;
    avg_pkg: number;
    max_pkg: number;
    placement_pct: number;
    top_recruiters: string[];
  }[];
  cutoffExam: string;
  cutoffBase: Record<2023 | 2024, number>;
};

const categoryMultiplier: Record<CutoffCategory, number> = {
  GENERAL: 1,
  OBC: 1.35,
  SC: 2.8,
  ST: 4.2,
};

const colleges: CollegeSeed[] = [
  {
    id: 1,
    name: "IIT Bombay",
    city: "Mumbai",
    state: "Maharashtra",
    type: CollegeType.GOVT,
    streams: ["Engineering", "Science", "Design", "Management"],
    nirf_rank: 3,
    established: 1958,
    accreditation: "Institute of National Importance",
    website: "https://www.iitb.ac.in",
    fees: [
      { course: "Computer Science and Engineering", degree: "B.Tech", annual_fee: 229300 },
      { course: "Electrical Engineering", degree: "B.Tech", annual_fee: 229300 },
      { course: "Mechanical Engineering", degree: "B.Tech", annual_fee: 229300 },
    ],
    placements: [
      { year: 2022, avg_pkg: 23.5, max_pkg: 180, placement_pct: 89, top_recruiters: ["Google", "Microsoft", "Apple", "Goldman Sachs"] },
      { year: 2023, avg_pkg: 25.8, max_pkg: 367, placement_pct: 91, top_recruiters: ["Google", "Microsoft", "Jane Street", "BCG"] },
      { year: 2024, avg_pkg: 28.0, max_pkg: 200, placement_pct: 90, top_recruiters: ["Google", "Microsoft", "TCS", "Samsung"] },
    ],
    cutoffExam: "JEE Advanced",
    cutoffBase: { 2023: 67, 2024: 68 },
  },
  {
    id: 2,
    name: "IIT Delhi",
    city: "New Delhi",
    state: "Delhi",
    type: CollegeType.GOVT,
    streams: ["Engineering", "Science", "Design", "Management"],
    nirf_rank: 2,
    established: 1961,
    accreditation: "Institute of National Importance",
    website: "https://home.iitd.ac.in",
    fees: [
      { course: "Computer Science and Engineering", degree: "B.Tech", annual_fee: 235700 },
      { course: "Mathematics and Computing", degree: "B.Tech", annual_fee: 235700 },
      { course: "Electrical Engineering", degree: "B.Tech", annual_fee: 235700 },
    ],
    placements: [
      { year: 2022, avg_pkg: 21.9, max_pkg: 200, placement_pct: 88, top_recruiters: ["Microsoft", "Google", "Airbnb", "McKinsey"] },
      { year: 2023, avg_pkg: 24.1, max_pkg: 250, placement_pct: 90, top_recruiters: ["Microsoft", "Google", "Goldman Sachs", "Uber"] },
      { year: 2024, avg_pkg: 26.5, max_pkg: 200, placement_pct: 89, top_recruiters: ["Microsoft", "Google", "Qualcomm", "Bain"] },
    ],
    cutoffExam: "JEE Advanced",
    cutoffBase: { 2023: 115, 2024: 116 },
  },
  {
    id: 3,
    name: "IIT Madras",
    city: "Chennai",
    state: "Tamil Nadu",
    type: CollegeType.GOVT,
    streams: ["Engineering", "Science", "Data Science", "Management"],
    nirf_rank: 1,
    established: 1959,
    accreditation: "Institute of National Importance",
    website: "https://www.iitm.ac.in",
    fees: [
      { course: "Computer Science and Engineering", degree: "B.Tech", annual_fee: 225000 },
      { course: "Electrical Engineering", degree: "B.Tech", annual_fee: 225000 },
      { course: "Aerospace Engineering", degree: "B.Tech", annual_fee: 225000 },
    ],
    placements: [
      { year: 2022, avg_pkg: 20.6, max_pkg: 198, placement_pct: 86, top_recruiters: ["Google", "Microsoft", "Texas Instruments", "Amazon"] },
      { year: 2023, avg_pkg: 22.8, max_pkg: 198, placement_pct: 88, top_recruiters: ["Google", "Microsoft", "Qualcomm", "EY"] },
      { year: 2024, avg_pkg: 24.7, max_pkg: 180, placement_pct: 87, top_recruiters: ["Google", "Microsoft", "Intel", "Wells Fargo"] },
    ],
    cutoffExam: "JEE Advanced",
    cutoffBase: { 2023: 144, 2024: 159 },
  },
  {
    id: 4,
    name: "IIT Kharagpur",
    city: "Kharagpur",
    state: "West Bengal",
    type: CollegeType.GOVT,
    streams: ["Engineering", "Architecture", "Law", "Management"],
    nirf_rank: 5,
    established: 1951,
    accreditation: "Institute of National Importance",
    website: "https://www.iitkgp.ac.in",
    fees: [
      { course: "Computer Science and Engineering", degree: "B.Tech", annual_fee: 224600 },
      { course: "Electronics and Electrical Communication", degree: "B.Tech", annual_fee: 224600 },
      { course: "Mechanical Engineering", degree: "B.Tech", annual_fee: 224600 },
    ],
    placements: [
      { year: 2022, avg_pkg: 19.2, max_pkg: 240, placement_pct: 85, top_recruiters: ["Google", "Microsoft", "EXL", "Capital One"] },
      { year: 2023, avg_pkg: 21.4, max_pkg: 260, placement_pct: 87, top_recruiters: ["Google", "Microsoft", "Amazon", "Flipkart"] },
      { year: 2024, avg_pkg: 22.1, max_pkg: 210, placement_pct: 86, top_recruiters: ["Google", "Microsoft", "Accenture", "Oracle"] },
    ],
    cutoffExam: "JEE Advanced",
    cutoffBase: { 2023: 261, 2024: 290 },
  },
  {
    id: 5,
    name: "NIT Trichy",
    city: "Tiruchirappalli",
    state: "Tamil Nadu",
    type: CollegeType.GOVT,
    streams: ["Engineering", "Architecture", "Management"],
    nirf_rank: 9,
    established: 1964,
    accreditation: "Institute of National Importance",
    website: "https://www.nitt.edu",
    fees: [
      { course: "Computer Science and Engineering", degree: "B.Tech", annual_fee: 178250 },
      { course: "Electronics and Communication Engineering", degree: "B.Tech", annual_fee: 178250 },
      { course: "Mechanical Engineering", degree: "B.Tech", annual_fee: 178250 },
    ],
    placements: [
      { year: 2022, avg_pkg: 12.8, max_pkg: 53, placement_pct: 92, top_recruiters: ["Amazon", "Microsoft", "Oracle", "Texas Instruments"] },
      { year: 2023, avg_pkg: 14.7, max_pkg: 52.9, placement_pct: 94, top_recruiters: ["Amazon", "Microsoft", "Goldman Sachs", "Walmart"] },
      { year: 2024, avg_pkg: 15.2, max_pkg: 52, placement_pct: 91, top_recruiters: ["Amazon", "Microsoft", "Cisco", "Qualcomm"] },
    ],
    cutoffExam: "JEE Main",
    cutoffBase: { 2023: 4661, 2024: 5150 },
  },
  {
    id: 6,
    name: "BITS Pilani",
    city: "Pilani",
    state: "Rajasthan",
    type: CollegeType.DEEMED,
    streams: ["Engineering", "Science", "Pharmacy", "Management"],
    nirf_rank: 20,
    established: 1964,
    accreditation: "NAAC A",
    website: "https://www.bits-pilani.ac.in",
    fees: [
      { course: "Computer Science", degree: "B.E.", annual_fee: 598000 },
      { course: "Electronics and Instrumentation", degree: "B.E.", annual_fee: 598000 },
      { course: "Mechanical Engineering", degree: "B.E.", annual_fee: 598000 },
    ],
    placements: [
      { year: 2022, avg_pkg: 18.2, max_pkg: 60.8, placement_pct: 93, top_recruiters: ["Google", "Microsoft", "Amazon", "Adobe"] },
      { year: 2023, avg_pkg: 20.8, max_pkg: 60.8, placement_pct: 94, top_recruiters: ["Google", "Microsoft", "Oracle", "Nvidia"] },
      { year: 2024, avg_pkg: 21.5, max_pkg: 65, placement_pct: 92, top_recruiters: ["Google", "Microsoft", "Amazon", "Flipkart"] },
    ],
    cutoffExam: "BITSAT",
    cutoffBase: { 2023: 331, 2024: 327 },
  },
  {
    id: 7,
    name: "VIT Vellore",
    city: "Vellore",
    state: "Tamil Nadu",
    type: CollegeType.DEEMED,
    streams: ["Engineering", "Science", "Management", "Design"],
    nirf_rank: 11,
    established: 1984,
    accreditation: "NAAC A++",
    website: "https://vit.ac.in",
    fees: [
      { course: "Computer Science and Engineering", degree: "B.Tech", annual_fee: 198000 },
      { course: "Electronics and Communication Engineering", degree: "B.Tech", annual_fee: 198000 },
      { course: "Mechanical Engineering", degree: "B.Tech", annual_fee: 176000 },
    ],
    placements: [
      { year: 2022, avg_pkg: 8.2, max_pkg: 75, placement_pct: 89, top_recruiters: ["Microsoft", "Amazon", "TCS", "Infosys"] },
      { year: 2023, avg_pkg: 9.2, max_pkg: 102, placement_pct: 91, top_recruiters: ["Microsoft", "Amazon", "Deloitte", "Cognizant"] },
      { year: 2024, avg_pkg: 9.9, max_pkg: 88, placement_pct: 90, top_recruiters: ["Microsoft", "Amazon", "PayPal", "Wipro"] },
    ],
    cutoffExam: "VITEEE",
    cutoffBase: { 2023: 8000, 2024: 9000 },
  },
  {
    id: 8,
    name: "Manipal Institute of Technology",
    city: "Manipal",
    state: "Karnataka",
    type: CollegeType.PRIVATE,
    streams: ["Engineering", "Computer Applications", "Science"],
    nirf_rank: 56,
    established: 1957,
    accreditation: "NAAC A++",
    website: "https://manipal.edu/mit.html",
    fees: [
      { course: "Computer Science and Engineering", degree: "B.Tech", annual_fee: 489000 },
      { course: "Information Technology", degree: "B.Tech", annual_fee: 489000 },
      { course: "Mechanical Engineering", degree: "B.Tech", annual_fee: 355000 },
    ],
    placements: [
      { year: 2022, avg_pkg: 8.4, max_pkg: 44, placement_pct: 83, top_recruiters: ["Microsoft", "Amazon", "Deloitte", "Dell"] },
      { year: 2023, avg_pkg: 10.5, max_pkg: 54.8, placement_pct: 86, top_recruiters: ["Microsoft", "Amazon", "Goldman Sachs", "Cisco"] },
      { year: 2024, avg_pkg: 10.9, max_pkg: 51, placement_pct: 84, top_recruiters: ["Microsoft", "Amazon", "Schneider Electric", "Accenture"] },
    ],
    cutoffExam: "MET",
    cutoffBase: { 2023: 1800, 2024: 2100 },
  },
  {
    id: 9,
    name: "DTU Delhi",
    city: "New Delhi",
    state: "Delhi",
    type: CollegeType.GOVT,
    streams: ["Engineering", "Design", "Management"],
    nirf_rank: 29,
    established: 1941,
    accreditation: "NAAC A",
    website: "https://dtu.ac.in",
    fees: [
      { course: "Computer Engineering", degree: "B.Tech", annual_fee: 236700 },
      { course: "Software Engineering", degree: "B.Tech", annual_fee: 236700 },
      { course: "Mechanical Engineering", degree: "B.Tech", annual_fee: 236700 },
    ],
    placements: [
      { year: 2022, avg_pkg: 12.2, max_pkg: 64.2, placement_pct: 86, top_recruiters: ["Microsoft", "Google", "Amazon", "Sprinklr"] },
      { year: 2023, avg_pkg: 15.3, max_pkg: 82.1, placement_pct: 88, top_recruiters: ["Microsoft", "Google", "Adobe", "Uber"] },
      { year: 2024, avg_pkg: 16.1, max_pkg: 64.2, placement_pct: 87, top_recruiters: ["Microsoft", "Google", "Amazon", "Samsung"] },
    ],
    cutoffExam: "JEE Main",
    cutoffBase: { 2023: 8000, 2024: 9200 },
  },
  {
    id: 10,
    name: "NSUT Delhi",
    city: "New Delhi",
    state: "Delhi",
    type: CollegeType.GOVT,
    streams: ["Engineering", "Management", "Design"],
    nirf_rank: 60,
    established: 1983,
    accreditation: "NAAC A",
    website: "https://www.nsut.ac.in",
    fees: [
      { course: "Computer Science and Engineering", degree: "B.Tech", annual_fee: 229000 },
      { course: "Information Technology", degree: "B.Tech", annual_fee: 229000 },
      { course: "Electronics and Communication Engineering", degree: "B.Tech", annual_fee: 229000 },
    ],
    placements: [
      { year: 2022, avg_pkg: 11.7, max_pkg: 55, placement_pct: 84, top_recruiters: ["Microsoft", "Google", "Amazon", "Samsung"] },
      { year: 2023, avg_pkg: 14.1, max_pkg: 64, placement_pct: 87, top_recruiters: ["Microsoft", "Google", "Adobe", "Oracle"] },
      { year: 2024, avg_pkg: 15.0, max_pkg: 60, placement_pct: 86, top_recruiters: ["Microsoft", "Google", "Amazon", "Walmart"] },
    ],
    cutoffExam: "JEE Main",
    cutoffBase: { 2023: 6800, 2024: 7800 },
  },
  {
    id: 11,
    name: "Christ University Bangalore",
    city: "Bengaluru",
    state: "Karnataka",
    type: CollegeType.DEEMED,
    streams: ["Commerce", "Management", "Arts", "Science", "Law"],
    nirf_rank: 67,
    established: 1969,
    accreditation: "NAAC A+",
    website: "https://christuniversity.in",
    fees: [
      { course: "Commerce", degree: "B.Com", annual_fee: 185000 },
      { course: "Business Administration", degree: "BBA", annual_fee: 245000 },
      { course: "Economics", degree: "BA", annual_fee: 145000 },
    ],
    placements: [
      { year: 2022, avg_pkg: 5.8, max_pkg: 21.5, placement_pct: 78, top_recruiters: ["Deloitte", "KPMG", "EY", "Goldman Sachs"] },
      { year: 2023, avg_pkg: 6.4, max_pkg: 22, placement_pct: 80, top_recruiters: ["Deloitte", "KPMG", "PwC", "Accenture"] },
      { year: 2024, avg_pkg: 6.8, max_pkg: 24, placement_pct: 81, top_recruiters: ["Deloitte", "EY", "Goldman Sachs", "Wells Fargo"] },
    ],
    cutoffExam: "CUET",
    cutoffBase: { 2023: 760, 2024: 770 },
  },
  {
    id: 12,
    name: "Symbiosis Pune",
    city: "Pune",
    state: "Maharashtra",
    type: CollegeType.DEEMED,
    streams: ["Management", "Law", "Arts", "Mass Communication"],
    nirf_rank: 32,
    established: 1971,
    accreditation: "NAAC A++",
    website: "https://www.siu.edu.in",
    fees: [
      { course: "Business Administration", degree: "BBA", annual_fee: 395000 },
      { course: "Economics", degree: "B.Sc", annual_fee: 285000 },
      { course: "Liberal Arts", degree: "BA", annual_fee: 475000 },
    ],
    placements: [
      { year: 2022, avg_pkg: 6.7, max_pkg: 24, placement_pct: 76, top_recruiters: ["Deloitte", "KPMG", "Accenture", "ICICI Bank"] },
      { year: 2023, avg_pkg: 7.2, max_pkg: 26, placement_pct: 79, top_recruiters: ["Deloitte", "PwC", "EY", "HDFC Bank"] },
      { year: 2024, avg_pkg: 7.8, max_pkg: 28, placement_pct: 80, top_recruiters: ["Deloitte", "KPMG", "Accenture", "TresVista"] },
    ],
    cutoffExam: "CUET",
    cutoffBase: { 2023: 720, 2024: 735 },
  },
  {
    id: 13,
    name: "SRCC Delhi",
    city: "New Delhi",
    state: "Delhi",
    type: CollegeType.GOVT,
    streams: ["Commerce", "Economics"],
    nirf_rank: 19,
    established: 1926,
    accreditation: "NAAC A++",
    website: "https://www.srcc.edu",
    fees: [
      { course: "Commerce", degree: "B.Com (Hons)", annual_fee: 33000 },
      { course: "Economics", degree: "BA (Hons)", annual_fee: 33000 },
    ],
    placements: [
      { year: 2022, avg_pkg: 9.4, max_pkg: 30.6, placement_pct: 82, top_recruiters: ["McKinsey", "BCG", "Bain", "Deloitte"] },
      { year: 2023, avg_pkg: 10.1, max_pkg: 35, placement_pct: 84, top_recruiters: ["McKinsey", "BCG", "Bain", "EY"] },
      { year: 2024, avg_pkg: 10.8, max_pkg: 35, placement_pct: 83, top_recruiters: ["McKinsey", "BCG", "Bain", "KPMG"] },
    ],
    cutoffExam: "CUET",
    cutoffBase: { 2023: 782, 2024: 785 },
  },
  {
    id: 14,
    name: "LSR Delhi",
    city: "New Delhi",
    state: "Delhi",
    type: CollegeType.GOVT,
    streams: ["Arts", "Commerce", "Economics", "Science"],
    nirf_rank: 10,
    established: 1956,
    accreditation: "NAAC A++",
    website: "https://lsr.edu.in",
    fees: [
      { course: "Economics", degree: "BA (Hons)", annual_fee: 23800 },
      { course: "Psychology", degree: "BA (Hons)", annual_fee: 23800 },
      { course: "Commerce", degree: "B.Com (Hons)", annual_fee: 23800 },
    ],
    placements: [
      { year: 2022, avg_pkg: 7.5, max_pkg: 32, placement_pct: 72, top_recruiters: ["Bain", "BCG", "Deloitte", "KPMG"] },
      { year: 2023, avg_pkg: 8.3, max_pkg: 44.8, placement_pct: 75, top_recruiters: ["Bain", "BCG", "EY", "Accenture"] },
      { year: 2024, avg_pkg: 8.8, max_pkg: 37.8, placement_pct: 76, top_recruiters: ["Bain", "Deloitte", "KPMG", "LEK"] },
    ],
    cutoffExam: "CUET",
    cutoffBase: { 2023: 770, 2024: 778 },
  },
  {
    id: 15,
    name: "St. Xaviers Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    type: CollegeType.PRIVATE,
    streams: ["Arts", "Science", "Commerce", "Mass Communication"],
    nirf_rank: 89,
    established: 1869,
    accreditation: "NAAC A+",
    website: "https://xaviers.ac",
    fees: [
      { course: "Arts", degree: "BA", annual_fee: 7500 },
      { course: "Science", degree: "B.Sc", annual_fee: 9500 },
      { course: "Mass Media", degree: "BMM", annual_fee: 38000 },
    ],
    placements: [
      { year: 2022, avg_pkg: 4.8, max_pkg: 14, placement_pct: 61, top_recruiters: ["Deloitte", "KPMG", "TCS", "Larsen & Toubro"] },
      { year: 2023, avg_pkg: 5.2, max_pkg: 16, placement_pct: 64, top_recruiters: ["Deloitte", "EY", "TCS", "HDFC Bank"] },
      { year: 2024, avg_pkg: 5.5, max_pkg: 18, placement_pct: 65, top_recruiters: ["Deloitte", "KPMG", "Accenture", "ICICI Bank"] },
    ],
    cutoffExam: "CUET",
    cutoffBase: { 2023: 710, 2024: 720 },
  },
  {
    id: 16,
    name: "AIIMS Delhi",
    city: "New Delhi",
    state: "Delhi",
    type: CollegeType.GOVT,
    streams: ["Medicine", "Nursing", "Paramedical", "Research"],
    nirf_rank: 1,
    established: 1956,
    accreditation: "Institute of National Importance",
    website: "https://www.aiims.edu",
    fees: [
      { course: "Medicine and Surgery", degree: "MBBS", annual_fee: 1650 },
      { course: "Nursing", degree: "B.Sc", annual_fee: 2400 },
      { course: "Optometry", degree: "B.Sc", annual_fee: 3100 },
    ],
    placements: [
      { year: 2022, avg_pkg: 13.2, max_pkg: 28, placement_pct: 96, top_recruiters: ["AIIMS", "Apollo Hospitals", "Fortis", "Max Healthcare"] },
      { year: 2023, avg_pkg: 14.0, max_pkg: 30, placement_pct: 97, top_recruiters: ["AIIMS", "Apollo Hospitals", "Medanta", "Fortis"] },
      { year: 2024, avg_pkg: 14.8, max_pkg: 32, placement_pct: 97, top_recruiters: ["AIIMS", "Max Healthcare", "Medanta", "Fortis"] },
    ],
    cutoffExam: "NEET UG",
    cutoffBase: { 2023: 57, 2024: 47 },
  },
  {
    id: 17,
    name: "CMC Vellore",
    city: "Vellore",
    state: "Tamil Nadu",
    type: CollegeType.PRIVATE,
    streams: ["Medicine", "Nursing", "Allied Health", "Research"],
    nirf_rank: 3,
    established: 1900,
    accreditation: "NAAC A++",
    website: "https://www.cmch-vellore.edu",
    fees: [
      { course: "Medicine and Surgery", degree: "MBBS", annual_fee: 53000 },
      { course: "Nursing", degree: "B.Sc", annual_fee: 35000 },
      { course: "Allied Health Sciences", degree: "B.Sc", annual_fee: 48000 },
    ],
    placements: [
      { year: 2022, avg_pkg: 9.2, max_pkg: 22, placement_pct: 94, top_recruiters: ["CMC Vellore", "Apollo Hospitals", "Aster DM", "Narayana Health"] },
      { year: 2023, avg_pkg: 10.0, max_pkg: 24, placement_pct: 95, top_recruiters: ["CMC Vellore", "Apollo Hospitals", "Fortis", "Manipal Hospitals"] },
      { year: 2024, avg_pkg: 10.5, max_pkg: 25, placement_pct: 95, top_recruiters: ["CMC Vellore", "Apollo Hospitals", "Aster DM", "Fortis"] },
    ],
    cutoffExam: "NEET UG",
    cutoffBase: { 2023: 240, 2024: 260 },
  },
  {
    id: 18,
    name: "Kasturba Medical College",
    city: "Manipal",
    state: "Karnataka",
    type: CollegeType.DEEMED,
    streams: ["Medicine", "Allied Health", "Research"],
    nirf_rank: 9,
    established: 1953,
    accreditation: "NAAC A++",
    website: "https://manipal.edu/kmc-manipal.html",
    fees: [
      { course: "Medicine and Surgery", degree: "MBBS", annual_fee: 1770000 },
      { course: "Medical Laboratory Technology", degree: "B.Sc", annual_fee: 184000 },
      { course: "Radiotherapy Technology", degree: "B.Sc", annual_fee: 184000 },
    ],
    placements: [
      { year: 2022, avg_pkg: 8.8, max_pkg: 20, placement_pct: 90, top_recruiters: ["Manipal Hospitals", "Apollo Hospitals", "Fortis", "Aster DM"] },
      { year: 2023, avg_pkg: 9.4, max_pkg: 22, placement_pct: 91, top_recruiters: ["Manipal Hospitals", "Apollo Hospitals", "Narayana Health", "Fortis"] },
      { year: 2024, avg_pkg: 9.8, max_pkg: 23, placement_pct: 91, top_recruiters: ["Manipal Hospitals", "Apollo Hospitals", "Aster DM", "Fortis"] },
    ],
    cutoffExam: "NEET UG",
    cutoffBase: { 2023: 51000, 2024: 54000 },
  },
  {
    id: 19,
    name: "NLU Delhi",
    city: "New Delhi",
    state: "Delhi",
    type: CollegeType.GOVT,
    streams: ["Law"],
    nirf_rank: 2,
    established: 2008,
    accreditation: "UGC Recognized",
    website: "https://nludelhi.ac.in",
    fees: [
      { course: "Law", degree: "BA LL.B (Hons)", annual_fee: 186000 },
      { course: "Law", degree: "LL.M", annual_fee: 139000 },
    ],
    placements: [
      { year: 2022, avg_pkg: 16.0, max_pkg: 45, placement_pct: 88, top_recruiters: ["Khaitan & Co", "Shardul Amarchand Mangaldas", "Trilegal", "AZB & Partners"] },
      { year: 2023, avg_pkg: 17.5, max_pkg: 50, placement_pct: 90, top_recruiters: ["Khaitan & Co", "Cyril Amarchand Mangaldas", "Trilegal", "Luthra and Luthra"] },
      { year: 2024, avg_pkg: 18.2, max_pkg: 52, placement_pct: 91, top_recruiters: ["Shardul Amarchand Mangaldas", "Khaitan & Co", "AZB & Partners", "Trilegal"] },
    ],
    cutoffExam: "AILET",
    cutoffBase: { 2023: 62, 2024: 66 },
  },
  {
    id: 20,
    name: "NLSIU Bangalore",
    city: "Bengaluru",
    state: "Karnataka",
    type: CollegeType.GOVT,
    streams: ["Law", "Public Policy"],
    nirf_rank: 1,
    established: 1986,
    accreditation: "UGC Recognized",
    website: "https://www.nls.ac.in",
    fees: [
      { course: "Law", degree: "BA LL.B (Hons)", annual_fee: 327815 },
      { course: "Law", degree: "LL.M", annual_fee: 266000 },
    ],
    placements: [
      { year: 2022, avg_pkg: 17.5, max_pkg: 48, placement_pct: 92, top_recruiters: ["Khaitan & Co", "Trilegal", "AZB & Partners", "Cyril Amarchand Mangaldas"] },
      { year: 2023, avg_pkg: 19.0, max_pkg: 50, placement_pct: 94, top_recruiters: ["Khaitan & Co", "Shardul Amarchand Mangaldas", "Trilegal", "JSA"] },
      { year: 2024, avg_pkg: 20.0, max_pkg: 55, placement_pct: 94, top_recruiters: ["Cyril Amarchand Mangaldas", "Khaitan & Co", "AZB & Partners", "Trilegal"] },
    ],
    cutoffExam: "CLAT",
    cutoffBase: { 2023: 114, 2024: 99 },
  },
];

function buildCutoffs(college: CollegeSeed) {
  const cutoffValues = {
    2022: Number((college.cutoffBase[2023] * 1.08).toFixed(2)),
    2023: college.cutoffBase[2023],
    2024: college.cutoffBase[2024],
  };

  return ([2022, 2023, 2024] as const).flatMap((year) =>
    Object.values(CutoffCategory).map((category) => ({
      college_id: college.id,
      exam: college.cutoffExam,
      year,
      category,
      cutoff_value: Number((cutoffValues[year] * categoryMultiplier[category]).toFixed(2)),
    })),
  );
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required. Set it in .env or run: $env:DATABASE_URL="postgresql://..." ; npx prisma db seed');
  }

  for (const college of colleges) {
    await prisma.college.upsert({
      where: { id: college.id },
      update: {
        name: college.name,
        city: college.city,
        state: college.state,
        type: college.type,
        streams: college.streams,
        nirf_rank: college.nirf_rank,
        established: college.established,
        accreditation: college.accreditation,
        website: college.website,
      },
      create: {
        id: college.id,
        name: college.name,
        city: college.city,
        state: college.state,
        type: college.type,
        streams: college.streams,
        nirf_rank: college.nirf_rank,
        established: college.established,
        accreditation: college.accreditation,
        website: college.website,
      },
    });

    for (const fee of college.fees) {
      await prisma.courseFee.upsert({
        where: {
          college_id_course_degree: {
            college_id: college.id,
            course: fee.course,
            degree: fee.degree,
          },
        },
        update: {
          annual_fee: fee.annual_fee,
        },
        create: {
          college_id: college.id,
          course: fee.course,
          degree: fee.degree,
          annual_fee: fee.annual_fee,
        },
      });
    }

    for (const placement of college.placements) {
      await prisma.placementStat.upsert({
        where: {
          college_id_year: {
            college_id: college.id,
            year: placement.year,
          },
        },
        update: {
          avg_pkg: placement.avg_pkg,
          max_pkg: placement.max_pkg,
          placement_pct: placement.placement_pct,
          top_recruiters: placement.top_recruiters,
        },
        create: {
          college_id: college.id,
          year: placement.year,
          avg_pkg: placement.avg_pkg,
          max_pkg: placement.max_pkg,
          placement_pct: placement.placement_pct,
          top_recruiters: placement.top_recruiters,
        },
      });
    }

    for (const cutoff of buildCutoffs(college)) {
      await prisma.admissionCutoff.upsert({
        where: {
          college_id_exam_year_category: {
            college_id: cutoff.college_id,
            exam: cutoff.exam,
            year: cutoff.year,
            category: cutoff.category,
          },
        },
        update: {
          cutoff_value: cutoff.cutoff_value,
        },
        create: cutoff,
      });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
