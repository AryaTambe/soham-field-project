import { NextResponse } from 'next/server';
import { categories, products } from '@/lib/products';

export async function GET() {
  return NextResponse.json({ categories, products });
}
