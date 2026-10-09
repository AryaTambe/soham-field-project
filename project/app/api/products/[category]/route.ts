import { NextResponse } from 'next/server';
import { categories, products, type CategoryKey } from '@/lib/products';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ category: string }> },
) {
  const { category } = await params;
  if (!Object.hasOwn(categories, category)) {
    return NextResponse.json({ message: 'Category not found.' }, { status: 404 });
  }

  const key = category as CategoryKey;
  return NextResponse.json({
    category: categories[key],
    products: products[key],
  });
}
