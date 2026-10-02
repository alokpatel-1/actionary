/** Common Indian male first names for auto-filling driverName. */
export const INDIAN_MALE_NAMES: string[] = [
  'Ram',
  'Amit',
  'Rahul',
  'Suresh',
  'Vikram',
  'Rajesh',
  'Anil',
  'Sanjay',
  'Deepak',
  'Manoj',
  'Ravi',
  'Ajay',
  'Sunil',
  'Pradeep',
  'Naveen',
  'Karan',
  'Arjun',
  'Rohit',
  'Vishal',
  'Nikhil',
  'Gaurav',
  'Sandeep',
  'Ashok',
  'Mahesh',
  'Dinesh',
  'Pankaj',
  'Yogesh',
  'Harish',
  'Mukesh',
  'Vivek',
  'Abhishek',
  'Sachin',
  'Ankit',
  'Mohit',
  'Varun',
  'Kunal',
  'Aditya',
  'Shubham',
  'Prashant',
  'Hemant',
];

export function randomIndianMaleName(exclude?: string): string {
  const pool = exclude
    ? INDIAN_MALE_NAMES.filter((n) => n !== exclude)
    : INDIAN_MALE_NAMES;
  const list = pool.length ? pool : INDIAN_MALE_NAMES;
  return list[Math.floor(Math.random() * list.length)];
}
