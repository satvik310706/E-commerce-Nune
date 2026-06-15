import React from 'react';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductDetailClient from './ProductDetailClient';

export const dynamic = 'force-dynamic';

async function getProductData(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: { category: true },
    });

    if (!product) return null;

    // Fetch related products in the same category (limit to 4, excluding current product)
    const relatedProducts = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        NOT: { id: product.id },
        isActive: true,
      },
      take: 4,
    });

    // Format fields
    const formattedProduct = {
      ...product,
      images: JSON.parse(product.images),
      benefits: JSON.parse(product.benefits),
      ingredients: product.ingredients ? JSON.parse(product.ingredients) : [],
      usage: product.usage ? JSON.parse(product.usage) : [],
    };

    return { product: formattedProduct, relatedProducts };
  } catch (err) {
    console.error('Error fetching product detail data:', err);
    return null;
  }
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const data = await getProductData(params.slug);

  if (!data) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <ProductDetailClient product={data.product} relatedProducts={data.relatedProducts} />
      <Footer />
    </>
  );
}
