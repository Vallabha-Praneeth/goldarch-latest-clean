/**
 * POST /api/plans/upload
 * Upload a construction plan PDF/image and create a processing job
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: (cookies) => {
            cookies.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse multipart form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 3. Validate file type
    const validTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp'
    ];

    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Accepted: PDF, JPEG, PNG, WebP' },
        { status: 400 }
      );
    }

    // 4. Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size: 50MB' },
        { status: 400 }
      );
    }

    // 5. Determine file type
    const fileType = file.type === 'application/pdf' ? 'pdf' : 'image';

    // 6. Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomStr}.${extension}`;
    const filePath = `${user.id}/${filename}`;  // No "plans/" prefix - bucket handles that

    // 7. Upload to Supabase Storage
    console.log('Uploading to Supabase Storage:', filePath);
    const fileBuffer = await file.arrayBuffer();
    console.log('File buffer size:', fileBuffer.byteLength);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('plans')
      .upload(filePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('=== STORAGE UPLOAD ERROR ===');
      console.error('Error:', uploadError);
      console.error('File path:', filePath);
      console.error('File type:', file.type);
      console.error('File size:', file.size);
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      );
    }

    console.log('Storage upload successful:', uploadData);

    // 8. Create plan_jobs record
    console.log('Creating plan_jobs record...');
    const { data: jobData, error: jobError } = await supabase
      .from('plan_jobs')
      .insert({
        user_id: user.id,
        file_path: filePath,
        file_type: fileType,
        status: 'queued',
      })
      .select()
      .single();

    if (jobError) {
      console.error('=== JOB CREATION ERROR ===');
      console.error('Error:', jobError);
      console.error('User ID:', user.id);
      console.error('File path:', filePath);
      console.error('File type:', fileType);

      // Cleanup uploaded file if job creation fails
      await supabase.storage.from('plans').remove([filePath]);

      return NextResponse.json(
        { error: 'Failed to create processing job', details: jobError.message },
        { status: 500 }
      );
    }

    console.log('Job created successfully:', jobData.id);

    // 9. Return success response
    return NextResponse.json({
      jobId: jobData.id,
      filePath: filePath,
      status: jobData.status,
      message: 'File uploaded successfully. Processing will begin shortly.',
    });

  } catch (error) {
    console.error('=== UPLOAD ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack');
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
