import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// PUT /api/products/[id] - Update product details (Admin Only)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const {
      name,
      nameTe,
      slug,
      description,
      images,
      price,
      mrp,
      sku,
      stock,
      unit,
      weight,
      categoryId,
      benefits,
      ingredients,
      usage,
      isActive,
    } = body;

    // Verify product exists
    const productExists = await prisma.product.findUnique({ where: { id } });
    if (!productExists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        nameTe,
        slug,
        description,
        images: images ? JSON.stringify(images) : undefined,
        price: price ? parseFloat(price.toString()) : undefined,
        mrp: mrp ? parseFloat(mrp.toString()) : undefined,
        sku,
        stock: stock !== undefined ? parseInt(stock.toString()) : undefined,
        unit,
        weight: weight ? parseFloat(weight.toString()) : undefined,
        categoryId,
        benefits: benefits ? JSON.stringify(benefits) : undefined,
        ingredients: ingredients ? JSON.stringify(ingredients) : undefined,
        usage: usage ? JSON.stringify(usage) : undefined,
        isActive,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (err: any) {
    console.error('Error updating product:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Delete product (Admin Only)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin role required.' }, { status: 401 });
    }

    const { id } = params;

    // Verify product exists
    const productExists = await prisma.product.findUnique({ where: { id } });
    if (!productExists) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // We can either delete it or soft-delete it by setting isActive to false. Let's do hard delete for clean inventory management
    await prisma.product.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Product deleted successfully' });
  } catch (err: any) {
    console.error('Error deleting product:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
