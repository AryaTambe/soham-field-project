export const categories = {
  electrotherapy: {
    title: 'Electrotherapy',
    description: 'Modern electrotherapy equipment for physiotherapy and rehabilitation workflows.',
  },
  'exercise-rehab': {
    title: 'Exercise & Rehab',
    description: 'Equipment designed around movement, exercise and recovery.',
  },
  'treatment-furniture': {
    title: 'Treatment Furniture',
    description: 'Practical furniture and equipment for professional treatment spaces.',
  },
  accessories: {
    title: 'Accessories & More',
    description: 'Supporting accessories and consumables for physiotherapy setups.',
  },
};

export type CategoryKey = keyof typeof categories;

export type Product = {
  name: string;
  image: string;
  description: string;
  specs: string[];
  price: number;
};

export const products: Record<CategoryKey, Product[]> = {
  electrotherapy: [
    {
      name: 'TENS 5000',
      image: '/assets/products/tens-5000.jpg',
      description: 'Digital TENS unit for pain relief with dual channel output.',
      specs: ['2 channels', 'Rechargeable', '1 year warranty'],
      price: 4999,
    },
    {
      name: 'Ultrasound Therapy 1MHz',
      image: '/assets/products/ultrasound.jpg',
      description: 'Portable ultrasound therapy machine with digital timer.',
      specs: ['1 MHz frequency', 'Digital timer', 'Carry case included'],
      price: 18500,
    },
  ],
  'exercise-rehab': [
    {
      name: 'Rehab Exercise Ball',
      image: '/assets/products/exercise-ball.jpg',
      description: 'Anti-burst gym ball suitable for physiotherapy exercises.',
      specs: ['65 cm', 'Anti-burst', 'Pump included'],
      price: 899,
    },
  ],
  'treatment-furniture': [
    {
      name: 'Treatment Table',
      image: '/assets/products/treatment-table.jpg',
      description: 'Height-adjustable treatment table with padded top.',
      specs: ['Adjustable height', 'Foam padding', 'Sturdy frame'],
      price: 12000,
    },
  ],
  accessories: [
    {
      name: 'Electrode Pads (Pack of 4)',
      image: '/assets/products/electrode-pads.jpg',
      description: 'Self-adhesive electrode pads for TENS and EMS machines.',
      specs: ['Pack of 4', 'Reusable', 'Universal fit'],
      price: 350,
    },
  ],
};
